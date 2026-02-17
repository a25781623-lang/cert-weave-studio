from flask import Flask, request, jsonify
import os
from pdf_handler import PDFHandler

app = Flask(__name__)
pdf_handler = PDFHandler()

@app.route('/verify-pdf', methods=['POST'])
def verify_pdf():
    if 'pdf' not in request.files or 'public_key' not in request.files:
        return jsonify({'error': 'PDF file and Public Key file are required'}), 400

    pdf_file = request.files['pdf']
    public_key_file = request.files['public_key']

    # It's better to use unique names to avoid conflicts if multiple users verify at once
    temp_id = os.urandom(8).hex()
    pdf_path = f'./temp_uploaded_{temp_id}.pdf'
    public_key_path = f'./temp_pubkey_{temp_id}.pem'

    pdf_file.save(pdf_path)
    public_key_file.save(public_key_path)

    is_valid, meta = pdf_handler.verifypdfsignature(pdf_path, public_key_path)

    os.remove(pdf_path)
    os.remove(public_key_path)

    # --- THE FIX IS HERE ---
    # Instead of nesting the metadata, we create a single, flat JSON object.
    if is_valid:
        # If verification is successful, merge the metadata into the main response
        response_data = {
            'valid': True,
            'message': 'Verification succeeded'
        }
        response_data.update(meta) # This adds 'signer', 'timestamp', etc. to the top level
        return jsonify(response_data)
    else:
        # If it fails, just send the failure message
        return jsonify({
            'valid': False,
            'message': 'Verification failed',
            'error_details': meta 
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)