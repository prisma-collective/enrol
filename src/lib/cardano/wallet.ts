export type CardanoWalletApi = {
  getRewardAddresses(): Promise<string[]>;
};

export type CardanoWallet = {
  name?: string;
  icon?: string;
  apiVersion?: string;
  enable(): Promise<CardanoWalletApi>;
};

export type CardanoWindow = Record<string, CardanoWallet | undefined>;

export type WalletInfo = {
  key: string;
  name: string;
  icon: string;
};

export const KNOWN_WALLETS = [
  "eternl",
  "nami",
  "lace",
  "flint",
  "yoroi",
  "typhon",
  "gerowallet",
  "nufi",
];

declare global {
  interface Window {
    cardano?: CardanoWindow;
  }
}

export function scanWallets(): WalletInfo[] {
  const cardano = typeof window !== "undefined" ? window.cardano : undefined;
  if (!cardano) return [];

  const found = new Map<string, WalletInfo>();

  for (const key of KNOWN_WALLETS) {
    const wallet = cardano[key];
    if (wallet?.enable) {
      found.set(key, {
        key,
        name: wallet.name || key,
        icon: wallet.icon || "",
      });
    }
  }

  for (const key of Object.keys(cardano)) {
    const wallet = cardano[key];
    if (!wallet?.enable || found.has(key)) continue;
    found.set(key, {
      key,
      name: wallet.name || key,
      icon: wallet.icon || "",
    });
  }

  return [...found.values()];
}

export async function enableWallet(key: string): Promise<CardanoWalletApi> {
  const wallet = window.cardano?.[key];
  if (!wallet) throw new Error("Wallet not found");
  return wallet.enable();
}
