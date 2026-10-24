// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Round} from "../src/Round.sol";
import {IPriceFeed} from "../src/interfaces/IPriceFeed.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// forge script script/Deploy.s.sol --rpc-url matsnet --broadcast
contract Deploy is Script {
    address constant MUSD = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant PRICE_FEED = 0x86bCF0841622a5dAC14A313a15f96A95421b9366;

    function run() external returns (Round round) {
        vm.startBroadcast(vm.envUint("DEPLOYER_KEY"));
        round = new Round(IERC20(MUSD), IPriceFeed(PRICE_FEED));
        vm.stopBroadcast();
        console.log("Round deployed at", address(round));
    }
}
