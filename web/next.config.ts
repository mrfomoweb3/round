import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Static site for Cloudflare Pages: `npm run build` writes ./out
  output: "export",
  trailingSlash: true,
  outputFileTracingRoot: path.join(__dirname),
  // lets a second dev server (e.g. one pointed at a local chain) run without sharing .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  webpack: (config) => {
    // optional deps of WalletConnect/MetaMask SDK that aren't needed in the browser
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // @base-org/account → @coinbase/cdp-sdk lazily imports x402 packages we never use
    for (const m of ["@x402/core", "@x402/evm", "@x402/svm", "@react-native-async-storage/async-storage"]) {
      config.resolve.alias[m] = false; // also covers subpaths
    }
    return config;
  },
};

export default nextConfig;
