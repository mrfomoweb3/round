import { erc20Abi, type Address } from "viem";

export const ROUND_ADDRESS = (process.env.NEXT_PUBLIC_ROUND_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address;
export const ROUND_DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_ROUND_DEPLOY_BLOCK ?? "0");
export const DEMO_CIRCLE_ID = process.env.NEXT_PUBLIC_DEMO_CIRCLE_ID ? BigInt(process.env.NEXT_PUBLIC_DEMO_CIRCLE_ID) : undefined;

export const MUSD_ADDRESS = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as Address;
export const PRICE_FEED_ADDRESS = "0x86bCF0841622a5dAC14A313a15f96A95421b9366" as Address;
export const EXPLORER = "https://explorer.test.mezo.org";

export const isConfigured = ROUND_ADDRESS !== "0x0000000000000000000000000000000000000000";

export const priceFeedAbi = [
  { type: "function", name: "fetchPrice", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const musdAbi = [
  ...erc20Abi,
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

/** MUSD's EIP-712 domain on matsnet (verified: name "Mezo USD", version "1"). */
export const musdPermitDomain = {
  name: "Mezo USD",
  version: "1",
  chainId: 31611,
  verifyingContract: MUSD_ADDRESS,
} as const;
