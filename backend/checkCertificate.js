require('dotenv').config();
const { ethers } = require('ethers');

// This is the ABI for your contract.
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_email",
				"type": "string"
			}
		],
		"name": "addUniversityToWhitelist",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "string",
				"name": "certificateId",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "universityAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "certificateHash",
				"type": "string"
			}
		],
		"name": "CertificateIssued",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "string",
				"name": "certificateId",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "universityAddress",
				"type": "address"
			}
		],
		"name": "CertificateRevoked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_certificateId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_certificateHash",
				"type": "string"
			}
		],
		"name": "issueCertificate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_publicKey",
				"type": "string"
			}
		],
		"name": "registerUniversity",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_certificateId",
				"type": "string"
			}
		],
		"name": "revokeCertificate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "universityAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			}
		],
		"name": "UniversityRegistered",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "certificates",
		"outputs": [
			{
				"internalType": "string",
				"name": "certificateHash",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isRevoked",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "universityAddress",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			}
		],
		"name": "isUniversityWhitelisted",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "universities",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "email",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "walletAddress",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "publicKey",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isRegistered",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// --- 1. CONFIGURE THESE VALUES ---
const RPC_PROVIDER_URL = process.env.RPC_PROVIDER_URL; // Reads from your .env file
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // Reads from your .env file

// --- 2. PASTE THE ID YOU WANT TO CHECK HERE ---
const certificateIdToCheck = "CERT-1759776463379";


async function checkCertificate() {
    if (!RPC_PROVIDER_URL || !CONTRACT_ADDRESS) {
        console.error("Error: Make sure RPC_PROVIDER_URL and CONTRACT_ADDRESS are set in your .env file.");
        return;
    }
    if (certificateIdToCheck === "PASTE_YOUR_CERTIFICATE_ID_HERE") {
        console.error("Error: Please edit the 'certificateIdToCheck' variable in this script.");
        return;
    }

    console.log(`Connecting to your testnet at ${RPC_PROVIDER_URL}...`);
    const provider = new ethers.JsonRpcProvider(RPC_PROVIDER_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

    console.log(`\nLooking up Certificate ID: "${certificateIdToCheck}"`);

    try {
        const result = await contract.certificates(certificateIdToCheck);

        console.log("\n--- Blockchain Data ---");
        console.log("Certificate Hash:", result.certificateHash);
        console.log("Is Revoked:", result.isRevoked);
        console.log("University Address:", result.universityAddress);
        console.log("-----------------------\n");

        if (result.certificateHash === "") {
            console.log("✅ Conclusion: This Certificate ID was NOT found on the blockchain.");
        } else {
            console.log("✅ Conclusion: This Certificate ID EXISTS on the blockchain.");
        }

    } catch (error) {
        console.error("\n❌ An error occurred while querying the contract:", error.message);
    }
}

checkCertificate();