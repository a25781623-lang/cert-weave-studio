export interface Certificate {
  id: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  grade: string;
  universityName: string;
  walletAddress: string;
  signature: string;
  status: 'active' | 'revoked';
  qrCode?: string;
}

export interface University {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  publicKey: string;
}

export interface VerificationResult {
  certificate: Certificate | null;
  isValid: boolean;
  status: 'valid' | 'revoked' | 'not_found' | 'invalid_signature';
  message: string;
}
