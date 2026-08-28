export type DIDStatus = "active" | "not_found" | "revoked" | "error";

export type DIDCheckResult = {
  status: DIDStatus;
  did: string | null;
  error: string | null;
  timestamp?: number;
};

export async function checkDIDForStakeAddress(stakeAddress: string): Promise<DIDCheckResult> {
  const response = await fetch("/api/did/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stakeAddress }),
  });

  if (!response.ok) throw new Error("Could not check DID status");
  return (await response.json()) as DIDCheckResult;
}

export const DID_APP_URL =
  process.env.NEXT_PUBLIC_DID_APP_URL ||
  "https://dids-dashboard-production.up.railway.app";
