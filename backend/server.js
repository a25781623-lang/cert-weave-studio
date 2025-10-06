// Import necessary libraries
require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const pinataSDK = require('@pinata/sdk');
const crypto = require('crypto');


// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// --- Simple In-Memory Database (for development) ---
const users = [];

// --- Multer Configuration for file uploads ---
const upload = multer({ dest: 'uploads/' });

// --- Pinata Configuration ---
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

// --- Smart Contract Configuration ---
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
			{ "internalType": "string", "name": "_certificateHash", "type": "string" }
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
			{ "internalType": "string", "name": "certificateHash", "type": "string" },
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
    contract = new ethers.Contract(contractAddress, contractABI, provider);
    console.log("Successfully connected to the blockchain for read-only operations.");
} catch (error) {
    console.error("!!! CRITICAL: Could not connect to the blockchain. Check your .env file.", error);
    process.exit(1);
}

// --- JWT Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT Verification Error:", err.message);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// --- Registration Step 1: Send Email ---
app.post('/register', async (req, res) => {
    console.log("\n--- [STEP 1] /register endpoint hit ---");
    const { universityName, email, publicKey, walletAddress } = req.body;
    if (!universityName || !email || !publicKey) {
        return res.status(400).json({ message: 'University name, email, and public key are required.' });
    }
    try {
        const [isWhitelisted, correctEmail] = await contract.isUniversityWhitelisted(universityName);
        if (isWhitelisted && email.toLowerCase() === correctEmail.toLowerCase()) {
            
            // --- DEBUGGING: Increase expiration and log token details ---
            console.log(`Creating registration token at: ${new Date().toLocaleTimeString()}`);
            const verificationToken = jwt.sign({ data: req.body }, process.env.JWT_SECRET, { expiresIn: '1h' });
            
            pendingVerifications[verificationToken] = req.body;
            console.log(`Token created and stored. Expiration: 1 hour.`);
            console.log("Pending verifications object:", Object.keys(pendingVerifications));

            const verificationLink = `http://localhost:8080/create-account/${verificationToken}`;
            await transporter.sendMail({
                from: '"CertiChain Admin" <admin@certichain.com>',
                to: email,
                subject: 'Verify Your University Registration',
                html: `<p>Click this link to set up your account:</p><a href="${verificationLink}">${verificationLink}</a>`,
            });
            console.log("Verification email sent.");
            res.status(200).json({ message: `Verification email sent.` });
        } else {
            console.log("Registration failed: University not whitelisted or email does not match.");
            res.status(400).json({ message: 'University not whitelisted or email does not match.' });
        }
    } catch (error) {
        console.error('Error in /register:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// Step 2: Prepare Registration Transaction
app.post('/prepare-registration', async (req, res) => {
    console.log("\n--- [STEP 2] /prepare-registration endpoint hit ---");
    const { token, walletAddress } = req.body;
    if (!token || !walletAddress) {
        return res.status(400).json({ message: 'Token and walletAddress are required.' });
    }

    try {
        console.log(`Verifying token at: ${new Date().toLocaleTimeString()}`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const registrationData = pendingVerifications[token];
        
        console.log("Token is valid.");
        if (!registrationData) {
            console.log("ERROR: Token is valid, but no matching data found in pendingVerifications.");
            return res.status(400).json({ message: 'This verification link is invalid or has already been used. Please register again.' });
        }
        console.log("Found pending registration data. Token is NOT deleted yet.");
        console.log("Pending verifications object:", Object.keys(pendingVerifications));

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
            console.log("ERROR: Token has expired!");
            if (pendingVerifications[token]) delete pendingVerifications[token];
            return res.status(400).json({ message: 'Your verification link has expired. Please register again.' });
        }
        console.error('Error in /prepare-registration:', error);
        res.status(500).json({ message: 'An error occurred during transaction preparation.' });
    }
});

// Step 3: Finalize Registration
app.post('/finalize-registration', async (req, res) => {
    console.log("\n--- [STEP 3] /finalize-registration endpoint hit ---");
    const { token, password, txHash } = req.body;
    if (!token || !password || !txHash) {
        return res.status(400).json({ message: 'Token, password, and transaction hash are required.' });
    }

    try {
        console.log(`Verifying token a final time at: ${new Date().toLocaleTimeString()}`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const registrationData = pendingVerifications[token];
        
        console.log("Token is valid for finalization.");
        if (!registrationData) {
            return res.status(400).json({ message: 'This verification link has already been used.' });
        }

        const correctWalletAddress = registrationData.walletAddress;

        // --- DEBUGGING: Deleting the token now ---
        console.log("Deleting token from pendingVerifications.");
        delete pendingVerifications[token];
        console.log("Pending verifications object after deletion:", Object.keys(pendingVerifications));

        console.log(`Finalizing account for ${registrationData.universityName}.`);

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            email: registrationData.email,
            universityName: registrationData.universityName,
            walletAddress: correctWalletAddress,
            hashedPassword: hashedPassword,
        };
        users.push(newUser);
        console.log(`User for ${newUser.universityName} with address ${correctWalletAddress} saved. TxHash: ${txHash}`);

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
    console.log("\n--- LOGIN ATTEMPT ---");
    console.log("Current users in memory:", JSON.stringify(users, null, 2));
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
            {
                email: user.email,
                universityName: user.universityName,
                walletAddress: user.walletAddress
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: "Login successful!", token: sessionToken });
    } catch (error) {
        console.error('Error in /login:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// --- NEW ENDPOINT: Get University Details ---
app.get('/get-university-details', authenticateToken, async (req, res) => {
    // The walletAddress is securely taken from the authenticated user's token
    const { walletAddress } = req.user;
    console.log(`\n--- [/get-university-details] Attempting to fetch details for ${walletAddress} ---`);

    try {
        // --- FIX: Create a fresh provider and contract instance for each request ---
        // This mirrors the successful test script and prevents stale connections.
        console.log("Creating a new connection to the RPC provider...");
        const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
        console.log("Connection successful. Querying the smart contract...");

        // Query the smart contract directly using the user's wallet address
        const university = await contract.universities(walletAddress);
        console.log("Successfully received data from the contract.");

        if (!university.isRegistered) {
            return res.status(404).json({ message: "University not found or not registered." });
        }

        // Send back only the necessary details
        res.status(200).json({
            name: university.name,
            publicKey: university.publicKey
        });

    } catch (error) {
        console.error('--- [/get-university-details] ERROR ---');
        console.error('Error fetching university details:', error);
        res.status(500).json({ message: 'An error occurred while fetching university details.' });
    }
});
// --- Verify PDF Signature Endpoint ---
app.post('/verify-signature', authenticateToken, upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No PDF file uploaded.' });
    }

    const { walletAddress, universityName } = req.user;
    const pdfPath = req.file.path;
    const publicKeyPath = `./${universityName}_pubkey.pem`;

    try {
        const university = await contract.universities(walletAddress);
        const publicKey = university.publicKey;
        if (!publicKey) throw new Error("Public key not found on-chain.");

        fs.writeFileSync(publicKeyPath, publicKey);

        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(pdfPath));
        formData.append('public_key', fs.createReadStream(publicKeyPath));

        const response = await axios.post('http://localhost:5000/verify-pdf', formData, { headers: formData.getHeaders() });

        fs.unlinkSync(publicKeyPath);

        if (response.data.valid) {
            res.status(200).json({ message: 'PDF signature verified successfully.' });
        } else {
            fs.unlinkSync(pdfPath);
            res.status(400).json({ message: 'Warning: The uploaded PDF is not signed by you.' });
        }
    } catch (error) {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        if (fs.existsSync(publicKeyPath)) fs.unlinkSync(publicKeyPath);
        console.error('Error verifying PDF:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'An error occurred during PDF verification.' });
    }
});

// --- Upload Certificate to IPFS Endpoint ---
app.post('/upload-certificate', authenticateToken, upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No PDF file uploaded.' });
    }
    const pdfPath = req.file.path;
    try {
        const readableStreamForFile = fs.createReadStream(pdfPath);
        const options = {
            pinataMetadata: { name: `Certificate_${req.file.originalname}_${Date.now()}` },
            pinataOptions: { cidVersion: 1 }
        };
        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
        res.status(200).json({ message: 'File uploaded to IPFS successfully.', ipfsCid: result.IpfsHash });
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        res.status(500).json({ message: 'An error occurred during IPFS upload.' });
    } finally {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }
});

// --- MODIFIED ENDPOINT: Prepare Certificate Hash & Transaction ---
app.post('/prepare-certificate-hash', authenticateToken, async (req, res) => {
    const { ipfsCid, studentName, courseName, issueDate,grade    } = req.body;
    if (!ipfsCid || !studentName || !courseName || !issueDate) {
        return res.status(400).json({ message: 'Missing required certificate data.' });
    }

    const { walletAddress, universityName } = req.user;

    try {
        // 1. Fetch the university's public key from the contract
        const university = await contract.universities(walletAddress);
        const publicKey = university.publicKey;
        if (!publicKey) {
            return res.status(404).json({ message: 'Could not find a public key for this university on the blockchain.' });
        }

        // 2. Create a structured string for hashing (as per your new requirements)
        // HASH = HASH(CID+STUDENT NAME+UNIVERSITY NAME+COURSE NAME+ISSUE DATE+WALLET ADDRESS+PUBLIC KEY)
        const stringToHash = `${ipfsCid}${studentName}${universityName}${courseName}${issueDate}${walletAddress}${publicKey}${grade || ''}`;

        // 3. Create the SHA-256 hash
        const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');

        // 4. Prepare the unsigned transaction for the smart contract
        const certificateId = `CERT-${Date.now()}`;
        const contractInterface = new ethers.Interface(contractABI);
        const unsignedTx = {
            to: contractAddress,
            data: contractInterface.encodeFunctionData("issueCertificate", [
                certificateId,
                `0x${hash}` // Pass the hash to the contract
            ]),
            from: walletAddress,
        };

        console.log(`Prepared transaction for Certificate ID: ${certificateId} with Hash: 0x${hash}`);

        // 5. Respond with the necessary data for the frontend
        res.status(200).json({
            unsignedTx,
            certificateId,
            certificateHash: `0x${hash}`
        });

    } catch (error) {
        console.error('Error in /prepare-certificate-hash:', error);
        res.status(500).json({ message: 'An error occurred during transaction preparation.' });
    }
});

// --- NEW VERIFICATION ENDPOINT ---
app.post('/verify-certificate-from-qr', async (req, res) => {
    const { qrData } = req.body;
    if (!qrData) {
        return res.status(400).json({ message: 'QR data is required.' });
    }

    try {
        // 1. Deconstruct the QR data
        const [ipfsCid, studentName, universityName, courseName, issueDate, walletAddress, publicKey, certificateId, grade] = qrData.split('|');
        if (!ipfsCid || !studentName || !universityName || !courseName || !issueDate || !walletAddress || !publicKey || !certificateId) {
            return res.status(400).json({ message: 'Malformed QR data. Some fields are missing.' });
        }
        // 2. Reconstruct the hash
        const stringToHash = `${ipfsCid}${studentName}${universityName}${courseName}${issueDate}${walletAddress}${publicKey}${grade || ''}`;
        const reconstructedHash = `0x${crypto.createHash('sha256').update(stringToHash).digest('hex')}`;

        // 3. Verify on-chain
        const onChainCertificate = await contract.certificates(certificateId);
        if (onChainCertificate.certificateHash !== reconstructedHash) {
            return res.status(400).json({ valid: false, message: 'Hash mismatch. Certificate is not authentic.' });
        }
        if (onChainCertificate.isRevoked) {
            return res.status(400).json({ valid: false, message: 'Certificate has been revoked.' });
        }

        // 4. Verify off-chain (PDF signature)
        // Download PDF from IPFS
        console.log(`Downloading PDF from Cloudflare gateway: ${ipfsCid}`);
        const pdfResponse = await axios.get(`https://dweb.link/ipfs/${ipfsCid}`, { responseType: 'arraybuffer' });
        console.log("PDF downloaded successfully.");
        const pdfPath = `./temp_verify_${certificateId}.pdf`;
        fs.writeFileSync(pdfPath, pdfResponse.data);
        
        // Write public key to a temporary file
        const publicKeyPath = `./temp_pubkey_${certificateId}.pem`;
        fs.writeFileSync(publicKeyPath, publicKey);

        // Call Python service
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(pdfPath));
        formData.append('public_key', fs.createReadStream(publicKeyPath));

        const pythonResponse = await axios.post('http://localhost:5000/verify-pdf', formData, { headers: formData.getHeaders() });

        // Clean up temporary files
        fs.unlinkSync(pdfPath);
        fs.unlinkSync(publicKeyPath);

        if (!pythonResponse.data.valid) {
            return res.status(400).json({ valid: false, message: 'PDF signature verification failed.' });
        }
        let signerName = 'ERR_NO_SIGNATURE'; // Default to 'Verified'
        if (pythonResponse.data && pythonResponse.data.signer) {
            signerName = pythonResponse.data.signer; // If the signer exists, use it.
        }

        // 5. If all checks pass, return success
        res.status(200).json({
            valid: true,
            message: 'Certificate verified successfully.',
            certificateData: {
                id: certificateId,
                studentName,
                courseName,
                issueDate,
                universityName,
                walletAddress,
                signature: signerName,
                grade: grade || 'N/A',
                ipfsCid: ipfsCid // Pass signature from metadata
                // Include any other data from the QR code that the frontend needs
            }
        });

    } catch (error) {
        console.error('Error in /verify-certificate-from-qr:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'An error occurred during verification.' });
    }
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});