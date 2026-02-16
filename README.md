# CertiChain — Blockchain Certificate Issuance & Verification System

A full-stack, tamper-proof academic certificate platform combining an **offline Python desktop app** (Certificate Signer) with a **blockchain-powered web platform** (CertiChain) to issue, store, and verify digital certificates end-to-end.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Project Structure](#project-structure)
4. [Repository 1 — Certificate Signer (Python Desktop App)](#repository-1--certificate-signer-python-desktop-app)
   - [Purpose](#purpose)
   - [Key Modules](#key-modules)
   - [How It Works](#how-it-works)
   - [Security Model](#security-model)
   - [Installation & Setup](#installation--setup)
   - [Building the Executable](#building-the-executable)
5. [Repository 2 — CertiChain Web Platform](#repository-2--certichain-web-platform)
   - [Frontend (React/TypeScript)](#frontend-reacttypescript)
   - [Backend (Node.js/Express)](#backend-nodejsexpress)
   - [Python Verification Service (Flask)](#python-verification-service-flask)
   - [Smart Contract (Solidity)](#smart-contract-solidity)
6. [End-to-End Workflow](#end-to-end-workflow)
7. [Environment Configuration](#environment-configuration)
8. [API Reference](#api-reference)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)
11. [Tech Stack Summary](#tech-stack-summary)

---

## System Overview

CertiChain solves the problem of fraudulent academic credentials by combining two tightly-coupled systems:

| Component | Technology | Purpose |
|---|---|---|
| **Certificate Signer** | Python, PyQt5, cryptography | Offline key generation & PDF signing |
| **CertiChain Frontend** | React, TypeScript, Vite | University portal + employer verification UI |
| **CertiChain Backend** | Node.js, Express, Ethers.js | JWT auth, blockchain interaction, email, IPFS |
| **Verification Service** | Python, Flask, PyPDF2 | PDF digital signature verification |
| **Smart Contract** | Solidity (EVM-compatible) | On-chain certificate registry with revocation |
| **Storage** | IPFS (via Pinata) | Decentralized PDF hosting |
| **Blockchain** | MegaEth Testnet | Immutable certificate record |

The **Certificate Signer** desktop app runs entirely offline. It generates an RSA/ECDSA key pair for the university, stores the private key encrypted on a USB drive, and uses it to digitally sign certificate PDFs. The resulting signed PDF and the university's public key are then used by the **CertiChain web platform** to issue, store, and verify certificates publicly on the blockchain.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OFFLINE (University IT Dept.)                    │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │           Certificate Signer (PyQt5 Desktop App)             │   │
│   │                                                               │   │
│   │   ┌─────────────┐    ┌─────────────┐    ┌───────────────┐   │   │
│   │   │ KeyGenerator │───▶│ KeyManager  │───▶│  PDFHandler   │   │   │
│   │   │(RSA/ECDSA)  │    │(USB Storage)│    │(Sign PDF)     │   │   │
│   │   └─────────────┘    └─────────────┘    └───────────────┘   │   │
│   │                              │                   │            │   │
│   │                         private_key.pem    signed_cert.pdf   │   │
│   │                         (on USB drive)                        │   │
│   └──────────────────────────────┬────────────────────┬──────────┘   │
│                                  │                    │               │
└──────────────────────────────────┼────────────────────┼───────────────┘
                                   │                    │
               public_key.pem ─────┘          signed PDF ──────────┐
               (for web registration)                               │
                                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ONLINE (CertiChain Platform)                    │
│                                                                       │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐ │
│  │   React UI   │◀──▶│  Node.js Backend │◀──▶│  Flask PDF Service │ │
│  │  (Vite/TS)   │    │  (Express/JWT)   │    │  (PyPDF2/crypto)   │ │
│  └──────────────┘    └──────────────────┘    └────────────────────┘ │
│                               │  │                                    │
│                        ┌──────┘  └──────┐                            │
│                        ▼                ▼                             │
│               ┌──────────────┐  ┌──────────────┐                    │
│               │  Blockchain  │  │     IPFS      │                    │
│               │ (MegaEth)    │  │   (Pinata)    │                    │
│               │ Smart Contract│  │  PDF Storage  │                    │
│               └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
/
├── crypto/                         # Certificate Signer — cryptography layer
│   ├── __init__.py
│   ├── key_generator.py            # RSA/ECDSA key pair generation
│   └── key_manager.py             # Key storage, loading, USB management
│
├── pdf/                            # Certificate Signer — PDF layer
│   ├── __init__.py
│   └── pdf_handler.py             # PDF reading, signing, embedded signature
│
├── usb/                            # Certificate Signer — USB detection
│   ├── __init__.py
│   └── detector.py                # Cross-platform removable drive detection
│
├── utils/                          # Certificate Signer — utilities
│   ├── __init__.py
│   ├── config.py                  # JSON-backed application settings
│   ├── logger.py                  # File + console logging
│   └── security.py               # Password validation, secure delete, PBKDF2
│
├── backend/                        # CertiChain web backend
│   ├── app.py                     # Flask PDF verification microservice
│   ├── pdf_handler.py             # Flask-specific PDF signature verification
│   ├── server.js                  # Express.js main API server
│   ├── checkCertificate.js        # Standalone blockchain certificate lookup
│   └── example.env                # Environment variable template
│
└── src/                            # CertiChain React frontend
    ├── components/
    │   └── UniversitySidebar.tsx  # Collapsible sidebar nav
    ├── pages/
    │   ├── employer/
    │   │   ├── Verify.tsx         # Employer certificate verification page
    │   │   └── Result.tsx         # Verification result display
    │   └── university/
    │       ├── Dashboard.tsx      # Certificate issuance workflow
    │       ├── Certificates.tsx   # Batch certificate verification
    │       ├── Revoke.tsx         # Certificate revocation
    │       └── Register.tsx       # University registration
    ├── types/
    │   └── certificate.ts         # TypeScript type definitions
    └── abis/
        └── CertiChain.json        # Compiled smart contract ABI
```

---

## Repository 1 — Certificate Signer (Python Desktop App)

### Purpose

The Certificate Signer is a **standalone, offline PyQt5 desktop application** distributed as a single executable (built with PyInstaller). It runs with no internet connection required. Its sole purpose is to:

1. Generate a cryptographic key pair (RSA or ECDSA) for a university
2. Store the encrypted private key securely on a USB drive
3. Load the private key (with password) to sign certificate PDFs
4. Produce signed PDFs with embedded digital signatures and tamper-detection hashes

### Key Modules

#### `crypto/key_generator.py` — `KeyGenerator`

This is the core cryptography engine. It handles:

**Key Generation (`generate_key_pair`)**

Supports four algorithm presets:

| Preset | Type | Key Size / Curve |
|---|---|---|
| `RSA-2048` | RSA | 2048-bit (recommended) |
| `RSA-4096` | RSA | 4096-bit (high security) |
| `ECDSA-P256` | ECDSA | NIST P-256 (secp256r1) |
| `ECDSA-P384` | ECDSA | NIST P-384 (secp384r1) |

After generating, the private key is encrypted using `BestAvailableEncryption` (AES-256 via PKCS8) with the user's password and serialized to PEM format. An immediate encrypt/decrypt roundtrip test is performed to confirm correctness before any file is written.

**Key Verification (`verify_key_pair`)**

A five-step cryptographic proof that the private and public keys are a matching pair:
1. Decrypt the encrypted private key using the password
2. Extract the embedded public key from the decrypted private key
3. Load the separately stored public key PEM file
4. Compare RSA public numbers (`n` and `e`) between both public keys
5. Perform a live sign/verify cycle with a random test message (PKCS1v15 + SHA-256)

If all five steps pass, the key pair is confirmed mathematically valid.

**Fingerprint Generation (`_generate_key_fingerprint`)**

Generates a short colon-separated SHA-256 fingerprint of the public key (e.g., `ab:cd:ef:...`) to allow visual key identification without exposing the key itself.

#### `crypto/key_manager.py` — `KeyManager`

Handles the lifecycle of keys after generation:

**USB Storage (`save_key_pair_to_usb`)**

Saves the key pair to a structured folder on a USB drive:
```
{USB_PATH}/{UNIVERSITY_NAME_UPPERCASE}/
├── private_key.pem    # AES-256 password-encrypted private key
├── public_key.pem     # Plain public key (for web registration)
├── key_info.json      # Algorithm, fingerprint, timestamp metadata
└── README.txt         # Human-readable instructions and warnings
```

**Local Storage (`save_key_pair_to_local`)**

An alternative to USB storage with strongly worded security warnings in the README about the risks of storing private keys on-disk (susceptibility to malware, no hardware isolation). Automatically creates timestamped backups of existing keys before overwriting.

**Key Loading (`load_key_pair_from_usb`)**

Loads and decrypts keys from storage. Performs full `verify_key_pair` verification before accepting the key into memory. The decrypted private key object is held in-memory in `self.current_private_key` and is never written back to disk in plaintext.

**Session Management**

Uses a `SecureTimer` (from `utils/security.py`) with a configurable timeout (default: 10 minutes). After timeout, `is_key_loaded()` returns `False` and `get_private_key()` returns `None`, forcing re-authentication.

#### `pdf/pdf_handler.py` — `PDFHandler`

Handles all PDF operations:

**Signing Flow (`save_signed_pdf`)**

1. Reads the original PDF using PyPDF2
2. Copies all pages and existing metadata to a new writer
3. Computes a SHA-256 hash of the normalized (metadata-stripped) PDF content
4. Constructs a `signed_data` dictionary containing: content hash, signer name, timestamp, signature version, key algorithm, and key size
5. Signs the JSON-serialized `signed_data` dict (sorted keys) using the private key (PKCS1v15 + SHA-256)
6. Embeds the hex-encoded signature and all metadata into the PDF's XMP metadata fields under custom keys (e.g., `/Digital_Signature`, `/Signed_By`, `/Original_Content_Hash`, etc.)
7. Writes the signed PDF as `{original_name}_signed.pdf`

The custom metadata keys embedded into every signed PDF are:

| Key | Content |
|---|---|
| `/Signed_By` | University name |
| `/Signature_Date` | ISO 8601 timestamp |
| `/Key_Fingerprint` | Short SHA-256 fingerprint |
| `/Signature_Version` | `2.4` |
| `/Original_Content_Hash` | SHA-256 of normalized PDF bytes |
| `/Digital_Signature` | Hex-encoded RSA signature |
| `/Key_Algorithm` | e.g., `RSA-2048` |
| `/Key_Size` | e.g., `2048` |
| `/PDF_Original_Name` | Original filename |

**Verification Flow (`verify_pdf_signature`)**

1. Loads the public key PEM file
2. Opens the signed PDF and reads embedded metadata
3. Detects the presence of `/Digital_Signature`; returns error if absent
4. **Tamper detection**: Reconstructs the normalized PDF (stripping all signature metadata keys) and recomputes its SHA-256. Compares against `/Original_Content_Hash`. Any change to the PDF content after signing will produce a mismatch and immediately fail with `"PDF TAMPERING DETECTED"`
5. Reconstructs the `signed_data` dict from metadata and verifies the stored signature against it using the public key
6. Returns a result dict with `valid`, `signer`, `timestamp`, `key_fingerprint`, and `tamper_proof`

#### `usb/detector.py` — `USBDriveDetector`

Cross-platform USB detection using `psutil`:

- **Windows**: Uses `win32file.GetDriveType()` to detect `DRIVE_REMOVABLE (type=2)`. Falls back to filesystem type and drive letter heuristics if `pywin32` is unavailable
- **Linux**: Reads `/sys/block/{device}/removable` sysfs flag
- **macOS**: Checks if mountpoint starts with `/Volumes/`

Also provides: writability check, available space query, and pre-built local storage fallback paths (Desktop, Documents, project folder) for when no USB is present.

#### `utils/security.py` — `SecurityUtils` + `SecureTimer`

**Password Validation**: Enforces minimum 12 characters, uppercase, lowercase, digits, special characters, and rejects repeated character patterns.

**Secure File Deletion**: Multi-pass overwrite with `os.urandom` (configurable, default 3 passes) followed by `os.remove`. Includes a prominent warning in the docstring that this is ineffective on SSDs due to wear-leveling — recommends encrypted volumes instead.

**Memory Clearing**: Overwrites `bytearray` objects with random bits using `secrets.randbits`.

**SecureTimer**: Tracks elapsed time since `start()`. `is_expired()` computes `time.time() - start_time > timeout_seconds`. `remaining_time()` returns integer seconds left.

### How It Works

```
University IT Admin launches Certificate Signer .exe
             │
             ▼
    ┌─────────────────┐
    │  Insert USB     │  ◀── USBDriveDetector scans for removable drives
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Generate Keys   │  ◀── KeyGenerator.generate_key_pair(algorithm, password, name)
    │                 │       - Generates RSA/ECDSA key pair
    │                 │       - Encrypts private key with user password (AES-256/PKCS8)
    │                 │       - Immediately tests encrypt/decrypt roundtrip
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Save to USB     │  ◀── KeyManager.save_key_pair_to_usb()
    │                 │       - private_key.pem (encrypted)
    │                 │       - public_key.pem (plaintext, for web)
    │                 │       - key_info.json (metadata)
    └────────┬────────┘
             │
    [Later, when signing a certificate PDF]
             │
             ▼
    ┌─────────────────┐
    │ Load Keys       │  ◀── KeyManager.load_key_pair_from_usb(password)
    │                 │       - Decrypts private key
    │                 │       - Verifies key pair (5-step cryptographic proof)
    │                 │       - Starts 10-min session timer
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Sign PDF        │  ◀── PDFHandler.save_signed_pdf()
    │                 │       - Hash PDF content (SHA-256)
    │                 │       - Sign hash + metadata (PKCS1v15 + SHA-256)
    │                 │       - Embed signature in PDF metadata
    └────────┬────────┘
             │
             ▼
    Upload signed PDF and public_key.pem to CertiChain web platform
```

### Security Model

The offline nature of the Certificate Signer provides a critical security guarantee: **the private key never touches an internet-connected system**. The security chain is:

1. Private key exists only on the USB drive, encrypted with the admin's password
2. In-memory decrypted key is cleared after a 10-minute session timeout
3. Signed PDFs are tamper-evident — any byte change after signing is detected
4. Password strength is enforced programmatically (12+ chars, mixed complexity)
5. The public key uploaded to the blockchain is mathematically paired to the private key, enabling third-party verification without ever exposing the private key

### Installation & Setup

**Prerequisites**

```bash
pip install cryptography PyPDF2 psutil pywin32  # Windows only for pywin32
# For the GUI (not shown in provided modules):
pip install PyQt5
```

**Running from source**

```bash
python crypto/key_generator.py   # Run key generation test
python usb/detector.py           # Run USB detection test
```

### Building the Executable

```bash
pip install pyinstaller
pyinstaller --onefile --windowed main.py
# Output: dist/CertificateSigner.exe (Windows)
# Output: dist/CertificateSigner.app (macOS)
```

The `--onefile` flag bundles all Python dependencies into a single executable. `--windowed` suppresses the console window on Windows.

---

## Repository 2 — CertiChain Web Platform

### Frontend (React/TypeScript)

Built with Vite, React, TypeScript, TailwindCSS, and shadcn/ui components. Uses Ethers.js v6 for MetaMask wallet interaction.

#### Pages

**`/university/register` — `Register.tsx`**

Three-field registration form: university name, official email, wallet address (manual or MetaMask connect), and a public key `.pem` file upload. On submit, calls `POST /register` on the backend. The backend cross-references the university name and email against the smart contract whitelist before sending a verification email. On success, shows an instruction screen pointing the user to the backend terminal for the Ethereal email preview link.

**`/university/dashboard` — `Dashboard.tsx`**

The main certificate issuance workflow with a 4-step progress indicator:

| Step | Label | Action |
|---|---|---|
| 1 | Verifying Signature | `POST /verify-signature` — Flask service checks PDF was signed by this university's private key |
| 2 | Uploading to IPFS | `POST /upload-certificate` — Pins PDF to IPFS via Pinata |
| 3 | Creating Hash | `POST /prepare-certificate-hash` — Backend builds certificate hash and unsigned blockchain transaction |
| 4 | Confirm in Wallet | MetaMask prompt — User signs and broadcasts the transaction |

On success, displays a QR code containing the pipe-delimited verification URL and the blockchain transaction hash. A "Send to Student" button calls `POST /send-certificate-email` to deliver the certificate ID and data JSON to the student via email.

**`/university/certificates` — `Certificates.tsx`**

Bulk certificate verification via JSON file upload. Accepts multiple `.json` files simultaneously. For each file, reconstructs the QR data string (same pipe-delimited format used during issuance) and calls `POST /verify-certificate-from-qr`. Displays results in a table with per-certificate verification badges (Valid / Invalid).

**`/university/revoke` — `Revoke.tsx`**

Two-phase revocation: first verifies the certificate by reconstructing and comparing the hash on-chain, then (after user confirms displayed details) calls `contract.revokeCertificate(certificateId)` directly via MetaMask. Checks for already-revoked status and non-existent IDs before allowing revocation.

**`/verify` — `Verify.tsx`** (Employer Portal)

Accepts a Certificate ID (text input) and a `.json` data file. Reconstructs the pipe-delimited QR string and navigates to `/verify/result?qrData=...` without making any server calls — the result page handles all verification logic.

**`/verify/result` — `Result.tsx`**

Reads `qrData` from the URL query string and calls `POST /verify-certificate-from-qr`. Displays a status card (Pending / Valid / Invalid) with full certificate details, blockchain proof section showing wallet address and digital signature, and a link to open the PDF from IPFS if valid.

#### `UniversitySidebar.tsx`

Collapsible icon-only sidebar (16px wide at rest, 256px on hover) with smooth CSS transitions. Active route highlighted with primary background color. Logout handler clears `universityAuth` from `localStorage` and redirects to login.

### Backend (Node.js/Express)

#### Authentication Flow

Registration uses a **3-step JWT challenge**:

1. **`POST /register`** — Validates university whitelist on-chain, creates a short-lived JWT (1 hour), stores the registration payload in an in-memory `pendingVerifications` map keyed by the token, and sends a verification email containing a link with the token
2. **`POST /prepare-registration`** — Client (from the email link) calls this with the token and their wallet address. Verifies the JWT, retrieves the pending registration data, and returns an unsigned `registerUniversity` contract transaction for MetaMask to sign
3. **`POST /finalize-registration`** — Client calls this after broadcasting the transaction, providing the token, chosen password, and tx hash. Verifies JWT again, hashes the password with bcrypt, creates the user in the in-memory users array, and deletes the token from `pendingVerifications`

Login issues a session JWT containing `email`, `universityName`, and `walletAddress`, valid for 1 hour.

All protected endpoints use the `authenticateToken` middleware which validates the Bearer JWT.

#### Key Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | None | Initiate university registration |
| `POST` | `/prepare-registration` | Token | Build unsigned registration tx |
| `POST` | `/finalize-registration` | Token | Create user account |
| `POST` | `/login` | None | Get session JWT |
| `GET` | `/get-university-details` | JWT | Fetch university name + public key from chain |
| `POST` | `/verify-signature` | JWT | Verify PDF was signed by this university |
| `POST` | `/upload-certificate` | JWT | Pin PDF to IPFS via Pinata |
| `POST` | `/prepare-certificate-hash` | JWT | Compute cert hash + build issueCertificate tx |
| `POST` | `/send-certificate-email` | JWT | Email certificate data JSON to student |
| `POST` | `/verify-certificate-from-qr` | None | Full 3-layer verification (blockchain + IPFS + PDF signature) |

#### Certificate Hash Construction

The certificate hash is a SHA-256 of a deterministic concatenation of fields (order is critical for reproducibility):

```javascript
const stringToHash = `${ipfsCid}${studentName}${universityName}${courseName}${issueDate}${walletAddress}${publicKey}${grade}`;
const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
```

This exact string must be reconstructed identically on the verification side (in `Verify.tsx`, `Revoke.tsx`, and `Certificates.tsx`) for the hash comparison to succeed.

#### Full Verification Flow (`POST /verify-certificate-from-qr`)

The most complex endpoint, performing three independent verification layers:

**Layer 1 — Blockchain Hash Verification**
Reconstructs the certificate hash from QR data fields, then calls `contract.certificates(certificateId)` to retrieve the on-chain hash. Compares them. If they differ, the certificate is not authentic. Also checks `isRevoked`.

**Layer 2 — PDF Signature Verification**
Downloads the PDF from IPFS via the `dweb.link` gateway, writes it and the stored public key to temporary files, and forwards both to the Flask Python service at `http://localhost:5000/verify-pdf`. The Flask service performs the cryptographic signature check.

**Layer 3 — Tamper Detection**
Handled inside the Flask service: reconstructs the normalized PDF (stripping signature metadata) and recomputes the SHA-256. Compares against the hash embedded in the PDF metadata at signing time.

All temporary files are cleaned up after verification regardless of outcome.

### Python Verification Service (Flask)

Located at `backend/app.py` and `backend/pdf_handler.py`. A minimal Flask microservice wrapping the PDF verification logic from the Certificate Signer's `PDFHandler`.

**`POST /verify-pdf`**

Accepts multipart form with `pdf` (the PDF file) and `public_key` (the PEM public key file). Returns a flat JSON response:

```json
// Success
{ "valid": true, "signer": "University Name", "timestamp": "2025-01-01T...", "tamper_proof": true }

// Failure
{ "valid": false, "message": "Verification failed", "error_details": { "error": "...", "metadata": {} } }
```

Uses unique 8-byte hex temp file names (`temp_uploaded_{hex}.pdf`) to avoid conflicts from concurrent requests.

### Smart Contract (Solidity)

The contract is deployed on MegaEth Testnet. Its ABI is embedded in both `backend/server.js` and `backend/checkCertificate.js`.

**Data Structures**

```solidity
struct University {
    string name;
    string email;
    address walletAddress;
    string publicKey;    // Stores PEM public key on-chain
    bool isRegistered;
}

struct Certificate {
    string certificateHash;  // SHA-256 hash of certificate data
    bool isRevoked;
    address universityAddress;
}
```

**Key Functions**

| Function | Access | Description |
|---|---|---|
| `addUniversityToWhitelist(name, email)` | Owner only | Pre-approve a university by name + email |
| `registerUniversity(name, publicKey)` | Whitelisted | Register and store public key on-chain |
| `issueCertificate(id, hash)` | Registered | Record certificate hash on-chain |
| `revokeCertificate(id)` | Registered (issuer) | Mark certificate as revoked |
| `isUniversityWhitelisted(name)` | Public view | Returns (bool, email) |
| `universities(address)` | Public view | Returns full University struct |
| `certificates(id)` | Public view | Returns (hash, isRevoked, universityAddress) |

**Events**

- `UniversityRegistered(address indexed, string name)`
- `CertificateIssued(string indexed certificateId, address indexed universityAddress, string certificateHash)`
- `CertificateRevoked(string indexed certificateId, address indexed universityAddress)`

---

## End-to-End Workflow

```
PHASE 1: SETUP (One time, per university)
─────────────────────────────────────────
1. Admin runs CertificateSigner.exe offline
2. Inserts USB drive
3. Generates RSA-2048 key pair with strong password
4. private_key.pem saved encrypted on USB
5. public_key.pem saved on USB (copy for web)
6. Admin goes to certichain.com/university/register
7. Uploads public_key.pem, connects MetaMask, submits
8. Backend checks whitelist on-chain, sends verification email
9. Admin clicks email link → MetaMask prompts registerUniversity() tx
10. University name + public key stored on MegaEth blockchain

PHASE 2: CERTIFICATE ISSUANCE (Per certificate)
─────────────────────────────────────────────────
1. University creates certificate PDF (word processor, LaTeX, etc.)
2. Admin opens CertificateSigner.exe, inserts USB
3. Admin enters password → private key decrypted, session started
4. Admin selects PDF → PDFHandler signs it with private key
5. Signed PDF with embedded signature saved as {name}_signed.pdf
6. Admin logs into certichain.com/university/dashboard
7. Fills in: student name, email, course, grade, issue date
8. Uploads signed PDF
   ├── Backend verifies PDF signature matches this university's public key
   ├── PDF pinned to IPFS → gets CID
   ├── Backend computes SHA-256 of (CID + student data + public key)
   └── Backend returns unsigned issueCertificate(id, hash) transaction
9. MetaMask signs and broadcasts transaction → Certificate ID recorded on chain
10. Backend sends student email with:
    ├── Certificate ID (e.g., CERT-1759776463379)
    └── {CERT-ID}.json attachment (contains all certificate fields)

PHASE 3: VERIFICATION (By employer / anyone)
────────────────────────────────────────────
1. Student provides employer with: Certificate ID + .json file
2. Employer opens certichain.com (public, no login)
3. Enters Certificate ID, uploads .json file, clicks Verify
4. Frontend reconstructs pipe-delimited QR data string
5. Backend calls verify-certificate-from-qr:
   ├── Layer 1: Reconstructs hash from JSON, compares with on-chain hash ✓
   ├── Layer 1: Checks isRevoked flag on-chain ✓
   ├── Layer 2: Downloads PDF from IPFS
   ├── Layer 2: Calls Flask service to verify PDF digital signature ✓
   └── Layer 3: Flask checks PDF content hash (tamper detection) ✓
6. Result page shows: Valid/Invalid, full certificate details,
   blockchain proof, link to open PDF from IPFS
```

---

## Environment Configuration

Copy `backend/example.env` to `backend/.env` and fill in:

```env
# Server
PORT=3000

# MegaEth Testnet
RPC_PROVIDER_URL=https://carrot.megaeth.com/rpc
CONTRACT_ADDRESS=0x...           # Your deployed CertiChain contract address

# JWT
JWT_SECRET=your_random_secret_here_at_least_32_chars

# Email (Ethereal - get from https://ethereal.email/)
EMAIL_USER=your.ethereal@user.com
EMAIL_PASS=your_ethereal_password

# IPFS (Pinata - get from https://app.pinata.cloud/)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Python microservice
PYTHON_API_URL=http://localhost:5000
```

**Frontend environment** (`src/.env`):

```env
VITE_CONTRACT_ADDRESS=0x...    # Same contract address as backend
```

---

## API Reference

### `POST /verify-certificate-from-qr`

The primary public verification endpoint. No authentication required.

**Request:**
```json
{ "qrData": "CID|studentName|universityName|courseName|issueDate|walletAddress|publicKey|certId|grade" }
```

**Success Response (200):**
```json
{
  "valid": true,
  "message": "Certificate verified successfully.",
  "certificateData": {
    "id": "CERT-1759776463379",
    "studentName": "Jane Smith",
    "courseName": "Computer Science",
    "issueDate": "2025-01-15",
    "universityName": "IIT Delhi",
    "walletAddress": "0x1234...",
    "signature": "IIT Delhi",
    "grade": "9.5",
    "ipfsCid": "bafybeig..."
  }
}
```

**Failure Responses:**
```json
{ "valid": false, "message": "Hash mismatch. Certificate is not authentic." }
{ "valid": false, "message": "Certificate has been revoked." }
{ "valid": false, "message": "PDF signature verification failed." }
```

### `POST /prepare-certificate-hash`

**Request (JWT required):**
```json
{
  "ipfsCid": "bafybeig...",
  "studentName": "Jane Smith",
  "studentEmail": "jane@example.com",
  "courseName": "Computer Science",
  "issueDate": "2025-01-15",
  "grade": "9.5"
}
```

**Response:**
```json
{
  "unsignedTx": { "to": "0x...", "data": "0x...", "from": "0x..." },
  "certificateId": "CERT-1759776463379",
  "certificateHash": "0xabc123...",
  "certificateDataForJson": { ... }
}
```

---

## Security Considerations

**Private Key Security**
The private key is never transmitted over any network. It is generated offline, stored encrypted on USB hardware, and only decrypted into memory within the Certificate Signer application. The session auto-clears after 10 minutes.

**Password Security**
Passwords are validated to enforce complexity. Private keys are encrypted with PKCS8 + AES-256 (`BestAvailableEncryption`). Passwords on the web platform are hashed with bcrypt (10 salt rounds) before being stored.

**Tamper Detection**
Every signed PDF embeds a SHA-256 hash of its content at signing time. On verification, the PDF is reconstructed identically (stripping all signature metadata) and re-hashed. Any modification to the PDF — even a single byte — produces a different hash and triggers `"PDF TAMPERING DETECTED"`.

**Blockchain Immutability**
Certificate hashes recorded on-chain cannot be altered. Even if a signed PDF is somehow modified (which would fail signature verification anyway), the on-chain hash provides a second independent proof of authenticity.

**Secure Deletion (Caveat)**
The `secure_delete_file` utility overwrites files multiple times before deletion. This is effective on HDDs but NOT guaranteed on SSDs due to wear-leveling. For SSD environments, use encrypted volumes (BitLocker, VeraCrypt, FileVault) so key deletion renders data unrecoverable.

**JWT Token Management**
Registration tokens expire in 1 hour and are deleted from `pendingVerifications` immediately after `finalize-registration` succeeds, preventing replay attacks. Note that the current implementation uses an in-memory store — these tokens do not survive server restarts.

**In-Memory User Store (Development Note)**
The current backend uses an in-memory `users` array. This means all user accounts are lost on server restart. For production, this must be replaced with a persistent database (PostgreSQL, MongoDB, etc.).

---

## Troubleshooting

**"Key pair verification failed — keys may be corrupted or password is incorrect"**
This means the password entered during key loading does not match the password used during key generation. The private key PEM file and password must come from the same generation session. Use the `debug_verification_steps()` method for detailed diagnosis.

**"No embedded digital signature found"**
The uploaded PDF was not signed by the Certificate Signer desktop app. Only PDFs processed through the desktop application will contain the required `/Digital_Signature` metadata key.

**"PDF TAMPERING DETECTED"**
The PDF content was modified after signing. Even re-saving or compressing the file in another PDF tool will change the byte structure and fail this check. Always use the original `_signed.pdf` output from the Certificate Signer app.

**"Hash mismatch. The JSON file does not correspond to the Certificate ID"**
The `.json` file provided does not match the Certificate ID entered. This could mean the wrong file was uploaded, the JSON was modified, or the certificate ID is incorrect.

**USB drive not detected**
On Windows without `pywin32`, the detector falls back to filesystem-type heuristics. Drive C: is always excluded. Ensure the USB is formatted as FAT32, exFAT, or NTFS.

**MetaMask transaction fails**
Ensure the university wallet is connected to MegaEth Testnet (Chain ID: check MegaEth docs) and has sufficient test ETH for gas fees.

**"Could not connect to the blockchain"**
Verify `RPC_PROVIDER_URL` in your `.env` is set to `https://carrot.megaeth.com/rpc` and that the MegaEth testnet is reachable.

---

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Desktop GUI | PyQt5 | 5.x |
| Desktop Crypto | Python `cryptography` | 42.x |
| Desktop PDF | PyPDF2 | 3.x |
| Desktop Executable | PyInstaller | 6.x |
| Frontend Framework | React + Vite | 18.x / 5.x |
| Frontend Language | TypeScript | 5.x |
| Frontend Styling | TailwindCSS + shadcn/ui | 3.x |
| Blockchain SDK | Ethers.js | v6 |
| QR Code | qrcode.react | latest |
| Backend Runtime | Node.js | 20.x |
| Backend Framework | Express.js | 4.x |
| Auth | JWT (jsonwebtoken) + bcrypt | — |
| Email | Nodemailer (Ethereal) | 6.x |
| IPFS Client | @pinata/sdk | latest |
| Flask Service | Flask + PyPDF2 + cryptography | — |
| Smart Contract | Solidity | 0.8.x |
| Blockchain | MegaEth Testnet (EVM) | — |
| File Upload | Multer | 1.x |
| HTTP Client | Axios | 1.x |
