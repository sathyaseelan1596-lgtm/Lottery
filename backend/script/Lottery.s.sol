// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/Lottery.sol";
import "../src/RandomNumberGenerator.sol";
import "../src/Token.sol";
import "../src/VRFCoordinator.sol";

contract DeployLottery is Script {
    function run() external {
        // address cakeAddress = 0xFa60D973F7642B748046464e165A65B7323b0DEE;
        // address vrfAddress = 0x22f44f27A25053C9921037d6CDb5EDF9C05d567D;
        // address uniSwap = 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008;
        address linkAddress = 0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06;

        bytes32 keyHash = 0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314;
        uint256 fee = 0.005 * 10**18;
    
        // Load deployer private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        MockERC20 cake = new MockERC20();

        MockVRFCoordinatorSimple vrf = new MockVRFCoordinatorSimple();

        RandomNumberGenerator number = new RandomNumberGenerator(address(vrf), linkAddress);

        PancakeSwapLottery lottery = new PancakeSwapLottery(address(cake), address(number));

        number.setKeyHash(keyHash);
        number.setFee(fee);
        number.setLotteryAddress(address(lottery));

        cake.approve(address(lottery), 100000*10**18);

        // Configure Lottery
        address deployer = vm.addr(deployerPrivateKey);
        lottery.setOperatorAndTreasuryAndInjectorAddresses(deployer, deployer, deployer);

        // Stop broadcasting
        vm.stopBroadcast();
    }
}
// $ forge script script/Lottery.s.sol:DeployLottery \
// --rpc-url sepolia \
// --broadcast \                   
// --verify