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
- Tracks issuance step: idle → verifying → uploading → hashing → signing → co
