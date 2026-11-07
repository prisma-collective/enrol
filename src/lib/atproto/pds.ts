/**
 * enrol's own identity on a Prisma PDS (at-pds), and the calls it makes.
 *
 * D25: enrol publishes what it knows from its own repo, under its own DID,
 * and never writes into a hub's repo. at-pds signs a client in with a
 * Cardano wallet (CIP-30 signData), so enrol holds an Ed25519 key of its
 * own and answers the sign-in challenge the way a wallet does.
 */
import { createPrivateKey, createPublicKey, sign, type KeyObject } from 'node:crypto';
import { blake2b } from '@noble/hashes/blake2.js';
import { rewardAddressHexToBech32 } from '@/lib/cardano/stakeAddress';

type Cbor = number | Uint8Array | string | boolean | Cbor[] | Map<number | string, Cbor>;

function head(major: number, n: number): number[] {
  const m = major << 5;
  if (n < 24) return [m | n];
  if (n < 0x100) return [m | 24, n];
  if (n < 0x10000) return [m | 25, n >> 8, n & 0xff];
  return [m | 26, (n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

// Just enough CBOR for COSE_Sign1 and COSE_Key (CIP-8).
function cbor(v: Cbor): number[] {
  if (typeof v === 'number') return v >= 0 ? head(0, v) : head(1, -1 - v);
  if (typeof v === 'boolean') return [v ? 0xf5 : 0xf4];
  if (typeof v === 'string') {
    const b = new TextEncoder().encode(v);
    return [...head(3, b.length), ...b];
  }
  if (v instanceof Uint8Array) return [...head(2, v.length), ...v];
  if (Array.isArray(v)) return [...head(4, v.length), ...v.flatMap(cbor)];
  return [...head(5, v.size), ...[...v].flatMap(([k, x]) => [...cbor(k), ...cbor(x)])];
}

const toHex = (b: number[] | Uint8Array) => Buffer.from(b).toString('hex');

// PKCS#8 prefix for a raw Ed25519 seed (RFC 8410).
const ED25519_PKCS8 = Buffer.from('302e020100300506032b657004220420', 'hex');

export type Network = 'mainnet' | 'testnet';

/** A key that signs like a CIP-30 wallet. Its DID is did:cardano:<stake address>. */
export class WalletSigner {
  readonly did: string;
  private readonly key: KeyObject;
  private readonly publicKey: Uint8Array;
  private readonly address: Uint8Array;

  constructor(seedHex: string, network: Network) {
    if (!/^[0-9a-fA-F]{64}$/.test(seedHex)) throw new Error('the signing key must be 32 bytes of hex');
    this.key = createPrivateKey({ key: Buffer.concat([ED25519_PKCS8, Buffer.from(seedHex, 'hex')]), format: 'der', type: 'pkcs8' });
    const spki = createPublicKey(this.key).export({ format: 'der', type: 'spki' });
    this.publicKey = new Uint8Array(spki.subarray(spki.length - 32));
    // A stake address: header (0xe0 testnet, 0xe1 mainnet) + blake2b-224 of the key.
    this.address = Uint8Array.from([network === 'mainnet' ? 0xe1 : 0xe0, ...blake2b(this.publicKey, { dkLen: 28 })]);
    this.did = `did:cardano:${rewardAddressHexToBech32(toHex(this.address))}`;
  }

  /** What a wallet's signData(address, hex(message)) returns. */
  signData(message: string): { signature: string; key: string } {
    const payload = new TextEncoder().encode(message);
    const protectedBytes = Uint8Array.from(cbor(new Map<number | string, Cbor>([[1, -8], ['address', this.address]])));
    const toSign = Uint8Array.from(cbor(['Signature1', protectedBytes, new Uint8Array(), payload]));
    const sig = new Uint8Array(sign(null, toSign, this.key));
    return {
      signature: toHex(cbor([protectedBytes, new Map([['hashed', false]]), payload, sig])),
      key: toHex(cbor(new Map<number | string, Cbor>([[1, 1], [3, -8], [-1, 6], [-2, this.publicKey]]))),
    };
  }
}

type Fetch = typeof fetch;

/** Calls at-pds as enrol. Signs in when it has no live session. */
export class PdsClient {
  private token: { value: string; expiresAt: number } | null = null;
  private readonly url: string;
  private readonly signer: WalletSigner;
  private readonly fetchImpl: Fetch;

  constructor(url: string, signer: WalletSigner, fetchImpl: Fetch = fetch) {
    this.url = url.replace(/\/+$/, '');
    this.signer = signer;
    this.fetchImpl = fetchImpl;
  }

  /** enrol's did:cardano: the DID it signs in as. */
  get did(): string {
    return this.signer.did;
  }

  private async call<T>(method: string, body: unknown, auth: boolean): Promise<T> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (auth) headers.authorization = `Bearer ${await this.session()}`;
    const res = await this.fetchImpl(`${this.url}/xrpc/${method}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method}: ${res.status} ${text.slice(0, 200)}`);
    return JSON.parse(text) as T;
  }

  private async session(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.token && this.token.expiresAt - 60 > now) return this.token.value;
    const { nonce, challenge } = await this.call<{ nonce: string; challenge: string }>(
      'com.prisma.auth.getChallenge',
      { did: this.signer.did },
      false,
    );
    const signed = this.signer.signData(challenge);
    const { token, expires_at } = await this.call<{ token: string; expires_at: number }>(
      'com.prisma.auth.login',
      { nonce, ...signed },
      false,
    );
    this.token = { value: token, expiresAt: expires_at };
    return token;
  }

  /** Creates enrol's own repo, once. Returns the repo DID (a did:plc). */
  async initiateRepo(name: string): Promise<string> {
    const res = await this.call<{ did: string }>(
      'com.prisma.repo.initiateRepo',
      // at-pds opens every repo with an enrollment record. enrol isn't a
      // stakeholder; "partner" is the closest of the four types.
      { did: this.signer.did, stakeholder_type: 'wQB7El', name, wallet_address: this.signer.did.slice('did:cardano:'.length) },
      true,
    );
    return res.did;
  }

  /** Writes a record to `repo` at `collection/rkey`, replacing any there. */
  async putRecord(repo: string, collection: string, rkey: string, record: Record<string, unknown>): Promise<{ cid: string }> {
    return this.call('com.prisma.repo.createRecord', { did: repo, collection, rkey, ...record }, true);
  }
}
