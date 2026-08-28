"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import IdentityFeedbackBanner from "@/components/identity/IdentityFeedbackBanner";
import { enableWallet, scanWallets, type WalletInfo } from "@/lib/cardano/wallet";
import { rewardAddressHexToBech32 } from "@/lib/cardano/stakeAddress";
import { checkDIDForStakeAddress, type DIDCheckResult } from "@/lib/did/client";

type LookupPhase = "idle" | "checking" | "result" | "error";

export default function IdentityLookupPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [connectedWalletKey, setConnectedWalletKey] = useState<string | null>(null);
  const [stakeAddress, setStakeAddress] = useState<string | null>(null);
  const [phase, setPhase] = useState<LookupPhase>("idle");
  const [result, setResult] = useState<DIDCheckResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const refreshWallets = useCallback(() => {
    const detected = scanWallets();
    setWallets(detected);
    if (detected.length === 0) {
      setWalletError("No Cardano wallet was detected in this browser.");
    } else {
      setWalletError(null);
    }
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

  const handleRefresh = useCallback(async () => {
    if (!connectedWalletKey) return;
    await runLookup(connectedWalletKey);
  }, [connectedWalletKey, runLookup]);

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
    <div className="flex min-h-[100svh] flex-col bg-black text-white">
      <IdentityFeedbackBanner />

      <div className="flex flex-1 items-center justify-center px-6 py-10 pt-28 sm:pt-24">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Check your DID</h1>
        <p className="text-gray-400 text-sm mb-8">
          Connect the same wallet you used on the DIDs dashboard, then refresh to check status.
        </p>

        {walletError && phase === "idle" && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200"
          >
            {walletError}
          </div>
        )}

        {lookupError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
          >
            {lookupError}
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className={`mb-4 rounded-lg border p-3 text-sm ${
              statusMessage.tone === "success"
                ? "border-green-800 bg-green-950/30 text-green-200"
                : statusMessage.tone === "warning"
                  ? "border-amber-800 bg-amber-950/30 text-amber-200"
                  : "border-red-800 bg-red-950/40 text-red-200"
            }`}
          >
            {statusMessage.text}
            {result?.did && (
              <p className="mt-2 break-all font-mono text-xs opacity-90">{result.did}</p>
            )}
          </div>
        )}

        {phase !== "checking" && (
          <div className="grid gap-2 mb-4">
            {wallets.map((wallet) => (
              <button
                key={wallet.key}
                type="button"
                onClick={() => runLookup(wallet.key)}
                className="flex items-center justify-center gap-2 bg-gray-900 text-white border border-gray-700 px-4 py-3 rounded-lg hover:border-gray-500 transition-colors cursor-pointer"
              >
                {wallet.icon && (
                  <img src={wallet.icon} alt="" className="w-5 h-5 rounded" />
                )}
                Connect {wallet.name}
              </button>
            ))}
          </div>
        )}

        {phase === "checking" && (
          <p className="text-gray-400 text-sm text-center mb-4">Checking DID status…</p>
        )}

        {wallets.length === 0 && (
          <button
            type="button"
            onClick={refreshWallets}
            className="w-full mb-4 bg-gray-900 text-white border border-gray-700 px-4 py-3 rounded-lg hover:border-gray-500 transition-colors cursor-pointer"
          >
            Check for wallet
          </button>
        )}

        {connectedWalletKey && stakeAddress && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={phase === "checking"}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg hover:border-gray-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {phase === "checking" ? "Refreshing…" : "Refresh status"}
          </button>
        )}

        {result?.status === "active" && (
          <Link
            href="/event"
            className="block mt-4 text-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            Register for an event &rarr;
          </Link>
        )}
      </div>
      </div>
    </div>
  );
}
