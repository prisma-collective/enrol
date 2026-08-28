const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function polymod(values: number[]) {
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;

  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;

    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) chk ^= generators[i];
    }
  }

  return chk;
}

function expandHrp(hrp: string) {
  const expanded: number[] = [];
  for (let i = 0; i < hrp.length; i += 1) expanded.push(hrp.charCodeAt(i) >> 5);
  expanded.push(0);
  for (let i = 0; i < hrp.length; i += 1) expanded.push(hrp.charCodeAt(i) & 31);
  return expanded;
}

function convertBits(data: number[], fromBits: number, toBits: number) {
  let acc = 0;
  let bits = 0;
  const maxv = (1 << toBits) - 1;
  const converted: number[] = [];

  for (const value of data) {
    if (value < 0 || value >> fromBits !== 0) throw new Error("Invalid address bytes");
    acc = (acc << fromBits) | value;
    bits += fromBits;

    while (bits >= toBits) {
      bits -= toBits;
      converted.push((acc >> bits) & maxv);
    }
  }

  if (bits > 0) converted.push((acc << (toBits - bits)) & maxv);
  return converted;
}

function bech32Encode(hrp: string, data: number[]) {
  const values = [...expandHrp(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const mod = polymod(values) ^ 1;
  const checksum = Array.from({ length: 6 }, (_, index) => (mod >> (5 * (5 - index))) & 31);
  return `${hrp}1${[...data, ...checksum].map((value) => BECH32_ALPHABET[value]).join("")}`;
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Wallet returned an invalid stake address");
  }

  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

export function rewardAddressHexToBech32(hexAddress: string): string {
  const bytes = hexToBytes(hexAddress);
  if (bytes.length < 2) throw new Error("Wallet did not return a usable stake address");

  const networkId = bytes[0] & 0x0f;
  const prefix = networkId === 1 ? "stake" : "stake_test";
  return bech32Encode(prefix, convertBits(bytes, 8, 5));
}
