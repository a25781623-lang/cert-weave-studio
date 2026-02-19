# CertiChain — Blockchain Certificate Verification System

> A full-stack decentralized application (dApp) for issuing, managing, and verifying educational certificates using blockchain technology, cryptographic digital signatures, and IPFS-based permanent storage.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Directory Structure](#4-directory-structure)
5. [Core Workflows](#5-core-workflows)
   - 5.1 [University Registration Flow](#51-university-registration-flow)
   - 5.2 [Certificate Issuance Flow](#52-certificate-issuance-flow)
   - 5.3 [Certificate Verification Flow](#53-certificate-verification-flow)
   - 5.4 [Certificate Revocation Flow](#54-certificate-revocation-flow)
6. [Backend — Node.js (server.js)](#6-backend--nodejs-serverjs)
   - 6.1 [All API Endpoints](#61-all-api-endpoints)
   - 6.2 [Middleware](#62-middleware)
   - 6.3 [Rate Limiting](#63-rate-limiting)
7. [Backend — Python (Flask / pdf_handler.py)](#7-backend--python-flask--pdf_handlerpy)
8. [Frontend — React + TypeScript](#8-frontend--react--typescript)
   - 8.1 [Pages & Routes](#81-pages--routes)
   - 8.2 [Key Components](#82-key-components)
   - 8.3 [State Management](#83-state-management)
9. [Smart Contract Integration](#9-smart-contract-integration)
   - 9.1 [ABI & Functions](#91-abi--functions)
   - 9.2 [Blockchain Network](#92-blockchain-network)
10. [Database — Supabase](#10-database--supabase)
11. [IPFS Storage — Pinata](#11-ipfs-storage--pinata)
12. [Security Architecture](#12-security-architecture)
    - 12.1 [Authentication & Session Management](#121-authentication--session-management)
    - 12.2 [PDF Digital Signature Verification](#122-pdf-digital-signature-verification)
    - 12.3 [Cryptographic Certificate Hashing](#123-cryptographic-certificate-hashing)
    - 12.4 [Blockchain Tamper-Proofing](#124-blockchain-tamper-proofing)
    - 12.5 [File Upload Security](#125-file-upload-security)
    - 12.6 [API Security](#126-api-security)
    - 12.7 [Authorization Guards](#127-authorization-guards)
13. [Environment Configuration](#13-environment-configuration)
14. [Installation & Setup](#14-installation--setup)
15. [The Desktop PDF Signing Application](#15-the-desktop-pdf-signing-application)
16. [Data Flow Diagrams](#16-data-flow-diagrams)
17. [Error Handling](#17-error-handling)
18. [Known Considerations & Limitations](#18-known-considerations--limitations)

---

## 1. Project Overview

CertiChain is a multi-layer system designed to solve certificate forgery and fraud in education. Traditional paper or PDF certificates can be easily forged. CertiChain solves this by:

- **Cryptographically signing** each PDF certificate at the file level using RSA/PKCS1v15 + SHA-256.
- **Pinning the signed PDF to IPFS** (via Pinata) for permanent, decentralized storage.
- **Recording a SHA-256 hash** of the certificate's metadata on a public blockchain smart contract, creating an immutable tamper-proof record.
- **Enabling instant verification** by any employer or third party — no account needed — via QR code scan or Certificate ID + JSON data file.

The system operates in three distinct user roles:

| Role | Description |
|------|-------------|
| **Blockchain Admin** | Whitelists universities on the smart contract |
| **University** | Registers, issues, and revokes certificates via the portal |
| **Employer / Verifier** | Verifies certificates using the public verification portal |

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  University Portal │ Employer Verification Portal │ Landing Page │
└──────────────────┬───────────────────────────────┬───────────────┘
                   │ HTTP (Axios + Cookies)         │ HTTP
                   ▼                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   NODE.JS BACKEND (Express)                      │
│  Auth │ Registration │ Issuance │ Verification │ Email │ IPFS   │
└────┬──────────┬──────────────┬──────────────────┬───────────────┘
     │          │              │                  │
     ▼          ▼              ▼                  ▼
 Supabase   Nodemailer    Python Flask        Pinata IPFS
 (Postgres)  (Email)      (PDF Verify)        (Storage)
                               │
                               ▼
                     PyPDF2 + cryptography
                     (Signature Verification)
                               │
                               ▼
                  ┌────────────────────────────┐
                  │  BLOCKCHAIN (MegaEth/EVM)  │
                  │   CertiChain.sol Contract  │
                  └────────────────────────────┘
```

---

## 3. Technology Stack

### Backend (Node.js)
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | HTTP server framework |
| ethers | ^6.13.1 | Ethereum / EVM blockchain interaction |
| @supabase/supabase-js | ^2.96.0 | PostgreSQL database (Supabase) |
| jsonwebtoken | ^9.0.0 | JWT-based session tokens |
| bcryptjs | ^3.0.3 | Password hashing (bcrypt) |
| multer | ^2.0.2 | Multipart file upload handling |
| axios | ^1.13.5 | Internal HTTP calls to Python service |
| nodemailer | ^8.0.1 | Email sending (Ethereal for dev) |
| pinata-web3 | ^0.5.4 | IPFS pinning via Pinata |
| express-rate-limit | ^8.2.1 | API rate limiting |
| cors | ^2.8.5 | Cross-origin resource sharing |
| cookie-parser | ^1.4.7 | HTTP-only cookie handling |
| uuid | ^13.0.0 | Session ID generation |
| crypto (built-in) | — | SHA-256 hashing |

### Backend (Python / Flask)
| Package | Purpose |
|---------|---------|
| Flask | HTTP server for PDF verification microservice |
| PyPDF2 | Read PDF metadata and content |
| cryptography | RSA public key loading, PKCS1v15 signature verification |
| hashlib | SHA-256 content hashing |
| json | Signed data serialization |

### Frontend (React)
| Package | Purpose |
|---------|---------|
| React 18 + TypeScript | UI framework |
| react-router-dom v7 | Client-side routing |
| ethers ^6.16.0 | MetaMask wallet interaction |
| axios | HTTP client |
| @tanstack/react-query | Data fetching/caching |
| qrcode.react | QR code generation |
| shadcn/ui + Radix UI | Component library |
| Tailwind CSS | Utility-first styling |
| js-sha256 | Client-side certificate hash reconstruction |
| zod | Form validation schemas |
| vite | Build tool |

### Blockchain
| Item | Details |
|------|---------|
| Network | MegaEth Testnet |
| RPC URL | https://carrot.megaeth.com/rpc |
| Contract Language | Solidity |
| Wallet Integration | MetaMask (EIP-1193) |
| ethers.js version | v6 |

---

## 4. Directory Structure

```
project-root/
├── Backend/
│   ├── server.js              # Main Node.js/Express API server
│   ├── pdf_handler.py         # Python PDF signature verification logic
│   ├── app.py                 # Flask microservice for PDF verification
│   ├── package.json           # Node.js dependencies
│   └── example.env            # Environment variable template
├── Frontend/
│   ├── src/
│   │   ├── App.tsx            # Root app + router configuration
│   │   ├── main.tsx           # React DOM entry point
│   │   ├── pages/
│   │   │   ├── Index.tsx      # Landing page
│   │   │   ├── NotFound.tsx   # 404 page
│   │   │   ├── employer/
│   │   │   │   ├── Verify.tsx       # Employer certificate input form
│   │   │   │   └── Result.tsx       # Verification result display
│   │   │   └── university/
│   │   │       ├── Login.tsx        # University login
│   │   │       ├── Register.tsx     # University registration (Step 1)
│   │   │       ├── CreateAccount.tsx# Account creation (Step 2: on-chain + password)
│   │   │       ├── Dashboard.tsx    # Issue certificates
│   │   │       ├── Certificates.tsx # View/verify certificates in bulk
│   │   │       ├── Revoke.tsx       # Revoke a certificate
│   │   │       └── ProtectedRoute.tsx # Auth guard HOC
│   │   ├── components/
│   │   │   ├── UniversitySidebar.tsx # Sidebar navigation with logout
│   │   │   └── ui/                   # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── use-toast.ts   # Toast notification system
│   │   │   └── use-mobile.tsx # Responsive breakpoint hook
│   │   ├── lib/
│   │   │   ├── hash.ts        # Client-side certificate hash reconstruction
│   │   │   └── utils.ts       # Tailwind class merge utility
│   │   ├── abis/
│   │   │   └── CertiChain.json # Smart contract ABI
│   │   └── types/
│   │       └── certificate.ts # TypeScript interfaces
│   ├── components.json        # shadcn/ui config
│   ├── package.json           # Frontend dependencies
│   └── vite.config (implied)
```

---

## 5. Core Workflows

### 5.1 University Registration Flow

This is a **3-step flow** combining off-chain email verification and on-chain blockchain registration.

```
Step 1: /register (POST)
  ├── Frontend sends: universityName, email, publicKey, walletAddress
  ├── Backend queries smart contract: isUniversityWhitelisted(name)
  │     └── Only pre-whitelisted universities can register
  ├── Validates email matches the on-chain whitelist record
  ├── Creates a JWT token (1 hour expiry) containing all registration data
  ├── Stores token → data mapping in pendingVerifications{} (in-memory)
  └── Sends verification email via Nodemailer with a link:
        ${FRONTEND_URL}/create-account/${token}

Step 2: /prepare-registration (POST)
  ├── Frontend sends: token, walletAddress
  ├── Backend verifies the JWT token is valid and not expired
  ├── Looks up registration data from pendingVerifications{}
  ├── Encodes the registerUniversity(name, publicKey) contract call
  └── Returns an unsignedTx object for MetaMask to sign

Step 3: /finalize-registration (POST)
  ├── Frontend sends: token, password, txHash
  ├── Backend re-verifies the JWT token
  ├── Hashes password with bcrypt (10 rounds)
  ├── Inserts university record into Supabase:
  │     { email, universityname, walletaddress, hashedpassword }
  ├── Deletes token from pendingVerifications{}
  └── Returns 201 Created

On-chain (handled by frontend via MetaMask):
  └── Calls registerUniversity(name, publicKey) on the smart contract
```

**Key security note:** The token is NOT deleted until Step 3 succeeds, ensuring atomicity. Deletion happens immediately before the DB insert to prevent replay attacks.

---

### 5.2 Certificate Issuance Flow

This is a **4-step pipeline** (verify → upload → hash → sign):

```
Step 1: SIGNATURE VERIFICATION
  ├── University uploads a signed PDF
  ├── POST /verify-signature (authenticated)
  ├── Backend fetches the university's public key from the blockchain
  ├── Forwards PDF + public key to Python Flask service: /verify-pdf
  ├── Python verifies the embedded RSA digital signature
  ├── If valid: stores { fileHash → { verifiedBy, timestamp } } in verifiedFiles{}
  └── If invalid: rejects upload

Step 2: IPFS UPLOAD
  ├── POST /upload-certificate (authenticated)
  ├── Re-reads the uploaded file and computes its SHA-256 hash
  ├── Cross-checks hash against verifiedFiles{} to ensure same file
  │     AND that verifiedBy matches the current user's wallet address
  ├── Uploads PDF to Pinata IPFS using pinata.upload.file()
  ├── Deletes the verifiedFiles{} entry (one-time use)
  └── Returns { ipfsCid }

Step 3: HASH PREPARATION
  ├── POST /prepare-certificate-hash (authenticated)
  ├── Fetches university's public key from blockchain
  ├── Constructs deterministic hash string:
  │     SHA256(ipfsCid + studentName + universityname + courseName +
  │            issueDate + walletaddress + publicKey + grade)
  ├── Generates certificateId: "CERT-{timestamp}"
  ├── Encodes issueCertificate(certId, "0x"+hash) as unsignedTx
  └── Returns { unsignedTx, certificateId, certificateHash, certificateDataForJson }

Step 4: BLOCKCHAIN SIGNING (client-side via MetaMask)
  ├── Frontend sends the unsignedTx to MetaMask for signing
  ├── Transaction is mined on MegaEth
  ├── QR code is generated encoding:
  │     ipfsCid|studentName|universityname|courseName|issueDate|
  │     walletAddress|publicKey|certificateId|grade
  └── POST /send-certificate-email sends student a JSON data file
        containing all certificate data for future verification
```

---

### 5.3 Certificate Verification Flow

There are two verification methods:

**Method A — QR Code Scan (Employer Portal)**
```
1. Employer scans QR code → extracts pipe-delimited data string
2. POST /verify-certificate-from-qr (public, rate-limited)
3. Backend:
   a. Reconstructs SHA-256 hash from QR data fields
   b. Queries smart contract: certificates(certificateId)
   c. Compares reconstructed hash with on-chain hash
   d. Checks isRevoked flag
   e. Downloads PDF from IPFS via dweb.link gateway
   f. Calls Python Flask service to verify PDF signature
   g. Returns full certificate details if all checks pass
```

**Method B — ID + JSON File (Employer Portal)**
```
1. Employer enters Certificate ID and uploads the JSON data file
2. Frontend reconstructs the pipe-delimited QR data string from JSON
3. Navigates to /verify/result?qrData=<encoded>
4. Result page calls POST /verify-certificate-from-qr (same endpoint)
5. Same verification pipeline executes
```

**Three-layer verification:**
- Layer 1: **Hash integrity** — reconstructed hash matches on-chain hash
- Layer 2: **Revocation status** — not marked as revoked on-chain
- Layer 3: **PDF signature** — Python verifies RSA signature embedded in PDF metadata

---

### 5.4 Certificate Revocation Flow

```
1. University provides Certificate ID + JSON file (in Revoke.tsx)
2. Frontend reconstructs hash and verifies against blockchain directly (read-only)
3. POST /prepare-revoke (authenticated) — backend security checks:
   a. Fetches certificate from blockchain
   b. Verifies the certificate issuer's walletAddress matches logged-in user
   c. Checks certificate is not already revoked
   d. Returns authorization approval
4. Frontend calls revokeCertificate(certificateId) on smart contract via MetaMask
5. Certificate is permanently marked as revoked on-chain
```

---

## 6. Backend — Node.js (server.js)

### 6.1 All API Endpoints

| Method | Endpoint | Auth Required | Rate Limited | Description |
|--------|----------|---------------|--------------|-------------|
| POST | `/register` | No | generalLimiter | Initiate university registration, send email |
| POST | `/prepare-registration` | No | No | Return unsigned blockchain tx for wallet signing |
| POST | `/finalize-registration` | No | generalLimiter | Save password to DB, complete registration |
| POST | `/login` | No | generalLimiter | Authenticate, set HttpOnly JWT cookie |
| POST | `/logout` | Yes | No | Revoke session, clear cookie |
| GET | `/get-university-details` | Yes | No | Fetch university name + public key from blockchain |
| POST | `/verify-signature` | Yes | No | Verify PDF RSA signature via Python service |
| POST | `/upload-certificate` | Yes | No | Upload verified PDF to IPFS via Pinata |
| POST | `/prepare-certificate-hash` | Yes | No | Compute hash, prepare blockchain transaction |
| POST | `/send-certificate-email` | Yes | No | Email certificate JSON data file to student |
| POST | `/verify-certificate-from-qr` | No | verifyLimiter | Full 3-layer certificate verification |
| POST | `/prepare-revoke` | Yes | No | Authorize certificate revocation |

---

### 6.2 Middleware

**`authenticateToken` middleware** is applied to all protected routes:

```
1. Reads 'universityAuthToken' from HttpOnly cookie (not Authorization header)
2. Verifies JWT signature using JWT_SECRET
3. Queries Supabase for the user by email
4. Compares token's jti (JWT ID) with user's active_session_id in DB
   └── If mismatch → 401 "Session expired or logged in elsewhere"
5. Attaches full user object to req.user
6. Calls next()
```

This implements **stateful JWT revocation** — even a valid, non-expired JWT is rejected if its session ID has been overwritten (e.g., by a new login or logout).

---

### 6.3 Rate Limiting

Two rate limiters are configured using `express-rate-limit`:

| Limiter | Window | Max Requests | Applied To |
|---------|--------|--------------|------------|
| `generalLimiter` | 1 hour | 500 requests | All routes globally + /register, /finalize-registration, /login |
| `verifyLimiter` | 15 minutes | 20 requests | /verify-certificate-from-qr only |

The `/verify-certificate-from-qr` endpoint gets stricter limits because it's public-facing and performs expensive operations (IPFS download + blockchain queries + Python crypto).

---

## 7. Backend — Python (Flask / pdf_handler.py)

The Python service runs as a separate microservice on port 5000 (configurable). The Node.js backend calls it internally.

### `POST /verify-pdf`

Accepts `multipart/form-data` with:
- `pdf` — the PDF file to verify
- `public_key` — the university's RSA public key in PEM format

**Verification steps in `PDFHandler.verifypdfsignature()`:**

```
1. Load RSA public key from PEM file using cryptography library

2. Open PDF using PyPDF2, extract metadata

3. Check for required metadata fields:
   └── /Digital_Signature must exist, else return False

4. Extract from metadata:
   - stored_signature: bytes.fromhex(metadata['/Digital_Signature'])
   - stored_content_hash: metadata['/Original_Content_Hash']
   - signed_data object: {content_hash, signer, timestamp,
                          signature_version, key_algorithm, key_size}

5. TAMPER DETECTION:
   a. Reconstruct "clean" PDF (all pages, strip signature metadata)
   b. Compute SHA-256 of reconstructed PDF bytes
   c. Compare with stored_content_hash
   └── If mismatch → "PDF TAMPERING DETECTED"

6. SIGNATURE VERIFICATION:
   a. Serialize signed_data as sorted JSON bytes
   b. Call public_key.verify(stored_signature, message,
                             padding.PKCS1v15(), hashes.SHA256())
   └── If cryptography raises → verification failed

7. Return (True, {signer, timestamp, tamper_proof, metadata})
    or (False, {error, ...})
```

**`app.py` (Flask wrapper):**
- Saves uploaded files with unique random hex temp names to avoid conflicts
- Calls `pdf_handler.verifypdfsignature()`
- Returns flat JSON response merging metadata into top-level keys on success
- Cleans up temp files after each request

---

## 8. Frontend — React + TypeScript

### 8.1 Pages & Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | `Index.tsx` | Public |
| `/verify` | `employer/Verify.tsx` | Public |
| `/verify/result` | `employer/Result.tsx` | Public |
| `/university/login` | `university/Login.tsx` | Public |
| `/university/register` | `university/Register.tsx` | Public |
| `/create-account/:token` | `university/CreateAccount.tsx` | Public (token-gated) |
| `/university/dashboard` | `university/Dashboard.tsx` | Protected |
| `/university/certificates` | `university/Certificates.tsx` | Protected |
| `/university/revoke` | `university/Revoke.tsx` | Protected |
| `*` | `NotFound.tsx` | Public |

Protected routes are wrapped by `<ProtectedRoute>` which calls `/get-university-details` to validate the session cookie before rendering.

---

### 8.2 Key Components

**`ProtectedRoute.tsx`**
```
- On mount, calls GET /get-university-details with withCredentials: true
- If 200: renders <Outlet /> (the protected page)
- If error: redirects to /university/login
- While checking: shows "Loading..." to prevent content flash
```

**`UniversitySidebar.tsx`**
```
- Collapsible sidebar: 64px collapsed, 256px expanded on hover
- Menu items: Issue Certificate, View All Certificates, Revoke Certificate
- Logout button calls POST /logout (withCredentials: true)
  └── On success or failure: navigates to /university/login
```

**`Dashboard.tsx` — Issuance UI**
```
- Tracks issuance step: idle → verifying → uploading → hashing → signing → confirmed/failed
- Step-aware button state with spinners
- QR code rendered using qrcode.react after success
- "Send to Student" button triggers email with JSON attachment
- Fetches universityDetails (name, publicKey) on mount via /get-university-details
```

**`Certificates.tsx` — Bulk Verification**
```
- Accepts multiple JSON file uploads simultaneously
- For each file: reconstructs QR data string, calls /verify-certificate-from-qr
- Displays results in a table with Badge components showing status
- Uses filename (without .json) as the Certificate ID
```

**`Revoke.tsx`**
```
- Client-side verification BEFORE revoking:
  1. Reads JSON file, reconstructs hash using reconstructCertificateHash()
  2. Directly queries blockchain via ethers.js (read-only provider)
  3. Checks: exists, not already revoked, hash matches
  4. Shows confirmation UI with certificate details
- Then calls /prepare-revoke for server-side authorization
- Then calls revokeCertificate() on smart contract via MetaMask
```

---

### 8.3 State Management

The application uses local component state (useState) for most interactions. No global state manager (Redux/Zustand) is used. React Query (`@tanstack/react-query`) is configured at the app level but primarily used for the query client setup. Auth state is derived from cookie presence, validated server-side on each protected route mount.

---

## 9. Smart Contract Integration

### 9.1 ABI & Functions

The `CertiChain` smart contract exposes the following functions:

**Write Functions (require wallet signing)**

| Function | Parameters | Who Can Call |
|----------|-----------|--------------|
| `addUniversityToWhitelist(name, email)` | string, string | Contract owner only |
| `registerUniversity(name, publicKey)` | string, string | Whitelisted university wallet |
| `issueCertificate(certificateId, certificateHash)` | string, string | Registered university wallet |
| `revokeCertificate(certificateId)` | string | Issuing university wallet |

**Read Functions (free, no signing)**

| Function | Returns | Description |
|----------|---------|-------------|
| `isUniversityWhitelisted(name)` | (bool, string) | Returns true + email if whitelisted |
| `universities(address)` | struct | Returns name, email, walletAddress, publicKey, isRegistered |
| `certificates(certificateId)` | struct | Returns certificateHash, isRevoked, universityAddress |
| `owner()` | address | Returns contract deployer address |

**Events emitted:**
- `UniversityRegistered(universityAddress, name)`
- `CertificateIssued(certificateId, universityAddress, certificateHash)`
- `CertificateRevoked(certificateId, universityAddress)`

---

### 9.2 Blockchain Network

- **Network:** MegaEth Testnet (EVM-compatible)
- **RPC URL:** `https://carrot.megaeth.com/rpc`
- **Provider usage:** 
  - Node.js backend: `ethers.JsonRpcProvider` (read-only) — a **new provider instance is created per request** for `/get-university-details` to prevent stale connections
  - Frontend: `ethers.BrowserProvider(window.ethereum)` for MetaMask-signed transactions

---

## 10. Database — Supabase

### Table: `universities`

```sql
CREATE TABLE universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  universityName TEXT NOT NULL,
  walletAddress TEXT NOT NULL,
  hashedPassword TEXT NOT NULL,
  active_session_id TEXT,              -- Stores current JTI for session revocation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now())
);

-- Indexed for O(1) login lookups
CREATE INDEX idx_universities_email ON universities (email);
```

### Key Database Operations

| Operation | Endpoint | Details |
|-----------|----------|---------|
| INSERT | `/finalize-registration` | Stores new university with bcrypt hashed password |
| SELECT | `/login`, `authenticateToken` | Fetches user by email (lowercase normalized) |
| UPDATE | `/login` | Sets `active_session_id` to new UUID (new session) |
| UPDATE | `/logout` | Sets `active_session_id` to NULL (invalidates session) |

**Password handling:** All passwords are hashed with `bcrypt.hash(password, 10)` (10 salt rounds) and compared with `bcrypt.compare()`. Plaintext passwords are never stored or logged.

**Email normalization:** All emails are stored and queried in lowercase (`email.toLowerCase()`) to prevent case-sensitivity login issues.

---

## 11. IPFS Storage — Pinata

CertiChain uses **Pinata Web3 SDK** (`pinata-web3`) for IPFS file pinning.

```javascript
// Upload flow in /upload-certificate
const blob = new Blob([fileBuffer]);
const fileToUpload = new File([blob], req.file.originalname, { type: "application/pdf" });
const result = await pinata.upload.file(fileToUpload).addMetadata({
    name: `Certificate_${req.file.originalname}_${Date.now()}`
});
// Returns result.IpfsHash (the CID)
```

The returned CID is embedded in:
- The QR code data string
- The JSON data file emailed to the student
- The certificate hash computation

**Retrieval during verification:** PDFs are downloaded via the public `dweb.link` IPFS gateway:
```
https://dweb.link/ipfs/{CID}
```

Configuration requires:
- `PINATA_JWT` — JWT from the Pinata dashboard
- `PINATA_GATEWAY` — Custom Pinata gateway domain (e.g., `copper-calm-weasel-387.mypinata.cloud`)

---

## 12. Security Architecture

This section documents every security measure implemented in the system.

### 12.1 Authentication & Session Management

**JWT + Stateful Session Revocation (Hybrid Model)**

The system uses JWTs stored in HttpOnly cookies combined with a database-backed session ID (`jti`) to achieve both stateless verification speed and stateful revocation capability.

```
LOGIN:
1. Generate UUID → sessionId
2. UPDATE universities SET active_session_id = sessionId WHERE email = ?
3. Sign JWT: { email, universityName, walletaddress, jti: sessionId }
4. Set cookie: universityAuthToken
   - httpOnly: true    → Cannot be read by JavaScript (XSS protection)
   - secure: true      → HTTPS only
   - sameSite: 'strict'→ Not sent on cross-site requests (CSRF protection)
   - maxAge: 3600000   → 1 hour (60 min)

EVERY AUTHENTICATED REQUEST:
1. Read cookie (not Authorization header — prevents token leakage in URLs)
2. jwt.verify() — validates signature and expiry
3. DB lookup: SELECT active_session_id FROM universities WHERE email = ?
4. Compare: token.jti === db.active_session_id
   └── If mismatch → reject with 401 (session was revoked or superseded)

LOGOUT:
1. UPDATE active_session_id = NULL (invalidates the current JTI)
2. res.clearCookie() (removes from browser)
```

**Why this matters:** A stolen JWT cookie is useless after logout because the DB invalidation check will reject it even if the token itself hasn't expired.

**Single-device sessions:** Each new login overwrites `active_session_id`, automatically invalidating any previous active session on other devices. The middleware returns `"Session expired or logged in elsewhere."` in this case.

---

### 12.2 PDF Digital Signature Verification

The Python microservice implements a multi-step cryptographic verification:

**1. Metadata Presence Check**
- PDF must contain `/Digital_Signature` metadata key
- Missing signature → immediate rejection

**2. Tamper Detection — Clean PDF Reconstruction**
```python
# 1. Strip ALL signature-related metadata keys from the PDF:
#    /Signed_By, /Signature_Date, /Key_Fingerprint, /Signature_Version,
#    /Original_Content_Hash, /Digital_Signature, /Signature_Algorithm,
#    /Key_Algorithm, /Key_Size, /Security_Level, /PDF_Original_Name, /Signing_Method
#
# 2. Rebuild the PDF from scratch using PyPDF2.PdfWriter:
#    - Copy all pages from original
#    - Re-attach only the remaining "clean" (non-signature) metadata
#    - Write to an in-memory BytesIO buffer
#
# 3. SHA-256 hash the reconstructed bytes
# 4. Compare with /Original_Content_Hash stored in the PDF metadata
#    Mismatch = PDF pages or non-signature metadata were modified after signing
```

The key insight: at signing time, the desktop app computes `SHA256(PDF_without_signature_metadata)` and stores it as `/Original_Content_Hash`. At verification time, the Python service reconstructs that exact same "clean" PDF — strip the identical set of metadata keys, re-add remaining metadata, rewrite all pages into a fresh BytesIO buffer, then hash. Any modification to PDF page content or non-signature metadata after signing produces a different hash and fails — even if an attacker leaves the signature metadata fields intact.

**3. Cryptographic Signature Verification**
```python
signed_data = {
    "content_hash": stored_content_hash,
    "signer": metadata['/Signed_By'],
    "timestamp": metadata['/Signature_Date'],
    "signature_version": metadata['/Signature_Version'],
    "key_algorithm": metadata['/Key_Algorithm'],
    "key_size": int(metadata['/Key_Size'])
}

original_message = json.dumps(signed_data, sort_keys=True).encode('utf-8')
public_key.verify(stored_signature, original_message, padding.PKCS1v15(), hashes.SHA256())
```

The `sort_keys=True` ensures deterministic JSON serialization regardless of insertion order. The signature covers the content hash + signer metadata, not just the file.

**4. Key Source: Blockchain**
The public key used for verification is fetched **directly from the blockchain** (not from user input or the PDF itself):
```javascript
const university = await contract.universities(walletaddress);
const publicKey = university.publicKey; // Fetched from smart contract
```
This prevents a man-in-the-middle attack where someone provides a matching key pair along with a forged PDF.

---

### 12.3 Cryptographic Certificate Hashing

The certificate hash binds all meaningful certificate data together:

```javascript
// Hash string construction (order is deterministic)
const stringToHash = 
  ipfsCid +          // Ties to the specific IPFS file
  studentName +      // Student identity
  universityname +   // Issuing institution
  courseName +       // Course
  issueDate +        // When issued
  walletaddress +    // Issuing wallet (on-chain identity)
  publicKey +        // Signing key (cryptographic identity)
  (grade || '');     // Academic result

const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
// Stored on blockchain as "0x" + hash
```

**Client-side reconstruction** (`src/lib/hash.ts`) uses the `js-sha256` library with the identical field order, allowing the frontend to independently verify without a server round-trip.

**Any modification to any field** (student name, grade, date, etc.) produces a completely different hash, which will not match the on-chain record, causing verification to fail.

---

### 12.4 Blockchain Tamper-Proofing

Once a certificate is issued, its hash is stored on the blockchain:
- **Immutable:** No one can modify the on-chain hash after recording
- **Transparent:** Anyone can query the blockchain to see the recorded hash
- **Revocation is explicit:** `isRevoked` flag must be set by a transaction — it can never be "un-revoked" or deleted

The `universityAddress` field on each certificate record enables the `/prepare-revoke` endpoint to enforce that only the original issuing university can revoke a certificate:
```javascript
if (onChainCertificate.universityAddress.toLowerCase() !== walletaddress.toLowerCase()) {
    return res.status(403).json({ message: "Unauthorized..." });
}
```

---

### 12.5 File Upload Security

**Two-phase upload with cryptographic linking:**

Phase 1 (`/verify-signature`):
```javascript
// After successful Python verification:
const fileBuffer = fs.readFileSync(pdfPath);
const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
verifiedFiles[fileHash] = {
    verifiedBy: walletaddress,  // Which university verified it
    timestamp: Date.now()
};
```

Phase 2 (`/upload-certificate`):
```javascript
// Check the file being uploaded is exactly the same file that was verified:
const currentFileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
const verificationRecord = verifiedFiles[currentFileHash];

if (!verificationRecord || verificationRecord.verifiedBy !== walletaddress) {
    return res.status(403).json({ message: 'Security Violation...' });
}
// One-time use: delete after upload
delete verifiedFiles[currentFileHash];
```

This ensures:
1. A university cannot upload a file that hasn't passed signature verification
2. University A cannot upload a file verified by University B
3. The same verified file cannot be uploaded multiple times (one-time use token pattern)

**Temp file cleanup:** All uploaded files (`multer` temp files, public key PEM files) are deleted using `fs.unlinkSync()` in both success and error paths, preventing disk accumulation or data leakage.

**Unique temp file names (Python):**
```python
temp_id = os.urandom(8).hex()
pdf_path = f'./temp_uploaded_{temp_id}.pdf'
public_key_path = f'./temp_pubkey_{temp_id}.pem'
```
Random hex names prevent file name collisions when multiple users submit simultaneously.

---

### 12.6 API Security

**Rate Limiting:**
- General: 500 requests/hour per IP across all endpoints
- Verification: 20 requests/15 minutes per IP on `/verify-certificate-from-qr`
- Login/Register: governed by generalLimiter

**CORS:**
```javascript
cors({
    origin: process.env.FRONTEND_URL,  // Only the configured frontend origin
    credentials: true                   // Required for cookie-based auth
})
```

**Cookie security attributes:**
```javascript
{
    httpOnly: true,    // No JS access → XSS mitigation
    secure: true,      // HTTPS only → prevents cleartext transmission
    sameSite: 'strict' // No cross-site sending → CSRF mitigation
}
```

**Input normalization:** All emails are lowercased before storage and lookup to prevent duplicate accounts and case-sensitivity attacks.

---

### 12.7 Authorization Guards

**Protected Route (frontend):**
The `ProtectedRoute` component calls the backend on every navigation to a protected page. It does not rely solely on a client-side flag or localStorage value.

**Wallet address authorization (backend):**
All authenticated operations that interact with the blockchain use the wallet address from `req.user` (database), NOT from client-sent request body. This prevents a university from acting on behalf of another wallet:
```javascript
const { walletaddress } = req.user; // From DB via JWT → not from req.body
```

**Revocation authorization:**
The `/prepare-revoke` endpoint enforces on-chain ownership:
```javascript
// Only the issuing university (stored on-chain) can revoke
if (onChainCertificate.universityAddress.toLowerCase() !== walletaddress.toLowerCase())
```

**Registration whitelist:**
Only universities that have been pre-approved by the blockchain admin (via `addUniversityToWhitelist`) can register. The email must also match the whitelisted email exactly:
```javascript
const [isWhitelisted, correctEmail] = await contract.isUniversityWhitelisted(universityName);
if (isWhitelisted && email.toLowerCase() === correctEmail.toLowerCase())
```

---

## 13. Environment Configuration

Copy `Backend/example.env` to `Backend/.env` and fill in all values:

```bash
# Server
PORT=3000
Backend_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key
SUPABASE_TABLE_NAME=universities

# JWT
JWT_SECRET=your_long_random_secret_key_here  # Min 32 chars recommended

# Python Flask
Python_Api_Url=http://localhost:5000
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=True

# Blockchain (MegaEth Testnet)
RPC_PROVIDER_URL=https://carrot.megaeth.com/rpc
CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Pinata (IPFS)
PINATA_JWT=your-pinata-jwt-token
PINATA_GATEWAY=your-gateway.mypinata.cloud

# Email (Ethereal for dev — get from https://ethereal.email/)
EMAIL_USER=your@ethereal.email
EMAIL_PASS=your-ethereal-password
```

**Frontend `.env`** (Vite — must be prefixed with `VITE_`):
```bash
VITE_BACKEND_URL=http://localhost:3000
VITE_RPC_URL=https://carrot.megaeth.com/rpc
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

---

## 14. Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- MetaMask browser extension
- Supabase account
- Pinata account
- Deployed CertiChain smart contract

### Backend (Node.js)

```bash
cd Backend
npm install
cp example.env .env
# Fill in .env values
node server.js
# Runs on http://localhost:3000 (or PORT env var)
```

### Backend (Python/Flask)

```bash
cd Backend
pip install flask PyPDF2 cryptography
python app.py
# Runs on http://localhost:5000 (or FLASK_PORT env var)
```

### Frontend

```bash
cd Frontend
npm install
# Create .env with VITE_ variables
npm run dev
# Runs on http://localhost:8080 (Vite default)
```

### Database Setup (Supabase)

Run the following SQL in your Supabase SQL editor:

```sql
CREATE TABLE universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  universityname TEXT NOT NULL,
  walletaddress TEXT NOT NULL,
  hashedpassword TEXT NOT NULL,
  active_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now())
);

CREATE INDEX idx_universities_email ON universities (email);
```

---

## 15. The Desktop PDF Signing Application

Before uploading certificates, universities must digitally sign PDFs using the **CertificateSigner** desktop app (`CertificateSignerSetup_v1.0.0.exe`), served from the `/public` directory of the frontend.

This application:
1. **Generates an RSA key pair** (private key + public key PEM file)
2. **Signs a PDF** by:
   - Computing SHA-256 hash of PDF content
   - Creating a signed data object (hash + signer info + timestamp + key metadata)
   - Signing with RSA PKCS1v15 + SHA-256 using the private key
   - Embedding the signature and metadata into the PDF's custom metadata fields
3. **Exports the public key** as a `.pem` file for upload during university registration

The university's public key is registered on the blockchain during account creation. This means the signing key is cryptographically tied to the university's blockchain identity.

**Required PDF metadata fields embedded by the signing app:**
- `/Digital_Signature` — hex-encoded RSA signature
- `/Original_Content_Hash` — SHA-256 of the clean PDF content
- `/Signed_By` — signer identifier
- `/Signature_Date` — ISO timestamp
- `/Signature_Version` — version string
- `/Key_Algorithm` — algorithm name (e.g., RSA)
- `/Key_Size` — key size in bits
- `/Key_Fingerprint`, `/Signature_Algorithm`, `/Security_Level`, `/PDF_Original_Name`, `/Signing_Method`

---

## 16. Data Flow Diagrams

### Certificate Issuance Data Flow

```
University (Dashboard)
    │
    ├─ Upload signed PDF
    │       │
    │       ▼
    │   POST /verify-signature
    │       │
    │       ├─ Fetch pubKey from blockchain ──► MegaEth RPC
    │       │
    │       └─ POST /verify-pdf (Python Flask)
    │               │
    │               ├─ Check PDF metadata for signature
    │               ├─ Reconstruct clean PDF, verify SHA-256 hash
    │               └─ Verify RSA signature with public key
    │
    ├─ POST /upload-certificate
    │       │
    │       ├─ Verify file hash matches verifiedFiles{}
    │       └─ pinata.upload.file() ──────────────────► Pinata IPFS
    │               │                                       │
    │               └─ Returns CID ◄──────────────────────┘
    │
    ├─ POST /prepare-certificate-hash
    │       │
    │       ├─ Compute SHA-256(CID+student+uni+course+date+wallet+key+grade)
    │       └─ Encode issueCertificate(id, hash) as unsigned tx
    │
    ├─ MetaMask signs & sends tx ────────────────────► MegaEth Blockchain
    │       │                                               │
    │       └─ Receipt + txHash ◄──────────────────────────┘
    │
    └─ POST /send-certificate-email ──────────────────► Student Email
            │
            └─ JSON attachment: {ipfsCid, studentName, ...}
```

### Certificate Verification Data Flow

```
Employer (Verify.tsx)
    │
    ├─ Certificate ID + JSON file
    │       │
    │       └─ Reconstruct pipe-delimited qrData string
    │
    └─ POST /verify-certificate-from-qr
            │
            ├─ 1. Reconstruct SHA-256 hash from qrData fields
            │
            ├─ 2. Query blockchain ──────────────────────► MegaEth RPC
            │       │                                         │
            │       └─ certificates(certId) ◄────────────────┘
            │               │
            │               ├─ Compare hash
            │               └─ Check isRevoked
            │
            ├─ 3. Download PDF ─────────────────────────► IPFS (dweb.link)
            │       │                                         │
            │       └─ PDF bytes ◄──────────────────────────┘
            │
            ├─ 4. POST /verify-pdf (Python Flask)
            │       │
            │       └─ Full signature verification
            │
            └─ Return: valid=true, certificateData{}
```

---

## 17. Error Handling

**Backend error patterns:**
- All endpoints are wrapped in try/catch
- JWT expiry in registration flow: cleans up pendingVerifications, returns 400
- Database errors: returns 500 with generic message (no raw DB errors exposed to client)
- Blockchain query failures: returns 500
- File system errors: temp files cleaned in both success and catch paths using `fs.existsSync()` guards before `fs.unlinkSync()`

**Frontend error patterns:**
- All axios calls are in try/catch blocks
- Error messages are extracted from `error.response?.data?.message` before falling back to `error.message`
- All errors are shown via the `toast()` notification system (never silent failures)
- MetaMask rejection (user cancels transaction) is caught and displayed
- The `ProtectedRoute` redirects silently to login on any auth error

**Python service error handling:**
- All exceptions are caught and returned as `(False, {'error': str(e)})`
- Metadata is included even in error responses for debugging
- Each verification step has explicit error returns with descriptive messages

---

## 18. Known Considerations & Limitations

1. **In-memory session stores:** `pendingVerifications{}` and `verifiedFiles{}` are stored in-memory in the Node.js process. These are lost on server restart. For production, these should be moved to Redis or Supabase with TTL.

2. **Single-server deployment:** The in-memory stores also mean the system won't work correctly behind a multi-instance load balancer without a shared store.

3. **Email service:** The system uses Ethereal (fake SMTP) for development. In production, replace with a real SMTP provider (SendGrid, SES, etc.) in the Nodemailer configuration.

4. **IPFS gateway:** Verification downloads PDFs via `dweb.link`, a public gateway. For production, the Pinata custom gateway (`PINATA_GATEWAY`) should be used for reliability.

5. **Wallet address casing:** Ethereum addresses are checksummed using `ethers.getAddress()` during registration. Comparisons use `.toLowerCase()` throughout for consistency.

6. **Grade as string/number:** Grade is passed as a number input (`type="number"`) but handled as a string in hashing. The `|| ''` fallback handles missing grades consistently.

7. **Session table column naming:** Supabase column names are lowercase by default (`universityname`, `walletaddress`, `hashedpassword`) — the code uses these lowercase names consistently.

---

*CertiChain — Built with blockchain security, cryptographic integrity, and multi-layer verification to make educational fraud impossible.*
