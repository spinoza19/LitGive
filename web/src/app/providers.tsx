"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import "@rainbow-me/rainbowkit/styles.css";

const qc = new QueryClient();

function ThemedRainbow({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const rk =
    theme === "dark"
      ? darkTheme({
          accentColor: "#cdb380",
          accentColorForeground: "#0b0b10",
          borderRadius: "small",
        })
      : lightTheme({
          accentColor: "#1a1a22",
          accentColorForeground: "#fafafa",
          borderRadius: "small",
        });
  return <RainbowKitProvider theme={rk}>{children}</RainbowKitProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <ThemedRainbow>{children}</ThemedRainbow>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
