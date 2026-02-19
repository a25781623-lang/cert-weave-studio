# CertiChain — Blockchain Certificate Issuance & Verification System

> A full-stack, tamper-proof academic credential platform combining an **offline Python desktop signing app** with a **blockchain-powered web platform** to issue, store, and cryptographically verify digital certificates end-to-end.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Project Structure](#3-project-structure)
4. [Tech Stack Summary](#4-tech-stack-summary)
5. [Component 1 — Certificate Signer (Python Desktop App)](#5-component-1--certificate-signer-python-desktop-app)
   - [Purpose & Security Philosophy](#51-purpose--security-philosophy)
   - [Key Module: KeyGenerator](#52-key-module-keygenerator)
   - [Key Module: KeyManager](#53-key-module-keymanager)
   - [Key Module: PDFHandler (Desktop)](#54-key-module-pdfhandler-desktop)
   - [Key Module: USBDriveDetector](#55-key-module-usbdrivedetector)
   - [Key Module: SecurityUtils & SecureTimer](#56-key-module-securityutils--securetimer)
   - [Desktop App Workflow](#57-desktop-app-workflow)
   - [Building the Executable](#58-building-the-executable)
6. [Component 2 — CertiChain Web Platform](#6-component-2--certichain-web-platform)
   - [Frontend (React/TypeScript/Vite)](#61-frontend-reacttypescriptvite)
   - [Backend (Node.js/Express)](#62-backend-nodejsexpress)
   - [Python Verification Service (Flask)](#63-python-verification-service-flask)
   - [Smart Contract (Solidity)](#64-smart-contract-solidity)
7. [End-to-End Workflow](#7-end-to-end-workflow)
8. [API Reference](#8-api-reference)
9. [Security Architecture](#9-security-architecture)
   - [Private Key Security (Air-Gap Model)](#91-private-key-security-air-gap-model)
   - [PDF Signing & Tamper Detection](#92-pdf-signing--tamper-detection)
   - [Blockchain Immutability](#93-blockchain-immutability)
   - [Authentication & Session Security](#94-authentication--session-security)
   - [Certificate Hash Integrity](#95-certificate-hash-integrity)
   - [Upload Security (Two-Phase Verification)](#96-upload-security-two-phase-verification)
   - [Three-Layer Verification Model](#97-three-layer-verification-model)
   - [Rate Limiting](#98-rate-limiting)
   - [CORS & Cookie Security](#99-cors--cookie-security)
   - [Revocation Authorization Guard](#910-revocation-authorization-guard)
10. [Environment Configuration](#10-environment-configuration)
11. [Installation & Setup](#11-installation--setup)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. System Overview

CertiChain solves the problem of fraudulent academic credentials by layering multiple independent security mechanisms:

| Component | Technology | Purpose |
|---|---|---|
| **Certificate Signer** | Python, PyQt5, `cryptography` lib | Offline RSA/ECDSA key generation & PDF digital signing |
| **CertiChain Frontend** | React, TypeScript, Vite, Ethers.js | University portal & employer verification UI |
| **CertiChain Backend** | Node.js, Express, Ethers.js | JWT auth, blockchain interaction, email dispatch, IPFS upload |
| **Verification Service** | Python, Flask, PyPDF2 | Cryptographic PDF signature verification microservice |
| **Smart Contract** | Solidity (EVM-compatible) | On-chain certificate registry with hash storage and revocation |
| **Decentralized Storage** | IPFS via Pinata | Immutable PDF hosting; content-addressed by CID |
| **Blockchain** | MegaEth Testnet | Immutable, publicly auditable certificate records |
| **Database** | Supabase (PostgreSQL) | University account records, session management |

The **Certificate Signer** runs 100% offline — it generates an RSA key pair, stores the private key AES-256 encrypted on a USB drive, and embeds a digital signature into certificate PDFs. The resulting signed PDF and the university's public key are used by the **CertiChain web platform** to issue, pin to IPFS, record on-chain, and publicly verify certificates.

---

## 2. Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                    OFFLINE (University IT Dept.)                        │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │           Certificate Signer (PyQt5 Desktop App)              │     │
│   │                                                                │     │
│   │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │     │
│   │  │ KeyGenerator  │─▶│  KeyManager  │─▶│    PDFHandler      │  │     │
│   │  │ RSA/ECDSA    │  │ USB Storage  │  │ Sign PDF (embed    │  │     │
│   │  │ AES-256 enc  │  │ 10-min timer │  │ sig in metadata)   │  │     │
│   │  └──────────────┘  └──────────────┘  └────────────────────┘  │     │
│   │                           │                    │               │     │
│   │                   private_key.pem        signed_cert.pdf       │     │
│   │                   (USB, encrypted)                             │     │
│   └───────────────────────────┬────────────────────┬──────────────┘     │
│                               │                    │                     │
└───────────────────────────────┼────────────────────┼─────────────────────┘
                                │                    │
             public_key.pem ────┘          signed PDF ──────────┐
             (for web registration)                              │
                                                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     ONLINE (CertiChain Platform)                        │
│                                                                          │
│  ┌─────────────┐    ┌─────────────────────┐    ┌────────────────────┐  │
│  │  React UI   │◀──▶│  Node.js Backend    │◀──▶│ Flask PDF Service  │  │
│  │ (Vite/TS)   │    │  Express + JWT      │    │ PyPDF2 + crypto    │  │
│  │ MetaMask    │    │  Ethers.js v6       │    │ Signature verify   │  │
│  └─────────────┘    └─────────────────────┘    └────────────────────┘  │
│                              │        │                                  │
│                       ┌──────┘        └──────┐                          │
│                       ▼                      ▼                           │
│              ┌──────────────┐       ┌──────────────┐                    │
│              │  Blockchain  │       │     IPFS      │                    │
│              │  MegaEth     │       │   (Pinata)    │                    │
│              │  Smart       │       │  PDF Storage  │                    │
│              │  Contract    │       │  CID-addressed│                    │
│              └──────────────┘       └──────────────┘                    │
│                       │                                                  │
│              ┌──────────────┐                                            │
│              │   Supabase   │                                            │
│              │  PostgreSQL  │                                            │
│              │  (Auth/Users)│                                            │
│              └──────────────┘                                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
/
├── Backend/
│   ├── server.js                  # Main Express API server (auth, blockchain, IPFS, email)
│   ├── app.py                     # Flask PDF verification microservice
│   ├── pdf_handler.py             # PDF signature verification logic (Flask layer)
│   └── example.env                # Environment variable template
│
├── Frontend/
│   ├── src/
│   │   ├── App.tsx                # Root app with routing
│   │   ├── components/
│   │   │   └── UniversitySidebar.tsx  # Collapsible navigation sidebar
│   │   ├── pages/
│   │   │   ├── Index.tsx          # Landing page
│   │   │   ├── NotFound.tsx       # 404 handler
│   │   │   ├── employer/
│   │   │   │   ├── Verify.tsx     # Employer certificate verification input
│   │   │   │   └── Result.tsx     # Verification result display
│   │   │   └── university/
│   │   │       ├── Login.tsx      # University login page
│   │   │       ├── Register.tsx   # University registration (Step 1)
│   │   │       ├── CreateAccount.tsx  # Finalize account (email verified, Step 2-3)
│   │   │       ├── Dashboard.tsx  # Certificate issuance workflow
│   │   │       ├── Certificates.tsx   # Bulk certificate verification
│   │   │       ├── Revoke.tsx     # Certificate revocation
│   │   │       └── ProtectedRoute.tsx # Auth guard for private pages
│   │   ├── types/
│   │   │   └── certificate.ts     # TypeScript type definitions
│   │   ├── lib/
│   │   │   ├── hash.ts            # Client-side certificate hash reconstruction
│   │   │   └── utils.ts           # Tailwind utility
│   │   └── abis/
│   │       └── CertiChain.json    # Compiled Solidity ABI
│   ├── package.json
│   └── components.json            # shadcn/ui configuration
│
└── README.md
```

---

## 4. Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Desktop GUI | PyQt5 | 5.x |
| Desktop Cryptography | Python `cryptography` (pyca) | 42.x |
| Desktop PDF | PyPDF2 | 3.x |
| Desktop Executable | PyInstaller | 6.x |
| Frontend Framework | React + Vite | 18.x / 5.x+ |
| Frontend Language | TypeScript | 5.x |
| Frontend Styling | TailwindCSS + shadcn/ui | 3.x |
| Blockchain SDK (Frontend) | Ethers.js | v6 |
| QR Code | qrcode.react | 4.x |
| Backend Runtime | Node.js | 20.x |
| Backend Framework | Express.js | 4.x |
| Auth Tokens | jsonwebtoken | 9.x |
| Password Hashing | bcryptjs | 3.x |
| Session Storage | Supabase (PostgreSQL) | 2.x |
| Email | Nodemailer (Ethereal/SMTP) | 8.x |
| IPFS Client | pinata-web3 | 0.5.x |
| Flask Service | Flask + PyPDF2 + cryptography | — |
| HTTP Client | Axios | 1.x |
| File Upload | Multer | 2.x |
| Smart Contract | Solidity | 0.8.x |
| Blockchain | MegaEth Testnet (EVM) | — |

---

## 5. Component 1 — Certificate Signer (Python Desktop App)

> **Repository:** [https://github.com/a25781623-lang/CertificateSigner](https://github.com/a25781623-lang/CertificateSigner)

### 5.1 Purpose & Security Philosophy

The Certificate Signer is a **standalone, fully offline PyQt5 desktop application** compiled to a single executable via PyInstaller. It requires zero internet connectivity. Its exclusive purpose is:

1. Generate an RSA or ECDSA asymmetric key pair for a university
2. Encrypt the private key with AES-256 (PKCS8) and store it on a USB drive
3. Load the private key (password-authenticated) to sign certificate PDFs
4. Produce signed PDFs with a cryptographic signature and a SHA-256 content hash embedded in the PDF's XMP metadata

The core security guarantee: **the private key never touches an internet-connected machine.** It is generated offline, stored encrypted on hardware (USB), and only decrypted into memory within the sandboxed desktop application.

---

### 5.2 Key Module: `KeyGenerator`

**Location:** `crypto/key_generator.py`

#### Key Generation (`generate_key_pair`)

Supports four presets:

| Preset | Type | Key Size/Curve | Use Case |
|---|---|---|---|
| `RSA-2048` | RSA | 2048-bit | Standard (recommended) |
| `RSA-4096` | RSA | 4096-bit | High-security environments |
| `ECDSA-P256` | ECDSA | NIST P-256 (secp256r1) | Compact, modern standard |
| `ECDSA-P384` | ECDSA | NIST P-384 (secp384r1) | High-security ECDSA |

**Generation Flow:**
1. Generate key pair using the `cryptography` library
2. Encrypt private key using `BestAvailableEncryption` (AES-256 via PKCS8) with the user's password
3. Serialize both keys to PEM format
4. Perform an immediate **encrypt/decrypt roundtrip test** — the private key is decrypted again and verified before any file is written to disk. If this fails, generation is aborted with no files written.

#### Key Pair Verification (`verify_key_pair`)

A five-step mathematical proof confirming a private and public key are a matched pair:

1. Decrypt the encrypted private key PEM using the provided password
2. Extract the embedded public key directly from the decrypted private key object
3. Load the separately stored public key PEM file
4. Compare RSA public numbers (`n` and `e`) between both public key objects (or ECDSA curve parameters for ECDSA)
5. Perform a **live sign/verify cycle** with a randomly generated test message using PKCS1v15 + SHA-256

All five checks must pass. Any failure returns an error describing the exact step that failed.

#### Key Fingerprint (`_generate_key_fingerprint`)

Computes a colon-separated SHA-256 fingerprint of the public key bytes (e.g., `ab:cd:ef:01:...`). This allows visual comparison of keys without exposing the key content.

---

### 5.3 Key Module: `KeyManager`

**Location:** `crypto/key_manager.py`

Handles the on-disk lifecycle of key pairs after generation.

#### USB Storage (`save_key_pair_to_usb`)

Organizes keys under a structured folder on the USB:

```
{USB_PATH}/{UNIVERSITY_NAME_UPPERCASE}/
├── private_key.pem    # AES-256 PKCS8 password-encrypted private key
├── public_key.pem     # Plaintext public key (to be uploaded to the blockchain)
├── key_info.json      # Algorithm, key size, fingerprint, creation timestamp
└── README.txt         # Human-readable instructions and security warnings
```

#### Local Storage Fallback (`save_key_pair_to_local`)

When no USB is present, keys can be saved locally. The README inside the generated folder contains **strongly worded security warnings** about the risks of on-disk private key storage (malware exposure, no hardware isolation) and recommends encrypted volumes. Local saves also generate timestamped backups of any previously existing keys before overwriting.

#### Key Loading (`load_key_pair_from_usb`)

1. Reads and decrypts the private key PEM using the provided password
2. Runs the full `verify_key_pair` five-step proof before accepting the key into memory
3. Stores the decrypted private key object in `self.current_private_key` — this object is **never written back to disk in plaintext**
4. Starts the `SecureTimer` (default: 10 minutes)

#### Session Timer

After `load_key_pair_from_usb` succeeds, `is_key_loaded()` returns `True` only while the timer is active. After 10 minutes, `is_key_loaded()` → `False` and `get_private_key()` → `None`. The administrator must re-enter their password to reload the key for another session. This limits the window of exposure if the machine is left unattended.

---

### 5.4 Key Module: `PDFHandler` (Desktop)

**Location:** `pdf/pdf_handler.py`

#### PDF Signing Flow (`save_signed_pdf`)

1. Read the original PDF using PyPDF2
2. Copy all pages and existing metadata to a new `PdfWriter`
3. **Strip all CertiChain signature metadata keys** from the metadata to create a clean, reproducible baseline
4. Compute a **SHA-256 hash of the normalized (stripped) PDF bytes** — this is the `content_hash`
5. Construct a `signed_data` dictionary:
   ```python
   signed_data = {
       "content_hash": content_hash,
       "signer": university_name,
       "timestamp": iso_timestamp,
       "signature_version": "2.4",
       "key_algorithm": "RSA-2048",
       "key_size": 2048
   }
   ```
6. Sign the **JSON-serialized `signed_data` dict (with `sort_keys=True`)** using PKCS1v15 + SHA-256 with the private key
7. Hex-encode the signature bytes
8. Embed the signature and all metadata into the PDF's XMP metadata under custom keys
9. Write the signed PDF as `{original_name}_signed.pdf`

**Custom XMP Metadata Keys Embedded in Every Signed PDF:**

| Metadata Key | Content |
|---|---|
| `/Signed_By` | University name string |
| `/Signature_Date` | ISO 8601 UTC timestamp |
| `/Key_Fingerprint` | Short SHA-256 colon-delimited fingerprint |
| `/Signature_Version` | `2.4` |
| `/Original_Content_Hash` | SHA-256 hex of normalized PDF bytes |
| `/Digital_Signature` | Hex-encoded RSA/ECDSA signature bytes |
| `/Signature_Algorithm` | `PKCS1v15-SHA256` |
| `/Key_Algorithm` | e.g., `RSA-2048` |
| `/Key_Size` | e.g., `2048` |
| `/Security_Level` | e.g., `HIGH` |
| `/PDF_Original_Name` | Original filename before signing |
| `/Signing_Method` | `EMBEDDED_METADATA` |

#### PDF Verification Flow (`verify_pdf_signature`)

1. Load the public key from the provided PEM file
2. Open the PDF and read its XMP metadata
3. Check for the presence of `/Digital_Signature` — fail immediately if absent
4. Extract `stored_signature` (hex-decoded) and `stored_content_hash`
5. **Tamper Detection Phase:** Reconstruct the normalized PDF by copying all pages and stripping all signature metadata keys. Recompute SHA-256 of the resulting bytes. Compare against `/Original_Content_Hash`. If they differ → `"PDF TAMPERING DETECTED"` — fail immediately
6. **Signature Verification Phase:** Reconstruct the `signed_data` dict from stored metadata, JSON-serialize with `sort_keys=True`, and call `public_key.verify(stored_signature, message, PKCS1v15(), SHA256())`
7. Return `(True, {signer, timestamp, tamper_proof: True})` on success, or `(False, {error, metadata})` on failure

---

### 5.5 Key Module: `USBDriveDetector`

**Location:** `usb/detector.py`

Cross-platform removable drive detection using `psutil`:

| Platform | Detection Method |
|---|---|
| Windows | `win32file.GetDriveType()` → `DRIVE_REMOVABLE` (type 2). Falls back to filesystem type and drive letter heuristics if `pywin32` unavailable. Drive `C:` always excluded. |
| Linux | Reads `/sys/block/{device}/removable` sysfs flag |
| macOS | Checks if mountpoint starts with `/Volumes/` |

Additional utilities: writability check, available disk space query, local storage fallback paths (Desktop, Documents).

---

### 5.6 Key Module: `SecurityUtils` & `SecureTimer`

**Location:** `utils/security.py`

#### Password Validation

Enforces all of the following on every password set:
- Minimum 12 characters total
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character
- No runs of 3+ identical consecutive characters (e.g., `aaa` is rejected)

#### Secure File Deletion (`secure_delete_file`)

Multi-pass overwrite before deletion:
1. Opens the file in write-binary mode
2. Overwrites file content with `os.urandom` bytes for `n` passes (default: 3)
3. Calls `os.remove()` after overwriting

**Documented Caveat:** This technique is effective on spinning HDDs but **not guaranteed on SSDs** due to wear-leveling (the OS may write to a different sector). For SSD environments, the README recommends using encrypted volumes (BitLocker, VeraCrypt, FileVault) so the encryption key can be discarded instead.

#### Memory Clearing

`clear_sensitive_data()` overwrites `bytearray` objects with random bits via `secrets.randbits` before they are garbage collected, reducing the window where decrypted key material resides in memory.

#### SecureTimer

A lightweight timer using `time.time()`:
- `start()` — record start timestamp
- `is_expired()` — `time.time() - start_time > timeout_seconds`
- `remaining_time()` — integer seconds remaining before expiry

Used by `KeyManager` to enforce the 10-minute session limit after private key loading.

---

### 5.7 Desktop App Workflow

```
1. Admin launches CertificateSigner.exe (offline)
2. Inserts USB drive → USBDriveDetector scans for removable drives
3. [ONE-TIME SETUP]
   a. Admin clicks "Generate Keys"
   b. KeyGenerator.generate_key_pair(algorithm, password, university_name)
      - Generates RSA/ECDSA key pair
      - Encrypts private key with AES-256/PKCS8 using password
      - Performs encrypt/decrypt roundtrip test
   c. KeyManager.save_key_pair_to_usb()
      - private_key.pem (encrypted) saved to USB
      - public_key.pem (plaintext) saved to USB
      - Admin uploads public_key.pem to CertiChain web platform

4. [PER-CERTIFICATE WORKFLOW]
   a. Admin creates certificate PDF (LaTeX, Word, etc.)
   b. Opens CertificateSigner.exe, inserts USB
   c. Admin enters password → KeyManager.load_key_pair_from_usb()
      - Decrypts private key, runs 5-step verification
      - Starts 10-minute session timer
   d. Admin selects PDF → PDFHandler.save_signed_pdf()
      - Normalizes PDF (strips metadata), computes SHA-256
      - Signs signed_data dict with private key (PKCS1v15 + SHA-256)
      - Embeds signature + hash in PDF XMP metadata
      - Outputs {name}_signed.pdf
   e. Admin uploads signed PDF to CertiChain university dashboard
```

---

### 5.8 Building the Executable

```bash
# Install dependencies
pip install cryptography PyPDF2 psutil PyQt5 pyinstaller

# Optional: Windows pywin32 for better USB detection
pip install pywin32   # Windows only

# Build single-file executable
pyinstaller --onefile --windowed main.py

# Output locations:
# Windows:  dist/CertificateSigner.exe
# macOS:    dist/CertificateSigner.app
# Linux:    dist/CertificateSigner
```

The `--onefile` flag bundles all Python dependencies. `--windowed` suppresses the console window on Windows.

---

## 6. Component 2 — CertiChain Web Platform

### 6.1 Frontend (React/TypeScript/Vite)

Built with Vite, React 18, TypeScript 5, TailwindCSS, and shadcn/ui. Uses Ethers.js v6 for MetaMask wallet interaction. No server-side rendering — pure SPA.

#### Routing (`App.tsx`)

```
/                          → Landing page (Index)
/verify                    → Employer verification input
/verify/result             → Verification result display
/university/login          → University login
/university/register       → University registration (Step 1)
/create-account/:token     → Finalize account creation (email-verified link)
/university/dashboard      → Issue certificate (PROTECTED)
/university/certificates   → Bulk verify certificates (PROTECTED)
/university/revoke         → Revoke certificate (PROTECTED)
*                          → 404 NotFound
```

Protected routes are wrapped in a `<ProtectedRoute>` component that verifies authentication on every navigation by making a live API call to the backend (not just checking localStorage).

#### Page: `Register.tsx` (`/university/register`)

- Input form: university name, official email, wallet address, public key (`.pem` file upload)
- Wallet connect: uses `ethers.BrowserProvider` + `eth_requestAccounts` to populate the wallet field with a checksummed address (`ethers.getAddress()`)
- On submit: calls `POST /register` → backend verifies the university is whitelisted on-chain before sending verification email
- On success: shows instruction screen pointing admin to the backend terminal for the Ethereal email preview URL

#### Page: `CreateAccount.tsx` (`/create-account/:token`)

Three-step flow triggered from the email verification link:
1. Reads the JWT token from the URL params
2. User enters desired password
3. On submit:
   - Gets current wallet address from MetaMask via `provider.getSigner().getAddress()`
   - Calls `POST /prepare-registration` → backend returns unsigned `registerUniversity()` contract transaction
   - User signs and broadcasts via MetaMask (`signer.sendTransaction()`)
   - After blockchain confirmation, calls `POST /finalize-registration` with token, password, and `receipt.hash`
4. On success: shows an alert dialog reminding the admin to install the Certificate Signer desktop app before trying to issue certificates

#### Page: `Dashboard.tsx` (`/university/dashboard`)

The main certificate issuance workflow. Uses a 4-step progress tracker with visual state (`IssuanceStep` type: `idle | verifying | uploading | hashing | signing | confirmed | failed`):

| Step | Label | Backend Call | Action |
|---|---|---|---|
| 1 | Verifying Signature | `POST /verify-signature` | Flask service confirms PDF was signed by this university's private key |
| 2 | Uploading to IPFS | `POST /upload-certificate` | File security check, then pins PDF to IPFS via Pinata |
| 3 | Creating Hash | `POST /prepare-certificate-hash` | Builds certificate hash, returns unsigned `issueCertificate()` transaction |
| 4 | Confirm in Wallet | MetaMask prompt | User signs and broadcasts transaction |

On success:
- Displays a scannable QR code containing a verification URL with all certificate data pipe-delimited
- Shows the blockchain transaction hash with a link to Etherscan
- "Send to Student" button calls `POST /send-certificate-email` to deliver the Certificate ID and data JSON file to the student's email

All axios calls to protected endpoints include `withCredentials: true` so the browser sends the HttpOnly auth cookie automatically.

#### Page: `Certificates.tsx` (`/university/certificates`)

Bulk verification via JSON file upload:
- Accepts multiple `.json` files simultaneously
- For each file: reconstructs the pipe-delimited QR data string, then calls `POST /verify-certificate-from-qr`
- Displays results in a table: student name, course, date, grade, certificate ID, and a verification status badge (Valid / Invalid with message)
- File name is used as the Certificate ID (e.g., `CERT-1759776463379.json` → ID `CERT-1759776463379`)

#### Page: `Revoke.tsx` (`/university/revoke`)

Two-phase revocation with multiple safety checks:

**Phase 1 — Verify before showing revoke button:**
1. User provides Certificate ID + JSON data file
2. Frontend reads JSON, calls `reconstructCertificateHash()` from `lib/hash.ts`
3. Queries `contract.certificates(certificateId)` directly via read-only RPC
4. Checks: certificate exists, is not already revoked, hash matches JSON
5. Only on passing all checks: displays certificate details for review

**Phase 2 — Revoke with backend authorization:**
1. Calls `POST /prepare-revoke` (requires auth cookie) — backend verifies the authenticated user's wallet address matches `onChainCertificate.universityAddress`
2. Only if backend approves: MetaMask prompts for `revokeCertificate(certificateId)` transaction
3. On success: clears form and file input

#### Page: `Verify.tsx` + `Result.tsx` (Employer Portal)

`Verify.tsx`:
- No login required
- Input: Certificate ID (text) + JSON data file upload
- Reads JSON, reconstructs pipe-delimited QR data string
- Navigates to `/verify/result?qrData={encoded}` — no server call from this page

`Result.tsx`:
- Reads `qrData` from URL query string on mount
- Calls `POST /verify-certificate-from-qr`
- Displays: status card (Pending / Valid / Invalid), full certificate details, blockchain proof section (wallet address + signer name from PDF metadata), and a link to open the PDF from IPFS if valid

#### `ProtectedRoute.tsx`

```tsx
const checkAuth = async () => {
  await axios.get(`${BACKEND_URL}/get-university-details`, { withCredentials: true });
  setIsAuth(true);  // success → render outlet
  // catch → setIsAuth(false) → redirect to /university/login
};
```

Does a **live server-side auth check** on every protected route mount — does not rely on `localStorage` or client-side token presence. If the session is expired or the cookie is missing, the user is immediately redirected.

#### `lib/hash.ts`

Client-side certificate hash reconstruction utility:

```typescript
export function reconstructCertificateHash(data: CertificateData): string {
  const stringToHash =
    data.ipfsCid + data.studentName + data.universityname + data.courseName +
    data.issueDate + data.walletaddress + data.publicKey + (data.grade || '');
  return `0x${sha256(stringToHash)}`;
}
```

The concatenation order here **must exactly match** the order used in `server.js` and the QR data assembly in `Dashboard.tsx`. Any difference breaks verification.

---

### 6.2 Backend (Node.js/Express)

**Entry point:** `Backend/server.js`

#### Middleware Stack

```javascript
app.use(generalLimiter);     // 500 req/hour per IP on all routes
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
```

#### Registration Flow — 3-Step JWT Challenge

**Step 1: `POST /register`**
1. Check `universityName` + `email` against the smart contract whitelist via `contract.isUniversityWhitelisted(name)` — returns `(bool, email)`
2. If whitelisted and email matches: create a JWT (`expiresIn: '1h'`) signed with `JWT_SECRET`
3. Store the full registration payload in `pendingVerifications[token]` (in-memory map)
4. Send verification email with a link: `{FRONTEND_URL}/create-account/{token}`
5. Return `200` — "Verification email sent"

**Step 2: `POST /prepare-registration`**
1. Client submits `{ token, walletAddress }` from the email link
2. Verify JWT — fail with `400` on expiry (and delete from `pendingVerifications`)
3. Retrieve registration data from `pendingVerifications[token]`
4. Build unsigned `registerUniversity(name, publicKey)` transaction using `ethers.Interface.encodeFunctionData()`
5. Return `{ unsignedTx }` to frontend (token NOT deleted yet — still needed for Step 3)

**Step 3: `POST /finalize-registration`**
1. Verify JWT one final time
2. Retrieve and validate pending registration data
3. Hash password with `bcrypt.hash(password, 10)`
4. Insert user record into Supabase: `{ email, universityname, walletaddress, hashedpassword }`
5. **Delete token** from `pendingVerifications` — prevents replay
6. Return `201` — "Account created successfully"

#### Login: `POST /login`

1. Fetch user from Supabase by email (lowercased)
2. `bcrypt.compare(password, user.hashedpassword)`
3. On match: generate a `uuidv4()` session ID, update `active_session_id` in Supabase
4. Sign JWT: `{ email, universityName, walletaddress, jti: sessionId }`, `expiresIn: '1h'`
5. Set `httpOnly`, `secure`, `sameSite: 'strict'` cookie: `universityAuthToken`
6. Return `200` (no token in response body — cookie only)

#### `authenticateToken` Middleware

Every protected endpoint uses this middleware:

```javascript
const authenticateToken = (req, res, next) => {
  const token = req.cookies.universityAuthToken;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403);

    // Database lookup to validate session ID
    const { data: user } = await supabase
      .from('universities').select('*').eq('email', decoded.email).single();

    if (!user) return res.status(401).json({ message: "User no longer exists." });

    // THE CRITICAL CHECK: JTI must match active_session_id in DB
    if (user.active_session_id !== decoded.jti) {
      return res.status(401).json({ message: "Session expired or logged in elsewhere." });
    }

    req.user = user;
    next();
  });
};
```

**Why this is secure:** Even if a valid JWT is stolen (e.g., via network interception on an insecure connection), logging in from a new location generates a new `uuidv4()` session ID and overwrites `active_session_id` in the database, immediately invalidating all previous tokens. This implements **stateful single-session enforcement** on top of stateless JWTs.

#### Logout: `POST /logout`

1. Set `active_session_id = null` in Supabase for the user
2. `res.clearCookie('universityAuthToken', { httpOnly, secure, sameSite })` — clears the browser cookie
3. Two-pronged invalidation: stateful (DB nullification) + stateless (cookie deletion)

#### `GET /get-university-details`

- Reads `walletaddress` from `req.user` (set by `authenticateToken`)
- Creates a fresh `ethers.JsonRpcProvider` + contract instance (avoids stale connection issues)
- Calls `contract.universities(walletaddress)` — returns university `name` and `publicKey` from on-chain storage

#### `POST /verify-signature`

Security-sensitive upload endpoint:

1. Multer handles PDF upload to `uploads/` temp directory
2. `authenticateToken` validates session
3. Fetches university's public key from on-chain via `contract.universities(walletaddress)`
4. Writes public key to a temp `.pem` file: `{universityname}_pubkey.pem`
5. Forwards both files to Flask service at `POST {PYTHON_API_URL}/verify-pdf` via `FormData`
6. If valid: computes SHA-256 of the PDF file buffer, stores `{ verifiedBy: walletaddress, timestamp: Date.now() }` in `verifiedFiles[fileHash]`
7. If invalid: deletes the PDF from disk immediately
8. Cleans up temp `.pem` file regardless of outcome

The `verifiedFiles` map acts as an **authorization gate** for the upload endpoint. A file can only proceed to IPFS upload if it was verified by the same wallet that is currently authenticated.

#### `POST /upload-certificate`

1. Re-reads the PDF file from disk
2. Computes SHA-256 of file buffer
3. Looks up `verifiedFiles[hash]` — **fails with `403`** if missing or `verifiedBy !== walletaddress`
4. Creates a `Blob` → `File` object from the buffer
5. Calls `pinata.upload.file(fileToUpload)` with metadata
6. **Deletes the entry** from `verifiedFiles[hash]` — one-time-use authorization
7. Returns `{ ipfsCid }` on success

#### `POST /prepare-certificate-hash`

1. Reads university details from on-chain (name + publicKey)
2. Constructs certificate data object
3. Computes deterministic SHA-256 hash:
   ```javascript
   const stringToHash = `${ipfsCid}${studentName}${universityname}${courseName}${issueDate}${walletaddress}${publicKey}${grade}`;
   const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
   ```
4. Generates a unique `certificateId = "CERT-" + Date.now()`
5. Encodes `issueCertificate(certificateId, "0x" + hash)` into an unsigned transaction
6. Returns: `{ unsignedTx, certificateId, certificateHash, certificateDataForJson }`

#### `POST /send-certificate-email`

1. Receives: `studentEmail`, `studentName`, `certificateId`, `certificateData` object
2. JSON-serializes `certificateData` with `JSON.stringify(data, null, 2)`
3. Sends email with the JSON as an attachment: `${certificateId}.json`
4. The student receives their Certificate ID + a data file needed for future verification

#### `POST /verify-certificate-from-qr`

The most complex endpoint — performs a full three-layer verification (see [Section 9.7](#97-three-layer-verification-model) for details):

1. **Parse** pipe-delimited QR string: `CID|studentName|universityname|courseName|issueDate|walletAddress|publicKey|certId|grade`
2. **Reconstruct hash** from the parsed fields
3. **Layer 1 (Blockchain):** `contract.certificates(certificateId)` → compare hash, check `isRevoked`
4. **Layer 2 (IPFS + PDF download):** Fetch PDF from `https://dweb.link/ipfs/{cid}`, write to temp file
5. **Layer 3 (Signature):** Write public key to temp file, call Flask `POST /verify-pdf`
6. Clean up all temp files (both paths: success and failure)
7. Extract `signer` from Flask response, return full `certificateData` object

#### `POST /prepare-revoke`

Backend authorization check before blockchain revocation:

1. `authenticateToken` validates session and sets `req.user`
2. Fetches `onChainCertificate = await contract.certificates(certificateId)`
3. Checks: certificate exists (address ≠ zero address)
4. **Ownership check:** `onChainCertificate.universityAddress.toLowerCase() !== walletaddress.toLowerCase()` → `403 Unauthorized`
5. Checks: certificate is not already revoked → `400`
6. Returns `200` only if all checks pass

---

### 6.3 Python Verification Service (Flask)

**Files:** `Backend/app.py` + `Backend/pdf_handler.py`

A minimal Flask microservice that wraps the same PDF signature verification logic used in the desktop app.

#### `POST /verify-pdf`

- Accepts: multipart form with `pdf` (PDF file) and `public_key` (PEM file)
- Uses `os.urandom(8).hex()` for **unique temp filenames** to prevent concurrent request file collisions
- Delegates to `PDFHandler.verifypdfsignature(pdf_path, public_key_path)`
- Cleans up both temp files after verification regardless of outcome
- Returns flat JSON:

```json
// Success
{
  "valid": true,
  "signer": "University Name",
  "timestamp": "2025-01-01T12:00:00.000000",
  "tamper_proof": true,
  "metadata": { ... }
}

// Failure
{
  "valid": false,
  "message": "Verification failed",
  "error_details": {
    "error": "PDF TAMPERING DETECTED: Content has been modified after signing.",
    "tampering_detected": true,
    "metadata": { ... }
  }
}
```

**Why a separate microservice?** The Node.js backend cannot natively perform the `cryptography`-library-based RSA/ECDSA verification that PyPDF2 metadata reading requires. The Flask service runs on `localhost:5000` and is only accessible internally — it is not exposed to the internet.

---

### 6.4 Smart Contract (Solidity)

Deployed on MegaEth Testnet (EVM-compatible). ABI embedded in `server.js` and `Frontend/src/abis/CertiChain.json`.

#### Data Structures

```solidity
struct University {
    string name;
    string email;           // From whitelist
    address walletAddress;
    string publicKey;       // Full PEM public key stored on-chain
    bool isRegistered;
}

struct Certificate {
    string certificateHash;    // "0x" + SHA-256 of certificate data
    bool isRevoked;
    address universityAddress; // Which university issued this
}

mapping(address => University) public universities;
mapping(string => Certificate) public certificates;
```

#### Key Functions

| Function | Access Control | Description |
|---|---|---|
| `addUniversityToWhitelist(name, email)` | `onlyOwner` | Admin pre-approves a university by name + email |
| `registerUniversity(name, publicKey)` | Whitelisted wallet only | Register and store the PEM public key on-chain |
| `issueCertificate(id, hash)` | Registered university only | Record certificate hash immutably on-chain |
| `revokeCertificate(id)` | Issuing university only | Mark `isRevoked = true` for a certificate |
| `isUniversityWhitelisted(name)` | Public view | Returns `(bool isWhitelisted, string email)` |
| `universities(address)` | Public view | Returns full `University` struct |
| `certificates(id)` | Public view | Returns `(hash, isRevoked, universityAddress)` |

#### Events

```solidity
event UniversityRegistered(address indexed universityAddress, string name);
event CertificateIssued(string indexed certificateId, address indexed universityAddress, string certificateHash);
event CertificateRevoked(string indexed certificateId, address indexed universityAddress);
```

#### On-Chain Public Key Storage

The university's PEM public key is stored directly in the `universities` mapping. This means verification does not require trusting any off-chain source for the public key — it is always fetched live from the blockchain at verification time. This prevents key substitution attacks.

---

## 7. End-to-End Workflow

### Phase 1: University Setup (One-time)

```
1. Admin contacts CertiChain operator → university name + email added to whitelist via addUniversityToWhitelist()
2. Admin runs CertificateSigner.exe offline with USB inserted
3. Generates RSA-2048 key pair with strong password
   - private_key.pem → USB (AES-256 encrypted)
   - public_key.pem → USB (plaintext, for web registration)
4. Admin navigates to /university/register
5. Fills in: university name, official email, wallet address (MetaMask connect), uploads public_key.pem
6. Backend validates against smart contract whitelist, sends verification email
7. Admin clicks email link → /create-account/{token}
8. Admin connects MetaMask → signs registerUniversity(name, publicKey) transaction
9. University name + full PEM public key stored permanently on MegaEth blockchain
10. Admin sets password → account stored in Supabase
```

### Phase 2: Certificate Issuance (Per certificate)

```
1. University creates certificate PDF (word processor, LaTeX, etc.)
2. Admin opens CertificateSigner.exe, inserts USB, enters password
3. Desktop app decrypts private key (5-step verification), starts 10-min session
4. Admin selects PDF → signed PDF produced:
   - PDF content normalized → SHA-256 hash computed
   - signed_data dict (hash + metadata) signed with private key (PKCS1v15 + SHA-256)
   - Signature hex-encoded and embedded in PDF XMP metadata
5. Admin logs into /university/dashboard
6. Fills in: student name, email, course, grade, issue date
7. Uploads signed PDF

Backend flow:
   Step 1 → /verify-signature
     - Fetches public key from blockchain
     - Forwards PDF + public key to Flask service
     - Flask: checks content hash (tamper detection), verifies signature
     - On success: stores SHA-256(PDF) in verifiedFiles[hash]

   Step 2 → /upload-certificate
     - Re-computes SHA-256 of uploaded PDF
     - Checks verifiedFiles[hash] matches authenticated wallet
     - Pins PDF to IPFS via Pinata → receives CID
     - Deletes verifiedFiles entry (one-time use)

   Step 3 → /prepare-certificate-hash
     - Computes: SHA-256(CID + studentName + universityname + courseName + issueDate + walletAddress + publicKey + grade)
     - Generates certificateId = "CERT-" + timestamp
     - Returns unsigned issueCertificate(certificateId, "0x" + hash) transaction

   Step 4 → MetaMask
     - University wallet signs and broadcasts the transaction
     - issueCertificate() recorded on MegaEth blockchain

8. Dashboard shows QR code (verification URL with all data pipe-delimited)
9. Admin clicks "Send to Student via Email"
   - /send-certificate-email sends:
     - Email with Certificate ID in body
     - {CERT-ID}.json attachment with all certificate fields
```

### Phase 3: Employer Verification (Anytime, no account required)

```
1. Student shares Certificate ID + {CERT-ID}.json file with employer
2. Employer opens /verify (no login required)
3. Enters Certificate ID, uploads JSON file, clicks "Verify"
4. Frontend:
   - Reads JSON, extracts all fields
   - Constructs: "CID|studentName|university|course|date|wallet|publicKey|certId|grade"
   - Navigates to /verify/result?qrData={encoded}

5. Result page calls /verify-certificate-from-qr

Backend three-layer verification:
   Layer 1 (Blockchain):
     - Reconstruct hash from QR fields
     - contract.certificates(certId) → compare on-chain hash
     - Check isRevoked flag
     → "Hash mismatch" or "Certificate has been revoked" on failure

   Layer 2 (IPFS):
     - Download PDF from https://dweb.link/ipfs/{CID}
     - Write to temp file

   Layer 3 (Cryptographic Signature):
     - Write public key (from QR data, sourced from blockchain at issuance) to temp file
     - Forward both to Flask /verify-pdf
     - Flask: tamper detection (content hash check) + signature verification
     → "PDF signature verification failed" on failure

   Cleanup: delete all temp files

6. On success: return certificateData with signer name (from PDF metadata)
7. Result page shows:
   - ✅ "Certificate Valid" badge
   - Full certificate details (student, course, date, grade, university)
   - Blockchain proof section (wallet address + digital signature/signer name)
   - "Open Certificate" button → IPFS PDF link
```

---

## 8. API Reference

All endpoints return `Content-Type: application/json`. Authentication requires the `universityAuthToken` HttpOnly cookie (sent automatically by browser with `credentials: 'include'`).

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Step 1: Initiate university registration (checks whitelist) |
| `POST` | `/prepare-registration` | Step 2: Build unsigned registerUniversity() transaction |
| `POST` | `/finalize-registration` | Step 3: Create account (bcrypt password, Supabase insert) |
| `POST` | `/login` | Authenticate and set HttpOnly session cookie |
| `POST` | `/verify-certificate-from-qr` | Full 3-layer certificate verification |

### Protected Endpoints (Require `universityAuthToken` cookie)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/get-university-details` | Fetch university name + public key from blockchain |
| `POST` | `/verify-signature` | Verify uploaded PDF was signed by this university |
| `POST` | `/upload-certificate` | Upload verified PDF to IPFS |
| `POST` | `/prepare-certificate-hash` | Compute cert hash + build issueCertificate() transaction |
| `POST` | `/send-certificate-email` | Email certificate ID + JSON attachment to student |
| `POST` | `/prepare-revoke` | Authorize revocation (ownership check) |
| `POST` | `/logout` | Invalidate session (DB null + cookie clear) |

### Flask Internal Endpoint (Not exposed to internet)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/verify-pdf` | Verify PDF digital signature (called only by Node.js backend) |

### Key Request/Response Examples

**`POST /verify-certificate-from-qr`**

Request:
```json
{
  "qrData": "bafybei...|Jane Smith|IIT Delhi|Computer Science|2025-01-15|0x1234...|-----BEGIN PUBLIC KEY-----|CERT-1759776463379|9.5"
}
```

Response (success):
```json
{
  "valid": true,
  "message": "Certificate verified successfully.",
  "certificateData": {
    "id": "CERT-1759776463379",
    "studentName": "Jane Smith",
    "courseName": "Computer Science",
    "issueDate": "2025-01-15",
    "universityname": "IIT Delhi",
    "walletaddress": "0x1234...",
    "signature": "IIT Delhi",
    "grade": "9.5",
    "ipfsCid": "bafybei..."
  }
}
```

Response (failure examples):
```json
{ "valid": false, "message": "Hash mismatch. Certificate is not authentic." }
{ "valid": false, "message": "Certificate has been revoked." }
{ "valid": false, "message": "PDF signature verification failed." }
```

**`POST /prepare-certificate-hash`**

Request (with auth cookie):
```json
{
  "ipfsCid": "bafybei...",
  "studentName": "Jane Smith",
  "studentEmail": "jane@example.com",
  "courseName": "Computer Science",
  "issueDate": "2025-01-15",
  "grade": "9.5"
}
```

Response:
```json
{
  "unsignedTx": { "to": "0xABC...", "data": "0x...", "from": "0x1234..." },
  "certificateId": "CERT-1759776463379",
  "certificateHash": "0xabc123...",
  "certificateDataForJson": {
    "ipfsCid": "bafybei...",
    "studentName": "Jane Smith",
    "universityname": "IIT Delhi",
    "courseName": "Computer Science",
    "issueDate": "2025-01-15",
    "walletaddress": "0x1234...",
    "publicKey": "-----BEGIN PUBLIC KEY-----...",
    "grade": "9.5"
  }
}
```

---

## 9. Security Architecture

### 9.1 Private Key Security (Air-Gap Model)

The asymmetric private key **never exists on an internet-connected machine** at any point in the system. The security chain:

1. **Generation:** Happens on the admin's machine running the offline desktop app — no network activity
2. **Storage:** Private key PEM is encrypted with AES-256 (PKCS8 + BestAvailableEncryption) using a 12+ character password and written only to a USB drive. Never copied to the application machine's hard drive.
3. **Loading:** Decrypted into memory only within the desktop app, after password authentication and a 5-step cryptographic key pair verification
4. **Session expiry:** The in-memory private key reference becomes inaccessible after 10 minutes via `SecureTimer`. The administrator must re-enter their password.
5. **On-chain public key:** The corresponding public key is stored on the blockchain. Anyone verifying a certificate fetches the public key directly from the blockchain — they do not need to trust any off-chain source.

### 9.2 PDF Signing & Tamper Detection

Every signed PDF is protected by two independent mechanisms:

**Mechanism 1 — Digital Signature**
The `signed_data` dict (including content hash, signer, timestamp) is signed with the university's RSA private key using PKCS1v15 + SHA-256. The hex-encoded signature is embedded in `/Digital_Signature` metadata. Any attempt to forge a certificate without the private key will fail at the `public_key.verify()` step.

**Mechanism 2 — Content Hash**
Before signing, the PDF is normalized (all signature metadata stripped), and a SHA-256 hash of the resulting bytes is computed and embedded in `/Original_Content_Hash`. On verification, this normalization and hashing is repeated. If **any single byte** of the PDF content was changed after signing — including re-saving in another PDF editor, inserting text, changing dates — the hashes will not match, triggering `"PDF TAMPERING DETECTED"` before signature verification is even attempted.

These two mechanisms together ensure:
- Forgery requires the private key (impossible without the USB + password)
- Modification is detectable even without the private key

### 9.3 Blockchain Immutability

The SHA-256 hash of each certificate's data fields is stored in the smart contract's `certificates` mapping. Once written, it cannot be altered by anyone, including the contract owner. This means:

- Even if the IPFS-hosted PDF is somehow replaced (e.g., Pinata deletes it), the hash on-chain proves what the original content was
- Even if the university's database is compromised, certificate records cannot be backdated or modified
- Revocation is also immutable — once revoked (`isRevoked = true`), it cannot be un-revoked

### 9.4 Authentication & Session Security

**JWT Construction:**
```javascript
jwt.sign({ email, universityName, walletaddress, jti: sessionId }, JWT_SECRET, { expiresIn: '1h' })
```

The JWT payload includes a `jti` (JWT ID) field set to a `uuidv4()` session identifier.

**Stateful JTI Validation:**
Every protected request triggers a database lookup to compare `decoded.jti` against `user.active_session_id` in Supabase. This implements:

- **Single active session enforcement:** Logging in from a new device/location generates a new UUID, overwrites the database field, and immediately invalidates any previous tokens — even valid, unexpired ones
- **Instant logout:** Setting `active_session_id = null` in the database invalidates the session within milliseconds, without waiting for the JWT to expire
- **Defense against token theft:** Stolen tokens cannot be used if the legitimate user has logged in again

**Cookie Security Flags:**
```javascript
res.cookie('universityAuthToken', token, {
  httpOnly: true,   // Not accessible via JavaScript (XSS protection)
  secure: true,     // Only transmitted over HTTPS
  sameSite: 'strict' // Not sent on cross-site requests (CSRF protection)
});
```

**Password Storage:** `bcrypt.hash(password, 10)` — 2^10 (1024) bcrypt rounds. Raw passwords are never stored or logged.

### 9.5 Certificate Hash Integrity

The certificate hash is a SHA-256 of a **deterministic, ordered concatenation** of all certificate fields:

```
hash = SHA-256(CID + studentName + universityName + courseName + issueDate + walletAddress + publicKey + grade)
```

This ordering is enforced identically in:
- `server.js` → `prepare-certificate-hash` (hash generation at issuance)
- `server.js` → `verify-certificate-from-qr` (hash reconstruction at verification)
- `lib/hash.ts` → `reconstructCertificateHash()` (client-side hash for revoke page)
- `Revoke.tsx` → `searchAndVerifyCertificate()` (direct RPC verification)

Including the university's **public key** in the hash means the hash is not just a fingerprint of academic data, but also cryptographically ties the certificate to the issuing university's identity. A certificate cannot be "re-issued" for a different university without changing the hash.

### 9.6 Upload Security (Two-Phase Verification)

The certificate issuance workflow enforces a strict two-phase requirement to prevent unauthenticated or unverified files from reaching IPFS:

**Phase 1 — Signature Verification:**
`POST /verify-signature` calls the Flask service to confirm:
1. The PDF contains a valid digital signature
2. The signature was made with the private key corresponding to **this university's on-chain public key**
3. The PDF content has not been tampered with since signing

On success, an entry is stored in `verifiedFiles[sha256(pdfBytes)] = { verifiedBy: walletAddress, timestamp }`.

**Phase 2 — Upload:**
`POST /upload-certificate` requires:
1. The uploaded file's SHA-256 matches an entry in `verifiedFiles`
2. The `verifiedBy` wallet address matches the currently authenticated user's wallet
3. The entry is consumed (deleted) after one successful upload — it cannot be reused

This means:
- A file verified by University A cannot be uploaded by University B
- A file cannot be uploaded twice using the same verification
- Skipping signature verification and jumping straight to upload will fail

### 9.7 Three-Layer Verification Model

When an employer verifies a certificate, three independent checks are performed:

```
Layer 1: BLOCKCHAIN INTEGRITY
  ├─ Reconstruct SHA-256 hash from QR/JSON data fields
  ├─ Fetch certificate record from smart contract
  ├─ Compare reconstructed hash vs. on-chain hash
  └─ Check isRevoked flag
  → Catches: fake certificates, data tampering, revoked certificates

Layer 2: CONTENT AUTHENTICITY (IPFS)
  ├─ Download PDF from IPFS using stored CID
  └─ Confirm PDF is accessible and retrievable
  → Catches: certificates referencing non-existent files

Layer 3: CRYPTOGRAPHIC SIGNATURE (Flask)
  ├─ Tamper detection: recompute PDF content hash vs. embedded hash
  ├─ Signature verification: verify embedded signature with on-chain public key
  └─ Signer name extracted from PDF metadata
  → Catches: PDF modification after signing, wrong university key used
```

All three layers must pass. Failure at any layer returns a specific, descriptive error message.

### 9.8 Rate Limiting

Two rate limiters are implemented using `express-rate-limit`:

```javascript
// Applied to the public verification endpoint specifically
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 20,                     // 20 requests per IP
  message: "Too many verification attempts..."
});

// Applied to all routes globally
const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1-hour window
  max: 500,                   // 500 requests per IP
});
```

The stricter `verifyLimiter` on `/verify-certificate-from-qr` prevents automated certificate scraping, brute-force certificate ID guessing, and denial-of-service via expensive blockchain queries.

### 9.9 CORS & Cookie Security

CORS is configured to only accept requests from `FRONTEND_URL` (the React app origin):

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true   // Required for cross-origin cookies
}));
```

This prevents other websites from making authenticated requests to the backend using a victim's cookies. Combined with `sameSite: 'strict'` cookies, CSRF attacks are fully mitigated.

### 9.10 Revocation Authorization Guard

The revocation flow implements a backend authorization check that is separate from MetaMask:

`POST /prepare-revoke` verifies that `onChainCertificate.universityAddress === req.user.walletaddress` (lowercased comparison). This prevents:
- Authenticated University A from revoking certificates issued by University B
- Replay attacks where a valid session is used to revoke arbitrary certificates

The actual `revokeCertificate()` smart contract call is made directly from the university's MetaMask wallet — the contract itself also enforces that only the issuing address can revoke. This provides **double enforcement**: at the API layer and at the smart contract layer.

---

## 10. Environment Configuration

Copy `Backend/example.env` to `Backend/.env`:

```env
# Server Configuration
PORT=3000
Backend_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080

# Frontend (Vite) — create Frontend/.env
VITE_BACKEND_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=0x...
VITE_RPC_URL=https://carrot.megaeth.com/rpc

# Supabase (PostgreSQL)
# Required table schema (see below)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_service_role_key
SUPABASE_TABLE_NAME=universities

# Blockchain — MegaEth Testnet
RPC_PROVIDER_URL=https://carrot.megaeth.com/rpc
CONTRACT_ADDRESS=0x...           # Your deployed CertiChain contract address

# Authentication
JWT_SECRET=your_random_secret_here_minimum_32_characters

# Email (Ethereal for development — https://ethereal.email/)
EMAIL_USER=your.ethereal@user.com
EMAIL_PASS=your_ethereal_password

# IPFS (Pinata — https://app.pinata.cloud/developers/api-keys)
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=your-gateway.mypinata.cloud

# Python Flask Microservice
Python_Api_Url=http://localhost:5000

# Flask Configuration
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=False   # Set to True for development
```

**Required Supabase Table Schema:**

```sql
CREATE TABLE universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  universityName TEXT NOT NULL,
  walletAddress TEXT NOT NULL,
  hashedPassword TEXT NOT NULL,
  active_session_id TEXT,          -- For stateful JWT session management
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now())
);

-- Index on email for fast login queries
CREATE INDEX idx_universities_email ON universities (email);
```

---

## 11. Installation & Setup

### Prerequisites

- Node.js 20.x
- Python 3.10+
- MetaMask browser extension
- Supabase account (free tier sufficient)
- Pinata account (free tier: 1GB storage)
- MegaEth Testnet wallet with test ETH

### Backend Setup

```bash
cd Backend

# Install Node.js dependencies
npm install

# Install Python dependencies for Flask service
pip install flask PyPDF2 cryptography

# Copy and fill environment file
cp example.env .env
# Edit .env with your values

# Start Node.js backend
node server.js

# In a separate terminal, start Flask service
python app.py
```

### Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_BACKEND_URL=http://localhost:3000" > .env
echo "VITE_CONTRACT_ADDRESS=0x..." >> .env
echo "VITE_RPC_URL=https://carrot.megaeth.com/rpc" >> .env

# Start development server
npm run dev

# Build for production
npm run build
```

### Smart Contract Deployment

The smart contract is a standard Solidity contract deployable on any EVM chain. After deployment:
1. Note the deployed contract address
2. Update `CONTRACT_ADDRESS` in `Backend/.env`
3. Update `VITE_CONTRACT_ADDRESS` in `Frontend/.env`
4. Call `addUniversityToWhitelist(name, email)` as the contract owner for each university you want to allow to register

### Certificate Signer Desktop App

```bash
# Install dependencies
pip install cryptography PyPDF2 psutil PyQt5 pyinstaller
pip install pywin32  # Windows only

# Run from source
python main.py

# OR build executable
pyinstaller --onefile --windowed main.py
# Distribute: dist/CertificateSigner.exe (Windows)
```

---

## 12. Troubleshooting

**"Key pair verification failed — keys may be corrupted or password is incorrect"**
The password entered during loading must exactly match the password used during generation. If you have multiple key sets on the USB, ensure you are loading from the correct university folder. Use `debug_verification_steps()` in `KeyGenerator` for detailed step-by-step output.

**"No embedded digital signature found"**
The uploaded PDF was not processed through the Certificate Signer desktop app. Only PDFs that have gone through the signing workflow (not just any PDF editor) will contain the `/Digital_Signature` XMP metadata key. Re-sign the certificate using the desktop app.

**"PDF TAMPERING DETECTED"**
The PDF content was modified after it was signed. This includes: re-saving in another PDF editor, compressing/optimizing the file, adding annotations, or any other modification. You must use the original `{name}_signed.pdf` output directly from the Certificate Signer. Re-sign a clean version of the certificate.

**"Hash mismatch. The JSON file does not correspond to the Certificate ID"**
The `.json` file provided does not match the Certificate ID entered. Either the wrong JSON file was uploaded, the JSON was manually edited, or the Certificate ID was typed incorrectly. The JSON filename (without `.json`) should equal the Certificate ID.

**"Hash mismatch. Certificate is not authentic"** (during QR/full verification)
The data in the JSON file or QR string does not match what was recorded on the blockchain. The JSON file may have been tampered with, or you are providing the wrong JSON for this Certificate ID. The data must be exactly as issued.

**"Session expired or logged in elsewhere"**
Someone else (or you, on another browser/tab) has logged into this university account, invalidating this session. Re-login. If this happens unexpectedly, it may indicate unauthorized access to the account.

**MetaMask transaction fails with "insufficient funds"**
The university wallet needs MegaEth testnet ETH for gas fees. Get test ETH from the MegaEth faucet.

**MetaMask stuck on wrong network**
Add MegaEth Testnet to MetaMask: RPC URL `https://carrot.megaeth.com/rpc`. The network must match the `RPC_PROVIDER_URL` and the chain where the smart contract is deployed.

**"Could not connect to the blockchain"** (server startup)
The backend performs a blockchain connection test at startup. Verify `RPC_PROVIDER_URL=https://carrot.megaeth.com/rpc` in your `.env`. Check that the MegaEth testnet is reachable from your server.

**Flask service returns 500 on verify-pdf**
Check that the PDF was created by the Certificate Signer app (not just any PDF). Also verify the public key `.pem` file format — it must be the exact PEM output from key generation, not a reformatted version. Check the Flask terminal for the specific Python exception.

**USB drive not detected on Windows without pywin32**
The detector falls back to filesystem-type heuristics. Ensure the USB is formatted as FAT32, exFAT, or NTFS. Drive `C:` is always excluded from detection regardless.

**IPFS PDF download fails during verification**
The public IPFS gateway `dweb.link` may be temporarily unavailable. This is a liveness issue, not an authenticity issue. Retry after a few minutes. For production, consider using a dedicated Pinata gateway instead of the public dweb.link gateway.

**Rate limit: "Too many verification attempts"**
The `/verify-certificate-from-qr` endpoint is limited to 20 requests per 15 minutes per IP. If running automated batch verification, space requests at least 45 seconds apart, or contact the operator for a higher-limit endpoint.

---

*CertiChain — Tamper-proof credentials for a trustless world.*
