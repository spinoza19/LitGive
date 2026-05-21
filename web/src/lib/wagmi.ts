import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { litvmTestnet } from "./chain";

export const wagmiConfig = getDefaultConfig({
  appName: "LitGive",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "litgive-demo",
  chains: [litvmTestnet],
  ssr: true,
});
