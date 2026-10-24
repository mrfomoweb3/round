import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, okxWallet, rabbyWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { mezoTestnet } from "./chain";

const connectors = connectorsForWallets(
  [{ groupName: "Wallets", wallets: [metaMaskWallet, rabbyWallet, okxWallet, injectedWallet, walletConnectWallet] }],
  {
    appName: "Round",
    // WalletConnect needs a real id for mobile wallets; browser wallets work without one.
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "00000000000000000000000000000000",
  },
);

export const config = createConfig({
  connectors,
  chains: [mezoTestnet],
  transports: { [mezoTestnet.id]: http() },
  ssr: true,
});
