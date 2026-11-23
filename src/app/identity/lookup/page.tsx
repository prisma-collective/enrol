"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiArrowUpRight, FiCheck, FiCopy, FiRefreshCw } from "react-icons/fi";
import IdentityFeedbackBanner from "@/components/identity/IdentityFeedbackBanner";
import { HelpTip } from "@/components/HelpTip";
import { enableWallet, scanWallets, type WalletInfo } from "@/lib/cardano/wallet";
import { rewardAddressHexToBech32 } from "@/lib/cardano/stakeAddress";
import { checkDIDForStakeAddress, type DIDCheckResult } from "@/lib/did/client";

type LookupPhase = "idle" | "checking" | "result" | "error";

export default function IdentityLookupPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showNoWallet, setShowNoWallet] = useState(false);
  const [connectedWalletKey, setConnectedWalletKey] = useState<string | null>(null);
  const [stakeAddress, setStakeAddress] = useState<string | null>(null);
  const [phase, setPhase] = useState<LookupPhase>("idle");
  const [result, setResult] = useState<DIDCheckResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refreshWallets = useCallback(() => {
    const detected = scanWallets();
    setWallets(detected);
    if (detected.length > 0) setShowNoWallet(false);
    return detected;
  }, []);

  useEffect(() => {
    refreshWallets();
    const timeout = window.setTimeout(refreshWallets, 1000);
    return () => window.clearTimeout(timeout);
  }, [refreshWallets]);

  const runLookup = useCallback(async (walletKey: string) => {
    setPhase("checking");
    setLookupError(null);
    setResult(null);
    setShowPicker(false);

    try {
      const api = await enableWallet(walletKey);
      const rewardAddresses = await api.getRewardAddresses();
      if (!rewardAddresses?.length) {
        throw new Error("No stake address was found in this wallet");
      }

      const bech32 = rewardAddressHexToBech32(rewardAddresses[0]);
      setConnectedWalletKey(walletKey);
      setStakeAddress(bech32);

      const checkResult = await checkDIDForStakeAddress(bech32);
      setResult(checkResult);
      setPhase("result");
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Unable to verify this wallet");
      setPhase("error");
    }
  }, []);

  const handleConnectClick = () => {
    const detected = refreshWallets();
    if (detected.length === 1) {
      void runLookup(detected[0].key);
      return;
    }
    if (detected.length > 1) {
      setShowNoWallet(false);
      setShowPicker((p) => !p);
      return;
    }
    setShowPicker(false);
    setShowNoWallet(true);
  };

  const handleRefresh = useCallback(async () => {
    if (!connectedWalletKey) return;
    await runLookup(connectedWalletKey);
  }, [connectedWalletKey, runLookup]);

  const copyDid = async (did: string) => {
    try {
      await navigator.clipboard.writeText(did);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const statusMessage = (() => {
    if (!result) return null;
    switch (result.status) {
      case "active":
        return {
          tone: "success" as const,
          text: "Your DID is active on-chain.",
        };
      case "not_found":
        return {
          tone: "warning" as const,
          text: "No active DID found yet. If you just created one on the dashboard, wait 20–90 seconds and refresh.",
        };
      case "revoked":
        return {
          tone: "error" as const,
          text: "This wallet's DID has been revoked. Create or update your DID on the dashboard.",
        };
      default:
        return {
          tone: "error" as const,
          text: result.error || "DID check failed. Please retry.",
        };
    }
  })();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Sticky solid-opaque page hero */}
      <section className="hero-grad-sticky px-5 sm:px-8 py-5 border-b border-[var(--color-rule)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm font-medium text-[var(--color-hub-soft)] tracking-[0.2em] uppercase">
              Step 02 · Identity verification
            </div>
            <h1 className="display text-4xl sm:text-5xl leading-none uppercase text-white mt-2">
              Check your DID
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-mute)] mt-2.5 max-w-2xl leading-relaxed">
              Connect the wallet you used on the DIDs dashboard to confirm your on-chain status.
            </p>
          </div>
          <div className="shrink-0 self-start sm:self-center">
            <IdentityFeedbackBanner />
          </div>
        </div>
      </section>

      <main className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-5 py-10">
        <div className="card w-full max-w-md p-6 sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-medium tracking-tight text-white">
                  Wallet verification
                </h2>
                <HelpTip label="About wallet verification" title="Read-only stake check" align="right">
                  Connecting only reads your Cardano stake address to check whether an active DID exists on-chain. Nothing is spent or transferred.
                </HelpTip>
              </div>
              <p className="text-sm text-[var(--color-mute)] mt-1">
                {phase === "checking"
                  ? "Checking on-chain DID status…"
                  : "Connect your wallet to look up your DID."}
              </p>
            </div>
          </div>

          {lookupError && (
            <div
              role="alert"
              className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] p-3.5 text-sm text-[#fecaca]"
            >
              {lookupError}
            </div>
          )}

          {statusMessage && (
            <div
              role="status"
              className={`rounded-xl border p-4 text-sm space-y-2.5 ${
                statusMessage.tone === "success"
                  ? "border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)] text-[#d1fae5]"
                  : statusMessage.tone === "warning"
                    ? "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.09)] text-[#fde68a]"
                    : "border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] text-[#fecaca]"
              }`}
            >
              <p>{statusMessage.text}</p>
              {result?.did && (
                <div className="rounded-lg bg-[var(--color-void)] border border-[var(--color-rule)] p-2.5 flex items-center justify-between gap-2">
                  <code className="font-mono text-xs text-[var(--color-flow)] break-all">
                    {result.did}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyDid(result.did!)}
                    className="btn btn-ghost btn-sm shrink-0"
                  >
                    {copied ? <FiCheck className="text-[var(--color-ok)]" /> : <FiCopy />}
                  </button>
                </div>
              )}
            </div>
          )}

          {phase !== "checking" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConnectClick}
                className="btn btn-primary w-full py-2.5"
              >
                {wallets.length === 1 ? `Connect ${wallets[0].name}` : "Connect wallet"}
              </button>

              {showPicker && wallets.length > 1 && (
                <div className="rounded-xl bg-[var(--color-void)] border border-[var(--color-rule)] p-2.5 space-y-1.5">
                  <div className="text-xs text-[var(--color-mute)] px-1.5 pb-0.5">
                    Choose a wallet
                  </div>
                  {wallets.map((wallet) => (
                    <button
                      key={wallet.key}
                      type="button"
                      onClick={() => runLookup(wallet.key)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text)] bg-[var(--color-panel-2)] hover:bg-[var(--color-elevated)] border border-[var(--color-rule)] transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2">
                        {wallet.icon && (
                          <img src={wallet.icon} alt="" className="w-4 h-4 rounded" />
                        )}
                        {wallet.name}
                      </span>
                      <FiArrowRight className="text-[var(--color-mute)]" />
                    </button>
                  ))}
                </div>
              )}

              {showNoWallet && wallets.length === 0 && (
                <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--color-rule-strong)] p-4 text-sm space-y-2.5">
                  <div className="text-[var(--color-text)] font-medium">
                    No Cardano wallet found in this browser
                  </div>
                  <p className="text-[var(--color-mute)] leading-relaxed">
                    Install Eternl or Lace, or open this page inside your wallet&apos;s browser.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <a
                      href="https://eternl.io"
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm"
                    >
                      Get Eternl <FiArrowUpRight />
                    </a>
                    <a
                      href="https://www.lace.io"
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm"
                    >
                      Get Lace <FiArrowUpRight />
                    </a>
                    <button
                      type="button"
                      onClick={handleConnectClick}
                      className="btn btn-ghost btn-sm"
                    >
                      <FiRefreshCw className="text-xs" /> Check again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {connectedWalletKey && stakeAddress && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={phase === "checking"}
              className="btn w-full"
            >
              <FiRefreshCw className={phase === "checking" ? "animate-spin" : ""} />
              {phase === "checking" ? "Refreshing…" : "Refresh status"}
            </button>
          )}

          {result?.status === "active" && (
            <Link href="/event" className="btn btn-primary w-full">
              <span>Continue to event enrolment</span>
              <FiArrowRight />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
