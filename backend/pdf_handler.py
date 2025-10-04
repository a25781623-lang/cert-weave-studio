import hashlib
import json
import io
import PyPDF2

from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

class PDFHandler:
    def verifypdfsignature(self, pdf_file_path: str, public_key_file: str):
        metadata = None
        try:
            print("Opening public key file:", public_key_file)
            with open(public_key_file, 'rb') as f:
                public_key = serialization.load_pem_public_key(f.read(), backend=default_backend())
            print("Opening PDF file:", pdf_file_path)
            pdf_reader = PyPDF2.PdfReader(pdf_file_path)
            metadata = pdf_reader.metadata
            print("Extracted metadata:", metadata)
            if not (metadata and '/Digital_Signature' in metadata):
                print("No embedded digital signature found.")
                return False, {
                    'error': 'No embedded digital signature found.',
                    'metadata': dict(metadata) if metadata else None
                }
            stored_signature = bytes.fromhex(str(metadata['/Digital_Signature']))
            print("Stored signature:", stored_signature)
            stored_content_hash = str(metadata.get('/Original_Content_Hash', ''))
            print("Stored content hash:", stored_content_hash)
            signed_data = {
                "content_hash": stored_content_hash,
                "signer": str(metadata.get('/Signed_By', '')),
                "timestamp": str(metadata.get('/Signature_Date', '')),
                "signature_version": str(metadata.get('/Signature_Version', '1.0')),
                "key_algorithm": str(metadata.get('/Key_Algorithm', '')),
                "key_size": int(metadata.get('/Key_Size', '0'))
            }
            # Reconstruct PDF without signature metadata for hash check
            pdf_writer = PyPDF2.PdfWriter()
            for page in pdf_reader.pages:
                pdf_writer.add_page(page)
            clean_metadata = {k: v for k, v in metadata.items() if k not in [
                '/Signed_By', '/Signature_Date', '/Key_Fingerprint', '/Signature_Version',
                '/Original_Content_Hash', '/Digital_Signature', '/Signature_Algorithm',
                '/Key_Algorithm', '/Key_Size', '/Security_Level', '/PDF_Original_Name', '/Signing_Method'
            ]}
            print("Clean metadata for hash:", clean_metadata)
            if clean_metadata:
                pdf_writer.add_metadata(clean_metadata)
            with io.BytesIO() as buffer:
                pdf_writer.write(buffer)
                reconstructed_bytes = buffer.getvalue()
            current_content_hash = hashlib.sha256(reconstructed_bytes).hexdigest()
            print("Recomputed content hash:", current_content_hash)
            if current_content_hash != stored_content_hash:
                print("PDF tampering detected!")
                return False, {
                    'error': 'PDF TAMPERING DETECTED: Content has been modified after signing.',
                    'tampering_detected': True,
                    'metadata': dict(metadata)
                }
            original_message = json.dumps(signed_data, sort_keys=True).encode('utf-8')
            print("Original message for signature verification:", original_message)
            public_key.verify(stored_signature, original_message, padding.PKCS1v15(), hashes.SHA256())
            print("Signature verification succeeded.")
            return True, {
                'signer': signed_data['signer'],
                'timestamp': signed_data['timestamp'],
                'tamper_proof': True,
                'metadata': dict(metadata)
            }
        except Exception as e:
            print("Verification error:", e)
            return False, {
                'error': f'Error during verification: {str(e)}',
                'metadata': dict(metadata) if metadata else None
            }
