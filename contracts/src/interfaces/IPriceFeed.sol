// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Mezo's MUSD PriceFeed. Returns BTC/USD scaled to 1e18.
/// Reverts with "PriceFeed: Oracle is stale." when the oracle is older than 60s.
interface IPriceFeed {
    function fetchPrice() external view returns (uint256);
}
