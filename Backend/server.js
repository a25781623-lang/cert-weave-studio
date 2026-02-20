// Import necessary libraries
require('dotenv').config();
const express = require('express');
const ethers = require('ethers');
const cors = require('cors');
// Brevo email via plain REST API (axios) - SDK has CommonJS compatibility issues
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs').promises;
const { createReadStream } = require('fs');
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
app.set('trust proxy', 1);
app.use(generalLimiter);
app.use(cookieParser());
app.use(cors({
        origin: function (origin, callback) {
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

const verifiedFiles = {};
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

// --- Brevo Email via REST API ---
async function sendBrevoEmail({ toEmail, toName, subject, htmlContent, attachment = null }) {
        const body = {
                sender: { name: 'CertiChain', email: process.env.BREVO_SENDER_EMAIL },
                to: [{ email: toEmail, name: toName }],
                subject,
                htmlContent,
        };
        if (attachment) body.attachment = [attachment];

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', body, {
                headers: {
                        'api-key': process.env.BREVO_API_KEY,
                        'Content-Type': 'application/json',
                }
        });
        return response.data;
}


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
                /* For Demo Purpose, We will not be checking if University Email WhiteListed that we would have done in real world scenerio, Checked againt UGC's Record
                //const [isWhitelisted, correctEmail] = await contract.isUniversityWhitelisted(universityName);
                if (isWhitelisted && email.toLowerCase() === correctEmail.toLowerCase()) {*/

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

                const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your University – CertiChain</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header / Logo Bar -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#0a0a0f;border-radius:12px;padding:16px 32px;">
                    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">CERTICHAIN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#1a56db 0%,#0ea5e9 100%);height:5px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:48px 48px 8px 48px;">

                    <!-- Icon badge -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background-color:#eff6ff;border-radius:50%;width:56px;height:56px;text-align:center;vertical-align:middle;padding:14px;">
                          <span style="font-size:28px;line-height:1;">🔐</span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">Verify Your Institution</h1>
                    <p style="margin:0 0 28px 0;font-size:15px;color:#64748b;line-height:1.6;">One step away from joining the blockchain-verified academic network.</p>

                    <p style="margin:0 0 28px 0;font-size:15px;color:#334155;line-height:1.75;">
                      Hello <strong style="color:#0f172a;">${universityName}</strong>,<br><br>
                      Thank you for registering with <strong>CertiChain</strong>. To activate your institution's account and establish your on-chain identity, please confirm your email address by clicking the button below.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="border-radius:8px;background:linear-gradient(135deg,#1a56db 0%,#0ea5e9 100%);box-shadow:0 4px 14px rgba(26,86,219,0.35);">
                          <a href="${verificationLink}" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Verify My Account →</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#f8fafc;border-left:3px solid #1a56db;border-radius:0 6px 6px 0;padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                            <strong style="color:#334155;">Link not working?</strong> Copy and paste the URL below into your browser:<br>
                            <a href="${verificationLink}" style="color:#1a56db;word-break:break-all;font-size:12px;">${verificationLink}</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 48px 0;font-size:13px;color:#94a3b8;line-height:1.6;">This link expires in <strong>1 hour</strong>. If you did not initiate this request, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 48px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:24px 48px 36px 48px;">
                    <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;line-height:1.6;">
                      © 2026 CertiChain Inc. &nbsp;|&nbsp; 2701 Olympic Blvd, Santa Monica, CA
                    </p>
                    <p style="margin:0;font-size:12px;">
                      <a href="#" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="#" style="color:#94a3b8;text-decoration:none;">Terms of Use</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="#" style="color:#94a3b8;text-decoration:none;">Support</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Bottom spacer text -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">Secured by blockchain technology. Powered by CertiChain.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

                await sendBrevoEmail({
                        toEmail: email,
                        toName: universityName,
                        subject: 'Verify Your University Registration – CertiChain',
                        htmlContent: emailHtml,
                });


                console.log("Verification email sent.");
                res.status(200).json({ message: `Verification email sent.` });
                /*} else {
                        console.log("Registration failed: University not whitelisted or email does not match.");
                        res.status(400).json({ message: 'University not whitelisted or email does not match.' });
                }*/
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
                console.log("fetchError:", fetchError);
                console.log("user found:", !!user);
                console.log("pending_verification exists:", !!user?.pending_verification);
                console.log("Token from request (last 20):", token.slice(-20));
                console.log("Token in DB (last 20):", user?.pending_verification?.token?.slice(-20));
                console.log("Tokens match:", user?.pending_verification?.token === token);

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
                        })
                        .eq('email', registrationData.email.toLowerCase());


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
// TEMPORARY DEBUG ENDPOINT - remove after testing
app.get('/debug-contract/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
        
        const uni = await contract.universities(walletAddress);
        const [isWhitelisted, whitelistEmail] = await contract.isUniversityWhitelisted("IITS");
        
        res.json({
            isRegistered: uni.isRegistered,
            name: uni.name,
            walletAddress: uni.walletAddress,
            isWhitelisted,
            whitelistEmail,
            contractAddress: process.env.CONTRACT_ADDRESS,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
                await fs.unlink(pdfPath).catch(() => { })
                await fs.unlink(publicKeyPath).catch(() => { });
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
                await fs.unlink(pdfPath).catch(() => { });
                await fs.unlink(publicKeyPath).catch(() => { });
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
                await fs.unlink(pdfPath).catch(() => { });
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
                const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Certificate Has Been Issued – CertiChain</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header / Logo Bar -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#0a0a0f;border-radius:12px;padding:16px 32px;">
                    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:4px;text-transform:uppercase;">CERTICHAIN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Top accent bar — gold/achievement tone -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#b45309 0%,#f59e0b 50%,#fcd34d 100%);height:5px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Hero section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#0f172a;padding:40px 48px;text-align:center;">
                    <p style="margin:0 0 12px 0;font-size:36px;line-height:1;">🎓</p>
                    <h1 style="margin:0 0 10px 0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">Congratulations, ${studentName}!</h1>
                    <p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase;">Your certificate has been issued on the blockchain</p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 8px 48px;">

                    <p style="margin:0 0 28px 0;font-size:15px;color:#334155;line-height:1.75;">
                      Your academic achievement has been permanently recorded on the blockchain and is now verifiable by anyone, anywhere, at any time — with full cryptographic integrity.
                    </p>

                    <!-- Certificate ID highlight box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#fefce8 0%,#fffbeb 100%);border:1px solid #fde68a;border-radius:10px;padding:20px 24px;">
                          <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#92400e;letter-spacing:1.5px;text-transform:uppercase;">Certificate ID</p>
                          <p style="margin:0;font-size:17px;font-weight:700;color:#0f172a;font-family:'Courier New',Courier,monospace;letter-spacing:0.5px;">${certificateId}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Important notice box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px 24px;">
                          <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#0369a1;">📎 &nbsp;Important: Save Your Verification File</p>
                          <p style="margin:0;font-size:13px;color:#0c4a6e;line-height:1.7;">
                            A <strong>${certificateId}.txt</strong> file is attached to this email. This file contains the cryptographic data required to verify your certificate. 
                            <strong>Please store it securely</strong> — you will need it to verify your credentials on the CertiChain platform.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- What's next section -->
                    <p style="margin:0 0 16px 0;font-size:13px;font-weight:600;color:#64748b;letter-spacing:1px;text-transform:uppercase;">What happens next</p>

                    <!-- Step list -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="padding:0 0 14px 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="width:32px;vertical-align:top;padding-top:1px;">
                                <div style="width:24px;height:24px;background-color:#1a56db;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">1</div>
                              </td>
                              <td style="font-size:14px;color:#334155;line-height:1.6;padding-left:12px;">Download and save the attached <strong>${certificateId}.txt</strong> file to a secure location.</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 14px 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="width:32px;vertical-align:top;padding-top:1px;">
                                <div style="width:24px;height:24px;background-color:#1a56db;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">2</div>
                              </td>
                              <td style="font-size:14px;color:#334155;line-height:1.6;padding-left:12px;">Share your Certificate ID with employers, institutions, or anyone who needs to verify your credentials.</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="width:32px;vertical-align:top;padding-top:1px;">
                                <div style="width:24px;height:24px;background-color:#1a56db;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">3</div>
                              </td>
                              <td style="font-size:14px;color:#334155;line-height:1.6;padding-left:12px;">Verifiers can confirm authenticity instantly on the CertiChain platform — no central authority required.</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 40px 0;font-size:13px;color:#94a3b8;line-height:1.6;">
                      If you have any questions or did not expect this email, please contact your issuing institution directly.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 48px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:24px 48px 36px 48px;">
                    <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;line-height:1.6;">
                      © 2026 CertiChain Inc. &nbsp;|&nbsp; 2701 Olympic Blvd, Santa Monica, CA
                    </p>
                    <p style="margin:0;font-size:12px;">
                      <a href="#" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="#" style="color:#94a3b8;text-decoration:none;">Terms of Use</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="#" style="color:#94a3b8;text-decoration:none;">Support</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Bottom spacer text -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">Secured by blockchain technology. Powered by CertiChain.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
                await sendBrevoEmail({
                        toEmail: studentEmail,
                        toName: studentName,
                        subject: 'Your Digital Certificate Has Been Issued!',
                        htmlContent: emailHtml,
                        attachment: {
                                name: `${certificateId}.txt`,
                                content: Buffer.from(jsonContent, 'utf-8').toString('base64'),
                        }
                });
                console.log(`Certificate email sent successfully to ${studentEmail} for ID ${certificateId}`);
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