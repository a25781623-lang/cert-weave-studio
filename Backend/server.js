// Import necessary libraries
require('dotenv').config();
const express = require('express');
const  ethers  = require('ethers');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs'); // <--- THIS IS THE CORRECTED LINE
const FormData = require('form-data');
const { PinataSDK } = require('pinata-web3');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');


// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// --- Migrated to Supabase (for production) ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const verifiedFiles={};

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

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                        console.error("JWT Verification Error:", err.message);
                        return res.sendStatus(403);
                }
                const { data: user, error } = await supabase
                        .from(`${process.env.SUPABASE_TABLE_NAME}`)
                        .select('*')
                        .eq('email', decoded.email.toLowerCase())
                        .single();
                if (error || !user) {
                        return res.status(401).json({ message: "User no longer exists." });
                        }
                req.user=user;
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
                                from: '"CertiChain Admin" <admin@certichain.com>',
                                to: email,
                                subject: 'Verify Your University Registration',
                                html: emailHtml, // Use the new pretty HTML here
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
                const_=jwt.verify(token, process.env.JWT_SECRET);
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
                const _ = jwt.verify(token, process.env.JWT_SECRET);
                const registrationData = pendingVerifications[token];

                console.log("Token is valid for finalization.");
                if (!registrationData) {
                        return res.status(400).json({ message: 'This verification link has already been used.' });
                }

                const correctWalletAddress = registrationData.walletAddress;

                // --- DEBUGGING: Deleting the token now ---
                console.log("Deleting token from pendingVerifications.");
                
                console.log("Pending verifications object after deletion:", Object.keys(pendingVerifications));

                console.log(`Finalizing account for ${registrationData.universityName}.`);

                const hashedPassword = await bcrypt.hash(password, 10);
                const { error } = await supabase
                .from(`${process.env.SUPABASE_TABLE_NAME}`)
                .insert([{
                        email: registrationData.email.toLowerCase(),
                        universityname: registrationData.universityName,
                        walletaddress: correctWalletAddress,
                        hashedpassword: hashedPassword
                }]);
                delete pendingVerifications[token];

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
app.post('/login', async (req, res) => {
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
                const isMatch = await bcrypt.compare(password, user.hashedpassword);
                if (!isMatch) {
                        return res.status(401).json({ message: "Invalid email or password." });
                }
                const sessionToken = jwt.sign(
                        {
                                email: user.email,
                                universityName: user.universityname,
                                walletaddress: user.walletaddress
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
        const { walletaddress } = req.user;
        
        console.log(`\n--- [/get-university-details] Attempting to fetch details for ${walletaddress} ---`);

        try {
                // --- FIX: Create a fresh provider and contract instance for each request ---
                // This mirrors the successful test script and prevents stale connections.
                console.log("Creating a new connection to the RPC provider...");
                const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);
                const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
                console.log("Connection successful. Querying the smart contract...");

                // Query the smart contract directly using the user's wallet address
                const university = await contract.universities(walletaddress);
                
                if (!university.isRegistered) {
                        return res.status(404).json({ message: "University not found or not registered." });
                }else{
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

        const { walletaddress, universityname } = req.user;
        const pdfPath = req.file.path;
        const publicKeyPath = `./${universityname}_pubkey.pem`;

        try {
                const university = await contract.universities(walletaddress);
                const publicKey = university.publicKey;
                if (!publicKey) throw new Error("Public key not found on-chain.");

                fs.writeFileSync(publicKeyPath, publicKey);

                const formData = new FormData();
                formData.append('pdf', fs.createReadStream(pdfPath));
                formData.append('public_key', fs.createReadStream(publicKeyPath));

                const response = await axios.post(`${process.env.Python_Api_Url}/verify-pdf`, formData, { headers: formData.getHeaders() });

                fs.unlinkSync(publicKeyPath);

                if (response.data.valid) {
                        
                        const fileBuffer = fs.readFileSync(pdfPath);
                        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                        verifiedFiles[fileHash] = {
                                        verifiedBy: walletaddress,
                                        timestamp: Date.now()
                                };
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
        const { walletaddress} = req.user;
        if (!req.file) {
                return res.status(400).json({ message: 'No PDF file uploaded.' });
        }
        const pdfPath = req.file.path;
        try {
                const fileBuffer = fs.readFileSync(pdfPath);
                const currentFileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                const verificationRecord = verifiedFiles[currentFileHash];
                
                if (!verificationRecord || verificationRecord.verifiedBy !== walletaddress) {
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
                if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        }
});

// --- MODIFIED ENDPOINT: Prepare Certificate Hash & Transaction ---
app.post('/prepare-certificate-hash', authenticateToken, async (req, res) => {
        // NOTE: The student's email is now required to prepare the certificate
        const { ipfsCid, studentName, courseName, issueDate, grade, studentEmail } = req.body;
        if (!ipfsCid || !studentName || !courseName || !issueDate || !studentEmail) {
                return res.status(400).json({ message: 'Missing required certificate data, including student email.' });
        }

        const { walletaddress, universityname } = req.user;

        try {
                const university = await contract.universities(walletaddress);
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
                        universityname: universityname,
                        courseName: courseName,
                        issueDate: issueDate,
                        walletaddress: walletaddress,
                        publicKey: publicKey,
                        grade: grade || 'N/A' // Ensure grade is always present
                };

                // Create the string for hashing. The order MUST BE IDENTICAL on the verification side.
                const stringToHash = `${ipfsCid}${studentName}${universityname}${courseName}${issueDate}${walletaddress}${publicKey}${grade || ''}`;
                const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');

                const certificateId = `CERT-${Date.now()}`;
                const contractInterface = new ethers.Interface(contractABI);
                const unsignedTx = {
                        to: contractAddress,
                        data: contractInterface.encodeFunctionData("issueCertificate", [
                                certificateId,
                                `0x${hash}`
                        ]),
                        from: walletaddress,
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

                const mailOptions = {
                        from: '"CertiChain Admin" <admin@certichain.com>',
                        to: studentEmail,
                        subject: 'Your Digital Certificate Has Been Issued!',
                        html: `
                <p>Dear ${studentName},</p>
                <p>Congratulations! Your new digital certificate has been successfully issued on the blockchain.</p>
                <p>Your unique <strong>Certificate ID</strong> is: <strong>${certificateId}</strong></p>
                <p><strong>IMPORTANT:</strong> Please download and keep the attached JSON file (\`${certificateId}.json\`) in a safe place. You will need this file to verify your certificate.</p>
                <p>Thank you,</p>
                <p>The CertiChain Team</p>
            `,
                        attachments: [
                                {
                                        filename: `${certificateId}.json`,
                                        content: Buffer.from(jsonContent, 'utf-8'),
                                        contentType: 'application/json'
                                }
                        ]
                };
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
app.post('/verify-certificate-from-qr', async (req, res) => {
        const { qrData } = req.body;
        if (!qrData) {
                return res.status(400).json({ message: 'QR data is required.' });
        }

        try {
                // 1. Deconstruct the QR data
                const [ipfsCid, studentName, universityname, courseName, issueDate, walletaddress, publicKey, certificateId, grade] = qrData.split('|');
                if (!ipfsCid || !studentName || !universityname || !courseName || !issueDate || !walletaddress || !publicKey || !certificateId) {
                        return res.status(400).json({ message: 'Malformed QR data. Some fields are missing.' });
                }
                // 2. Reconstruct the hash
                const stringToHash = `${ipfsCid}${studentName}${universityname}${courseName}${issueDate}${walletaddress}${publicKey}${grade || ''}`;
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

                const pythonResponse = await axios.post(`${process.env.Python_Api_Url}/verify-pdf`, formData, { headers: formData.getHeaders() });

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
                                universityname,
                                walletaddress,
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


const PORT = `${process.env.PORT}`;
app.listen(PORT, () => {
        console.log(`Backend server is running on ${process.env.Backend_URL}`);
});