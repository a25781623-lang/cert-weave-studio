// src/lib/hash.ts (New File)

import { sha256 } from 'js-sha256';

// This interface defines the structure of the certificate data from the JSON file.
// It must match the structure created in your server.js.
export interface CertificateData {
  ipfsCid: string;
  studentName: string;
  universityName: string;
  courseName: string;
  issueDate: string;
  walletAddress: string;
  publicKey: string;
  grade: string;
}

/**
 * Reconstructs the certificate hash from the provided data object.
 * @param data The certificate data from the student's JSON file.
 * @returns The SHA-256 hash as a hex string, prefixed with '0x'.
 */
export function reconstructCertificateHash(data: CertificateData): string {
  // CRITICAL: The concatenation order here must EXACTLY match the order in your `server.js` file.
  // HASH = HASH(CID+STUDENT NAME+UNIVERSITY NAME+COURSE NAME+ISSUE DATE+WALLET ADDRESS+PUBLIC KEY+GRADE)
  const stringToHash = 
    data.ipfsCid +
    data.studentName +
    data.universityName +
    data.courseName +
    data.issueDate +
    data.walletAddress +
    data.publicKey +
    (data.grade || ''); // Use the grade, or an empty string if it's null/undefined

  const hash = sha256(stringToHash);

  // The smart contract likely expects a '0x' prefixed hash.
  return `0x${hash}`;
}