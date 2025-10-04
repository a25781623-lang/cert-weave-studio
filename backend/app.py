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

    pdf_path = './temp_uploaded.pdf'
    public_key_path = './temp_pubkey.pem'

    pdf_file.save(pdf_path)
    public_key_file.save(public_key_path)

    is_valid, meta = pdf_handler.verifypdfsignature(pdf_path, public_key_path)

    os.remove(pdf_path)
    os.remove(public_key_path)

    return jsonify({
        'valid': is_valid,
        'metadata': meta if is_valid else None,
        'message': 'Verification ' + ('succeeded' if is_valid else 'failed')
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
