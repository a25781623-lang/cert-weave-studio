// Import necessary libraries
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// --- Simple In-Memory Database (for development) ---
const users = [];

// --- Smart Contract Configuration (Using the ABI you provided) ---
const contractABI = [
	{
		"inputs": [
			{ "internalType": "string", "name": "_name", "type": "string" },
			{ "internalType": "string", "name": "_email", "type": "string" }
		],
		"name": "addUniversityToWhitelist", "outputs": [], "stateMutability": "nonpayable", "type": "function"
	},
	{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
	{
		"anonymous": false, "inputs": [
			{ "indexed": true, "internalType": "string", "name": "certificateId", "type": "string" },
			{ "indexed": true, "internalType": "address", "name": "universityAddress", "type": "address" }
		], "name": "CertificateIssued", "type": "event"
	},
	{
		"anonymous": false, "inputs": [
			{ "indexed": true, "internalType": "string", "name": "certificateId", "type": "string" },
			{ "indexed": true, "internalType": "address", "name": "universityAddress", "type": "address" }
		], "name": "CertificateRevoked", "type": "event"
	},
	{
		"inputs": [
			{ "internalType": "string", "name": "_certificateId", "type": "string" },
			{ "internalType": "string", "name": "_studentName", "type": "string" },
			{ "internalType": "string", "name": "_courseName", "type": "string" },
			{ "internalType": "string", "name": "_ipfsCid", "type": "string" }
		],
		"name": "issueCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
	},
	{
		"inputs": [
			{ "internalType": "string", "name": "_name", "type": "string" },
			{ "internalType": "string", "name": "_publicKey", "type": "string" }
		],
		"name": "registerUniversity", "outputs": [], "stateMutability": "nonpayable", "type": "function"
	},
	{
		"inputs": [{ "internalType": "string", "name": "_certificateId", "type": "string" }],
		"name": "revokeCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
	},
	{
		"anonymous": false, "inputs": [
			{ "indexed": true, "internalType": "address", "name": "universityAddress", "type": "address" },
			{ "indexed": false, "internalType": "string", "name": "name", "type": "string" }
		], "name": "UniversityRegistered", "type": "event"
	},
	{
		"inputs": [{ "internalType": "string", "name": "", "type": "string" }], "name": "certificates",
		"outputs": [
			{ "internalType": "string", "name": "certificateId", "type": "string" },
			{ "internalType": "string", "name": "studentName", "type": "string" },
			{ "internalType": "string", "name": "courseName", "type": "string" },
			{ "internalType": "string", "name": "ipfsCid", "type": "string" },
			{ "internalType": "address", "name": "universityAddress", "type": "address" },
			{ "internalType": "bool", "name": "isRevoked", "type": "bool" }
		], "stateMutability": "view", "type": "function"
	},
	{
		"inputs": [{ "internalType": "string", "name": "_name", "type": "string" }],
		"name": "isUniversityWhitelisted",
		"outputs": [
			{ "internalType": "bool", "name": "", "type": "bool" },
			{ "internalType": "string", "name": "", "type": "string" }
		], "stateMutability": "view", "type": "function"
	},
	{
		"inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view", "type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "universities",
		"outputs": [
			{ "internalType": "string", "name": "name", "type": "string" },
			{ "internalType": "string", "name": "email", "type": "string" },
			{ "internalType": "address", "name": "walletAddress", "type": "address" },
			{ "internalType": "string", "name": "publicKey", "type": "string" },
			{ "internalType": "bool", "name": "isRegistered", "type": "bool" }
		], "stateMutability": "view", "type": "function"
	}
];
const contractAddress = process.env.CONTRACT_ADDRESS;

// --- Nodemailer (Ethereal) ---
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// --- In-memory store (temporary) ---
const pendingVerifications = {};

// --- Blockchain Connection (Read-only provider) ---
let contract;
try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);
    // NOTE: No signer/wallet is needed here, making the backend more secure.
    contract = new ethers.Contract(contractAddress, contractABI, provider);
    console.log("Successfully connected to the blockchain for read-only operations.");
} catch (error) {
    console.error("!!! CRITICAL: Could not connect to the blockchain. Check your .env file.", error);
    process.exit(1);
}

// --- Registration Step 1: Send Email ---
app.post('/register', async (req, res) => {
    const { universityName, email } = req.body;
    try {
        const [isWhitelisted, correctEmail] = await contract.isUniversityWhitelisted(universityName);
        if (isWhitelisted && email.toLowerCase() === correctEmail.toLowerCase()) {
            const verificationToken = jwt.sign({ data: req.body }, process.env.JWT_SECRET, { expiresIn: '5m' });
            pendingVerifications[verificationToken] = req.body;
            const verificationLink = `http://localhost:8080/create-account/${verificationToken}`;
            await transporter.sendMail({
                from: '"CertiChain Admin" <admin@certichain.com>',
                to: email,
                subject: 'Verify Your University Registration',
                html: `<p>Click this link to set up your account:</p><a href="${verificationLink}">${verificationLink}</a>`,
            });
            console.log("Verification email sent. Check your backend terminal for the Ethereal preview link.");
            res.status(200).json({ message: `Verification email sent.` });
        } else {
            res.status(400).json({ message: 'University not whitelisted or email does not match.' });
        }
    } catch (error) {
        console.error('Error in /register:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// Step 2: User is on "Create Account" page. Frontend asks backend to prepare the transaction data.
app.post('/prepare-registration', async (req, res) => {
    const { token, walletAddress } = req.body;
    if (!token || !walletAddress) {
        return res.status(400).json({ message: 'Token and walletAddress are required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const registrationData = pendingVerifications[token];
        if (!registrationData) {
            return res.status(400).json({ message: 'This verification link is invalid or has already been used. Please register again.' });
        }

        const contractInterface = new ethers.Interface(contractABI);
        const unsignedTx = {
            to: contractAddress,
            data: contractInterface.encodeFunctionData("registerUniversity", [
                registrationData.universityName,
                registrationData.publicKey
            ]),
            from: walletAddress,
        };
        
        console.log(`Prepared transaction for ${walletAddress} to register ${registrationData.universityName}.`);
        res.status(200).json({ unsignedTx });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
             if(pendingVerifications[token]) delete pendingVerifications[token];
            return res.status(400).json({ message: 'Your verification link has expired. Please register again.' });
        }
        console.error('Error in /prepare-registration:', error);
        res.status(500).json({ message: 'An error occurred during transaction preparation.' });
    }
});

// Step 3: Frontend calls this AFTER the MetaMask transaction is successful.
app.post('/finalize-registration', async (req, res) => {
    const { token, password, txHash } = req.body;
    if (!token || !password || !txHash) {
        return res.status(400).json({ message: 'Token, password, and transaction hash are required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const registrationData = pendingVerifications[token];
        if (!registrationData) {
             return res.status(400).json({ message: 'This verification link has already been used.' });
        }
        
        // Now that the transaction is confirmed on the frontend, we invalidate the token and save the user.
        delete pendingVerifications[token];
        console.log(`Finalizing account for ${registrationData.universityName}.`);
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            email: registrationData.email,
            universityName: registrationData.universityName,
            // We use the address from the original registration form data
            walletAddress: registrationData.walletAddress, 
            hashedPassword: hashedPassword,
        };
        users.push(newUser);
        console.log(`User for ${newUser.universityName} saved. TxHash: ${txHash}`);
        
        res.status(201).json({ message: 'Account created successfully!' });

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(400).json({ message: 'Your verification link has expired. Please register again.' });
        }
        console.error('Error in /finalize-registration:', error);
        res.status(500).json({ message: 'An error occurred during finalization.' });
    }
});

// --- Login Endpoint ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        const sessionToken = jwt.sign(
            { email: user.email, universityName: user.universityName, walletAddress: user.walletAddress },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: "Login successful!", token: sessionToken });
    } catch (error) {
        console.error('Error in /login:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});