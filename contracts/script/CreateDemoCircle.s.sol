// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Round} from "../src/Round.sol";

/// Demo circle: 4 people · 100 MUSD/round · 5-minute rounds · 60s grace · 150% collateral · 10% penalty.
/// ROUND=0x... forge script script/CreateDemoCircle.s.sol --rpc-url matsnet --broadcast
contract CreateDemoCircle is Script {
    function run() external returns (uint256 id) {
        Round round = Round(vm.envAddress("ROUND"));
        vm.startBroadcast(vm.envUint("DEPLOYER_KEY"));
        id = round.createCircle(100e18, 4, 5 minutes, 60, 15_000, 1_000);
        vm.stopBroadcast();
        console.log("Demo circle id", id);
        // The PriceFeed reads a Mezo precompile that forge's local simulation doesn't have.
        try round.requiredCollateral(id) returns (uint256 req) {
            console.log("Required collateral (BTC wei)", req);
        } catch {}
    }
}
