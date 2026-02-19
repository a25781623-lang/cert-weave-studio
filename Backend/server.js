// Import necessary libraries
require('dotenv').config();
const express = require('express');
const ethers = require('ethers');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs').promises;
const { createReadStream} = require('fs');
const FormData = require('form-data');
const { PinataSDK } = require('pinata-web3');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const verifyLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // Limit each IP to 20 verification requests per window
        message: {
                message: "Too many verification attempts from this IP, please try again after 15 minutes."
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const generalLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 500,
        message: { message: "Overall request limit reached." }
});
const validateEnv = () => {
        const requiredEnv = [
                'JWT_SECRET',
                'SUPABASE_URL',
                'SUPABASE_SECRET_KEY',
                'SUPABASE_TABLE_NAME',
                'RPC_PROVIDER_URL',
                'FRONTEND_URL',
                'VITE_RPC_URL',
                'VITE_CONTRACT_ADDRESS',
                'CONTRACT_ADDRESS',
                'PINATA_JWT',
                'PINATA_GATEWAY'

        ];

        const missing = requiredEnv.filter(key => !process.env[key]);

        if (missing.length > 0) {
                console.error('❌ FATAL ERROR: Missing environment variables:', missing.join(', '));
                process.exit(1); // Stop the server immediately
        }
        console.log('✅ Environment Variables Validated');
}
// Call this before anything else
validateEnv();


// Initialize Express app
const app = express();
app.use(generalLimiter);
app.use(cookieParser());
app.use(cors({
    origin: function(origin, callback) {
        const allowed = [
            process.env.FRONTEND_URL,
            'http://localhost:8080',
            'http://localhost:5173',
        ].filter(Boolean);

        const isVercelPreview = origin && origin.endsWith('.vercel.app');

        if (!origin || allowed.includes(origin) || isVercelPreview) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// --- Migrated to Supabase (for production) ---
const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY
);


// --- Multer Configuration for file uploads ---
const upload = multer({ dest: 'uploads/' });

// --- Pinata Configuration ---
const pinata = new PinataSDK({
        pinataJwt: process.env.PINATA_JWT,       // Use the JWT from Pinata dashboard
        pinataGateway: process.env.PINATA_GATEWAY // e.g., "magenta-short-goose-123.mypinata.cloud"
});

//const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

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
                        { "internalType": "bool", "name": "isRevoked", "type": "bool" },
                        { "indexed": true, "internalType": "address", "name": "universityAddress", "type": "address" }
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

// --- Nodemailer (Resend) ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false  // prevents TLS handshake timeout on Render
    },
    connectionTimeout: 10000,  // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
});


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
        const token = req.cookies.universityAuthToken;
        if (!token) return res.sendStatus(401);
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                        console.error("JWT Verification Error:", err.message);
                        return res.sendStatus(403);
                }
                try {
                        // Fetch the user and their CURRENT active session ID from the database
                        const { data: user, error } = await supabase
                                .from(`${process.env.SUPABASE_TABLE_NAME}`)
                                .select('*')
                                .eq('email', decoded.email.toLowerCase())
                                .single();
                        if (error || !user) {
                                return res.status(401).json({ message: "User no longer exists." });
                        }
                        if (user.active_session_id != decoded.jti) {
                                console.log(`Session Revoked for ${decoded.data.email}. Expected: ${user.active_session_id}, Got: ${decoded.jti}`);

                                return res.status(401).json({ message: "Session expired or logged in elsewhere." });
                        }
                        req.user = user;
                        next();
                } catch (dbError) {
                        console.error("Database error during auth:", dbError);
                        res.sendStatus(500);
                }
        });
};

// --- Registration Step 1: Send Email ---
app.post('/register', generalLimiter, async (req, res) => {
        console.log("\n--- [STEP 1] /register endpoint hit ---");
        const { universityName, email, publicKey } = req.body;
        if (!universityName || !email || !publicKey) {
                return res.status(400).json({ message: 'University name, email, and public key are required.' });
        }
        try {
                const [isWhitelisted, correctEmail] = await contract.isUniversityWhitelisted(universityName);
                if (isWhitelisted && email.toLowerCase() === correctEmail.toLowerCase()) {

                        // --- DEBUGGING: Increase expiration and log token details ---
                        console.log(`Creating registration token at: ${new Date().toLocaleTimeString()}`);
                        const verificationToken = jwt.sign({ data: req.body }, process.env.JWT_SECRET, { expiresIn: '1h' });

                        const { error } = await supabase
                                .from(`${process.env.SUPABASE_TABLE_NAME}`)
                                .insert([{
                                        email: email.toLowerCase(),
                                        pending_verification: {
                                                token: verificationToken,
                                                data: req.body, // Stores universityName, publicKey, etc.
                                                expiresAt: new Date(Date.now() + 3600000).toISOString()
                                        }
                                }]);
                        console.error("Supabase Insert Error:", JSON.stringify(error, null, 2)); // ADD THIS
                        if (error) return res.status(500).json({ message: "Database error during registration." });
                        console.log(`Token created and stored. Expiration: 1 hour.`);


                        // Inside app.post('/register', ...)
                        const verificationLink = `${process.env.FRONTEND_URL}/create-account/${verificationToken}`;

                        const emailHtml = `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                <meta charset="UTF-8">
                                <style>
                                        .button {
                                        display: inline-block;
                                        padding: 12px 24px;
                                        background-color: #007bff;
                                        color: #ffffff !important;
                                        text-decoration: none;
                                        border-radius: 5px;
                                        font-weight: bold;
                                        font-family: Arial, sans-serif;
                                        }
                                        .footer-text {
                                        font-size: 12px;
                                        color: #888888;
                                        font-family: Arial, sans-serif;
                                        }
                                </style>
                                </head>
                                <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f4">
                                        <tr>
                                        <td align="center" style="padding: 20px 0;">
                                                <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                                <tr>
                                                        <td bgcolor="#1a1a17" style="padding: 20px; text-align: center;">
                                                        <h1 style="color: #ffffff; font-family: Arial, sans-serif; margin: 0; letter-spacing: 2px;">CERTICHAIN</h1>
                                                        </td>
                                                </tr>
                                                <tr>
                                                        <td style="padding: 40px; text-align: left;">
                                                        <h2 style="color: #333333; font-family: Arial, sans-serif;">Verify Your University</h2>
                                                        <p style="color: #666666; font-family: Arial, sans-serif; line-height: 1.6;">
                                                                Hello <strong>${universityName}</strong>,<br><br>
                                                                Thank you for joining the CertiChain network. To finalize your registration and secure your blockchain identity, please verify your email address.
                                                        </p>
                                                        <div style="padding: 20px 0; text-align: center;">
                                                                <a href="${verificationLink}" class="button">Verify My Account</a>
                                                        </div>
                                                        <p style="color: #999999; font-family: Arial, sans-serif; font-size: 12px;">
                                                                If the button above doesn't work, copy and paste this link into your browser:<br>
                                                                <a href="${verificationLink}" style="color: #007bff;">${verificationLink}</a>
                                                        </p>
                                                        </td>
                                                </tr>
                                                <tr>
                                                        <td bgcolor="#eeeeee" style="padding: 20px; text-align: center;">
                                                        <p class="footer-text">
                                                                &copy; 2026 CertiChain Inc. | 2701 Olympic Blvd, Santa Monica, CA<br>
                                                                <a href="#" style="color: #888888;">Privacy Policy</a> | <a href="#" style="color: #888888;">Terms of Use</a>
                                                        </p>
                                                        </td>
                                                </tr>
                                                </table>
                                        </td>
                                        </tr>
                                </table>
                                </body>
                                </html>
                                `;

                        // Update your sendMail call:
                        await transporter.sendMail({
                        from: '"CertiChain Admin" <${process.env.GMAIL_USER}>', // use resend.dev domain until you add your own
                        to: email,
                        subject: 'Verify Your University Registration',
                        html: emailHtml,
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

                // Find the record where the nested JSON token matches
                const { data: user, error } = await supabase
                        .from(`${process.env.SUPABASE_TABLE_NAME}`)
                        .select('pending_verification')
                        .eq('email', decoded.data.email)
                        .single();

                if (error || !user?.pending_verification || user.pending_verification.token !== token) {
                        return res.status(400).json({ message: "Invalid or expired verification link." });
                }

                const registrationData = user.pending_verification.data;


                console.log("Token is valid.");
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
                        console.log("ERROR: Token has expired!");

                        return res.status(400).json({ message: 'Your verification link has expired. Please register again.' });
                }
                console.error('Error in /prepare-registration:', error);
                res.status(500).json({ message: 'An error occurred during transaction preparation.' });
        }
});

// Step 3: Finalize Registration
app.post('/finalize-registration', generalLimiter, async (req, res) => {
        console.log("\n--- [STEP 3] /finalize-registration endpoint hit ---");
        const { token, password, txHash } = req.body;
        if (!token || !password || !txHash) {
                return res.status(400).json({ message: 'Token, password, and transaction hash are required.' });
        }

        try {
                console.log(`Verifying token a final time at: ${new Date().toLocaleTimeString()}`);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const { data: user, error: fetchError } = await supabase
                        .from(`${process.env.SUPABASE_TABLE_NAME}`)
                        .select('pending_verification')
                        .eq('email', decoded.data.email.toLowerCase())
                        .single();

                if (fetchError || !user?.pending_verification || user.pending_verification.token !== token) {
                        return res.status(400).json({ message: 'Invalid or expired verification link.' });
                }

                const registrationData = user.pending_verification.data;

                console.log("Token is valid for finalization.");
                if (!registrationData) {
                        return res.status(400).json({ message: 'This verification link has already been used.' });
                }
                const correctWalletAddress = registrationData.walletAddress;
                const hashedPassword = await bcrypt.hash(password, 10);
                const { error } = await supabase
                        .from(`${process.env.SUPABASE_TABLE_NAME}`)
                        .update({
                                email: registrationData.email.toLowerCase(),
                                universityName: registrationData.universityName,
                                walletAddress: correctWalletAddress,
                                hashedPassword: hashedPassword,
                                pending_verification: null
                        });


                if (error) {
                        console.error("Supabase Insert Error:", error);
                        return res.status(500).json({ message: 'Error saving user to database.' });
                }


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
app.post('/login', generalLimiter, async (req, res) => {
        const { email, password } = req.body;
        console.log("\n--- LOGIN ATTEMPT ---");
        try {
                const { data: user, error } = await supabase
                        .from(`${process.env.SUPABASE_TABLE_NAME}`)
                        .select('*')
                        .eq('email', email.toLowerCase())
                        .single();

                if (error || !user) {
                        return res.status(401).json({ message: "Couldn't retrive credention from Supabase" });
                }
                const isMatch = await bcrypt.compare(password, user.hashedPassword);
                if (!isMatch) {
                        return res.status(401).json({ message: "Invalid email or password." });
                }

                const sessionId = uuidv4(); // Generate a unique session ID
                const { error: updateError } = await supabase
                        .from(`${process.env.SUPABASE_TABLE_NAME}`)
                        .update({ active_session_id: sessionId })
                        .eq('email', user.email);

                if (updateError) throw updateError;
                const sessionToken = jwt.sign(
                        { email: user.email, universityName: user.universityName, walletAddress: user.walletAddress, jti: sessionId },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                );
                res.cookie(
                        'universityAuthToken', sessionToken, {
                        httpOnly: true,  // Prevents JavaScript access (XSS protection)
                        secure: true,    // Only sent over HTTPS
                        sameSite: 'none',// Prevents CSRF
                        maxAge: 3600000// 1 hour
                });
                res.status(200).json({ message: "Login successful!" });
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

                if (!university.isRegistered) {
                        return res.status(404).json({ message: "University not found or not registered." });
                } else {
                        console.log("Successfully received data from the contract.");

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

                await fs.writeFile(publicKeyPath, publicKey);

                const formData = new FormData();
                formData.append('pdf', createReadStream(pdfPath));
                formData.append('public_key', createReadStream(publicKeyPath));

                const response = await axios.post(`${process.env.Python_Api_Url}/verify-pdf`, formData, { headers: formData.getHeaders() });

                await fs.unlink(publicKeyPath);

                if (response.data.valid) {

                        const fileBuffer = await fs.readFile(pdfPath);
                        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                        verifiedFiles[fileHash] = {
                                verifiedBy: walletAddress,
                                timestamp: Date.now()
                        };
                        res.status(200).json({ message: 'PDF signature verified successfully.' });
                } else {
                        await fs.unlinkSync(pdfPath);
                        res.status(400).json({ message: 'Warning: The uploaded PDF is not signed by you.' });
                }
        } catch (error) {
                await fs.unlink(pdfPath).catch(() => {})
                await fs.unlink(publicKeyPath).catch(() => {});
                console.error('Error verifying PDF:', error.response ? error.response.data : error.message);
                res.status(500).json({ message: 'An error occurred during PDF verification.' });
        }
});

app.post('/get-signature-details', verifyLimiter, authenticateToken, async (req, res) => {
        const { ipfsCid } = req.body;
        const { walletAddress } = req.user; // Securely from JTI session

        // Create unique temp paths to prevent collisions
        const pdfPath = `./temp_revoke_${Date.now()}.pdf`;
        const publicKeyPath = `./temp_revoke_pub_${Date.now()}.pem`;

        try {
                // 1. Download the PDF from IPFS using the CID
                const pdfResponse = await axios.get(`https://dweb.link/ipfs/${ipfsCid}`, {
                        responseType: 'arraybuffer'
                });
                await fs.writeFile(pdfPath, pdfResponse.data);

                // 2. Fetch the university's public key from the blockchain
                const university = await contract.universities(walletAddress);
                if (!university.publicKey) {
                        throw new Error("University public key not found on-chain.");
                }
                await fs.writeFile(publicKeyPath, university.publicKey);

                // 3. Handshake with the Python PDF Handler
                const formData = new FormData();
                formData.append('pdf', createReadStream(pdfPath));
                formData.append('public_key', createReadStream(publicKeyPath));

                const pythonResponse = await axios.post(`${process.env.Python_Api_Url}/verify-pdf`, formData, {
                        headers: formData.getHeaders()
                });

                // 4. Return the signature metadata
                if (pythonResponse.data.valid) {
                        res.status(200).json({
                                signer: pythonResponse.data.signer,
                                timestamp: pythonResponse.data.timestamp
                        });
                } else {
                        res.status(400).json({ message: "Digital signature verification failed for this PDF." });
                }
        } catch (error) {
                console.error('Signature fetch error:', error);
                res.status(500).json({ message: "Failed to retrieve digital signature details." });
        } finally {
                // Essential cleanup to prevent disk bloat
                await fs.unlink(pdfPath).catch(() => {});
                await fs.unlink(publicKeyPath).catch(() => {});
        }
});


// --- Upload Certificate to IPFS Endpoint ---
app.post('/upload-certificate', authenticateToken, upload.single('pdf'), async (req, res) => {
        const { walletAddress } = req.user;
        if (!req.file) {
                return res.status(400).json({ message: 'No PDF file uploaded.' });
        }
        const pdfPath = req.file.path;
        try {
                const fileBuffer = await fs.readFile(pdfPath);
                const currentFileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                const verificationRecord = verifiedFiles[currentFileHash];

                if (!verificationRecord || verificationRecord.verifiedBy !== walletAddress) {
                        return res.status(403).json({
                                message: 'Security Violation: This file has not been verified or does not belong to you.'
                        });
                }

                // --- NEW PINATA-WEB3 SYNTAX START ---
                // 1. Convert Buffer to a Blob/File format that the new SDK expects
                const blob = new Blob([fileBuffer]);
                const fileToUpload = new File([blob], req.file.originalname, { type: "application/pdf" });

                // 2. Use the new .upload.file() method
                const result = await pinata.upload.file(fileToUpload).addMetadata({
                        name: `Certificate_${req.file.originalname}_${Date.now()}`
                });
                // --- NEW PINATA-WEB3 SYNTAX END ---

                delete verifiedFiles[currentFileHash];
                res.status(200).json({ message: 'File uploaded to IPFS successfully.', ipfsCid: result.IpfsHash });
        } catch (error) {
                console.error('Error uploading to IPFS:', error);
                res.status(500).json({ message: 'An error occurred during IPFS upload.' });
        } finally {
                await fs.unlink(pdfPath).catch(() => {});
        }
});

// --- MODIFIED ENDPOINT: Prepare Certificate Hash & Transaction ---
app.post('/prepare-certificate-hash', authenticateToken, async (req, res) => {
        // NOTE: The student's email is now required to prepare the certificate
        const { ipfsCid, studentName, courseName, issueDate, grade, studentEmail } = req.body;
        if (!ipfsCid || !studentName || !courseName || !issueDate || !studentEmail) {
                return res.status(400).json({ message: 'Missing required certificate data, including student email.' });
        }

        const { walletAddress, universityName } = req.user;

        try {
                const university = await contract.universities(walletAddress);
                const publicKey = university.publicKey;
                if (!publicKey) {
                        return res.status(404).json({ message: 'Could not find a public key for this university on the blockchain.' });
                }

                // --- DATA FOR HASHING & JSON ---
                // This object contains all data needed for verification and will be sent to the student.
                // The order of properties does not matter for the JSON, but the concatenation order for the hash is critical.
                const certificateDataForJson = {
                        ipfsCid: ipfsCid,
                        studentName: studentName,
                        universityName: universityName,
                        courseName: courseName,
                        issueDate: issueDate,
                        walletAddress: walletAddress,
                        publicKey: publicKey,
                        grade: grade || 'N/A' // Ensure grade is always present
                };

                // Create the string for hashing. The order MUST BE IDENTICAL on the verification side.
                const stringToHash = `${ipfsCid}${studentName}${universityName}${courseName}${issueDate}${walletAddress}${publicKey}${grade || ''}`;
                const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');

                const certificateId = `CERT-${Date.now()}`;
                const contractInterface = new ethers.Interface(contractABI);
                const unsignedTx = {
                        to: contractAddress,
                        data: contractInterface.encodeFunctionData("issueCertificate", [
                                certificateId,
                                `0x${hash}`
                        ]),
                        from: walletAddress,
                };

                console.log(`Prepared transaction for Certificate ID: ${certificateId} with Hash: 0x${hash}`);

                // Respond with everything the frontend needs to sign the transaction and later send the email.
                res.status(200).json({
                        unsignedTx,
                        certificateId,
                        certificateHash: `0x${hash}`,
                        // We also return the data package so the frontend can send it to the /send-certificate-email endpoint later.
                        certificateDataForJson
                });

        } catch (error) {
                console.error('Error in /prepare-certificate-hash:', error);
                res.status(500).json({ message: 'An error occurred during transaction preparation.' });
        }
});

// --- NEW ENDPOINT: Send Certificate Email with JSON attachment ---
app.post('/send-certificate-email', authenticateToken, async (req, res) => {
        const { studentEmail, studentName, certificateId, certificateData } = req.body;
        if (!studentEmail || !studentName || !certificateId || !certificateData) {
                return res.status(400).json({ message: "Missing data to send certificate email." });
        }

        try {
                // Convert the certificate data object into a formatted JSON string
                const jsonContent = JSON.stringify(certificateData, null, 2);
                const emailHtml=`<p>Dear ${studentName},</p>
                <p>Congratulations! Your new digital certificate has been successfully issued on the blockchain.</p>
                <p>Your unique <strong>Certificate ID</strong> is: <strong>${certificateId}</strong></p>
                <p><strong>IMPORTANT:</strong> Please download and keep the attached JSON file (\`${certificateId}.json\`) in a safe place. You will need this file to verify your certificate.</p>
                <p>Thank you,</p>
                <p>The CertiChain Team</p>`
                await transporter.sendMail({
                        from: '"CertiChain Admin" <yourcertichain@gmail.com>',  // ✅ display name is anything you want
                        to: studentEmail,
                        subject: 'Your Digital Certificate Has Been Issued!',
                        html: emailHtml,
                        attachments: [
                                {
                                        filename: `${certificateId}.json`,
                                        content: Buffer.from(jsonContent, 'utf-8'),
                                        contentType: 'application/json'
                                }
                        ]
                });
                console.log('--- Preparing to send email with attachment: ---', mailOptions.attachments);

                let info = await transporter.sendMail(mailOptions);
                console.log(`Certificate email sent successfully to ${studentEmail} for ID ${certificateId}`);
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                res.status(200).json({ success: true, message: 'Certificate email sent successfully!' });

        } catch (error) {
                console.error(`Failed to send certificate email to ${studentEmail}:`, error);
                res.status(500).json({ success: false, message: 'Failed to send certificate email.' });
        }
});


// --- NEW VERIFICATION ENDPOINT ---
app.post('/verify-certificate-from-qr', verifyLimiter, async (req, res) => {
        const { qrData } = req.body;
        if (!qrData) {
                return res.status(400).json({ message: 'QR data is required.' });
        }

        // 1. Declare paths OUTSIDE try/catch for scoping
        let pdfPath = '';
        let publicKeyPath = '';

        try {
                const [ipfsCid, studentName, universityName, courseName, issueDate, walletAddress, publicKey, certificateId, grade] = qrData.split('|');

                if (!ipfsCid || !studentName || !universityName || !courseName || !issueDate || !walletAddress || !publicKey || !certificateId) {
                        return res.status(400).json({ message: 'Malformed QR data.' });
                }

                // Initialize paths now that we have certificateId
                pdfPath = `./temp_verify_${certificateId}_${Date.now()}.pdf`; // Added timestamp for safety
                publicKeyPath = `./temp_pubkey_${certificateId}_${Date.now()}.pem`;

                // 2. Hash reconstruction & On-chain check
                const stringToHash = `${ipfsCid}${studentName}${universityName}${courseName}${issueDate}${walletAddress}${publicKey}${grade || ''}`;
                const reconstructedHash = `0x${crypto.createHash('sha256').update(stringToHash).digest('hex')}`;

                const onChainCertificate = await contract.certificates(certificateId);
                if (onChainCertificate.certificateHash !== reconstructedHash) {
                        return res.status(400).json({ valid: false, message: 'Hash mismatch.' });
                }
                if (onChainCertificate.isRevoked) {
                        return res.status(400).json({ valid: false, message: 'Certificate has been revoked.' });
                }

                // 3. ASYNC I/O: Download and write
                const pdfResponse = await axios.get(`https://dweb.link/ipfs/${ipfsCid}`, { responseType: 'arraybuffer' });
                await fs.writeFile(pdfPath, pdfResponse.data);
                await fs.writeFile(publicKeyPath, publicKey);

                // 4. Handshake with Python
                const formData = new FormData();
                formData.append('pdf', createReadStream(pdfPath));
                formData.append('public_key', createReadStream(publicKeyPath));

                const pythonResponse = await axios.post(`${process.env.Python_Api_Url}/verify-pdf`, formData, {
                        headers: formData.getHeaders()
                });

                if (!pythonResponse.data.valid) {
                        return res.status(400).json({ valid: false, message: 'PDF signature verification failed.' });
                }

                const signerName = pythonResponse.data.signer || 'ERR_NO_SIGNATURE';

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
                                ipfsCid: ipfsCid
                        }
                });

        } catch (error) {
                console.error('Error:', error.message);
                res.status(500).json({ message: 'An error occurred during verification.' });
        } finally {
                // 5. CLEANUP: This now works because variables are scoped correctly
                if (pdfPath) await fs.unlink(pdfPath).catch(() => { });
                if (publicKeyPath) await fs.unlink(publicKeyPath).catch(() => { });
        }
});

// --- NEW ENDPOINT: Prepare Revocation ---
app.post('/prepare-revoke', authenticateToken, async (req, res) => {
        const { certificateId } = req.body;
        const { walletAddress } = req.user; // From authenticateToken middleware

        if (!certificateId) {
                return res.status(400).json({ message: 'Certificate ID is required.' });
        }

        try {
                // 1. Fetch certificate details from the blockchain
                const onChainCertificate = await contract.certificates(certificateId);
                console.log("Full On-Chain Data:", onChainCertificate);

                // 2. Security Check: Check if certificate exists
                if (onChainCertificate.universityAddress === "0x0000000000000000000000000000000000000000") {
                        return res.status(404).json({ message: "Certificate not found on blockchain." });
                }

                // 3. Security Check: Only the issuing university can revoke
                // We compare the blockchain's universityAddress with the authenticated user's wallet
                if (onChainCertificate.universityAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                        return res.status(403).json({
                                message: "Unauthorized: You can only revoke certificates issued by your university."
                        });
                }

                // 4. Check if already revoked
                if (onChainCertificate.isRevoked) {
                        return res.status(400).json({ message: "Certificate is already revoked." });
                }

                // If all checks pass, tell the frontend it's safe to proceed with the transaction
                res.status(200).json({
                        success: true,
                        message: "Revocation authorized. Proceeding to wallet signature."
                });

        } catch (error) {
                console.error('Error in /prepare-revoke:', error);
                res.status(500).json({ message: 'An error occurred during revocation verification.' });
        }
});


//  --- Logout Endpoint (Hybrid Revocation) --- 
app.post('/logout', authenticateToken, async (req, res) => {
        try {
                const userEmail = req.user.email;

                // 1. STATEFUL REVOCATION: Wipe the JTI from the database
                // This ensures that even if the cookie isn't deleted, the middleware will reject it.
                const { error } = await supabase
                        .from(`${process.env.SUPABASE_TABLE_NAME}`)
                        .update({ active_session_id: null })
                        .eq('email', userEmail.toLowerCase());

                if (error) throw error;

                // 2. STATELESS REVOCATION: Clear the HttpOnly cookie
                res.clearCookie('universityAuthToken', {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none'
                });

                res.status(200).json({ message: "Logged out successfully" });
        } catch (error) {
                console.error('Logout error:', error);
                res.status(500).json({ message: "Error during logout process" });
        }
});
const PORT = `${process.env.PORT}`;
app.listen(PORT, () => {
        console.log(`Backend server is running on ${process.env.Backend_URL}`);
});