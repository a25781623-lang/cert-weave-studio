// This is a standalone script to test the connection to your blockchain RPC provider.

// 1. Load Environment Variables
// It reads the .env file in your backend directory, just like server.js
require('dotenv').config();
const { ethers } = require('ethers');

// 2. Configuration
// Get the same configuration values from your .env file
const rpcUrl = process.env.RPC_PROVIDER_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;

// This is the wallet address of the university you successfully registered.
// We will use it to query the smart contract.
const universityWalletAddress = "0xAAc80293cf2f6D3ecA5399d6B08141919609eccD";

// The ABI for the CertiChain contract (copied from server.js)
const contractABI = [
	{ "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "universities",
		"outputs": [
			{ "internalType": "string", "name": "name", "type": "string" },
			{ "internalType": "string", "name": "email", "type": "string" },
			{ "internalType": "address", "name": "walletAddress", "type": "address" },
			{ "internalType": "string", "name": "publicKey", "type": "string" },
			{ "internalType": "bool", "name": "isRegistered", "type": "bool" }
		], "stateMutability": "view", "type": "function"
	}
    // Note: We only need the 'universities' function ABI for this test.
];

// 3. The Main Test Function
async function testConnection() {
    console.log("--- Starting Blockchain Connection Test ---");

    // Check if the .env variables are loaded
    if (!rpcUrl || !contractAddress) {
        console.error("!!! ERROR: RPC_PROVIDER_URL or CONTRACT_ADDRESS not found in .env file.");
        return;
    }

    console.log(`Connecting to RPC Provider at: ${rpcUrl}`);

    try {
        // Create a provider to connect to the blockchain
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Create an instance of the contract
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        console.log(`\nQuerying contract at ${contractAddress} for university details...`);
        console.log(`Wallet Address being looked up: ${universityWalletAddress}`);

        // This is the same call that is timing out in your server.js
        const universityDetails = await contract.universities(universityWalletAddress);
        
        console.log("\n✅ --- TEST SUCCEEDED! --- ✅");
        console.log("Successfully received a response from the blockchain.");
        console.log("\n--- University Details ---");
        console.log("Name:", universityDetails.name);
        console.log("Public Key stored:", universityDetails.publicKey ? "Yes" : "No");
        console.log("Is Registered:", universityDetails.isRegistered);
        console.log("--------------------------");

    } catch (error) {
        console.error("\n❌ --- TEST FAILED! --- ❌");
        console.error("Could not get a response from the blockchain provider.");
        console.error("This confirms the issue is with the network connection or the RPC provider itself.");
        console.error("\n--- Error Details ---");
        console.error(error);
        console.error("---------------------");
    }
}

// 4. Run the test
testConnection();
