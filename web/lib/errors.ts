import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

const MESSAGES: Record<string, string> = {
  InvalidParams: "Those circle settings aren't valid.",
  UnknownCircle: "This circle doesn't exist.",
  CircleFull: "This circle is already full.",
  AlreadyJoined: "You're already in this circle.",
  NotMember: "You're not a member of this circle.",
  NotActive: "This circle isn't running right now.",
  InsufficientCollateral: "The BTC price moved. Try again to lock the updated amount.",
  NotObligated: "You don't owe a payment this round.",
  AlreadyPaid: "You've already paid this round.",
  RoundNotDue: "Someone hasn't paid yet. Settling opens when the grace period ends.",
  ObligationsOutstanding: "Your BTC unlocks after your last payment.",
  NothingToWithdraw: "There's nothing to withdraw.",
  TransferFailed: "The BTC transfer failed.",
};

/** Turn a wallet/contract error into one plain sentence. */
export function humanError(err: unknown): string {
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) return "You cancelled the request in your wallet.";
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null;
    const name = revert?.data?.errorName;
    if (name && MESSAGES[name]) return MESSAGES[name];
    const text = `${err.shortMessage} ${err.details ?? ""} ${revert?.reason ?? ""}`;
    if (/stale/i.test(text)) return "Oracle price is refreshing, try again in a few seconds.";
    if (/insufficient funds/i.test(text)) return "Not enough test BTC for this transaction. Get some from faucet.test.mezo.org.";
    if (/transfer amount exceeds balance|ERC20InsufficientBalance/i.test(text)) return "Not enough MUSD in your wallet.";
    return err.shortMessage;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}
