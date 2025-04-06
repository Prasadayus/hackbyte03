from flask import Flask, request, jsonify, send_file, make_response
import os
import tempfile
from fpdf import FPDF
import io

app = Flask(__name__)

# Braille mapping
braille_dict = {
    '⠁': 'a', '⠃': 'b', '⠉': 'c', '⠙': 'd', '⠑': 'e', '⠋': 'f', '⠛': 'g', '⠓': 'h',
    '⠊': 'i', '⠚': 'j', '⠅': 'k', '⠇': 'l', '⠍': 'm', '⠝': 'n', '⠕': 'o', '⠏': 'p',
    '⠟': 'q', '⠗': 'r', '⠎': 's', '⠞': 't', '⠥': 'u', '⠧': 'v', '⠺': 'w', '⠭': 'x',
    '⠽': 'y', '⠵': 'z', ' ': ' ',
    '⠼⠁': '1', '⠼⠃': '2', '⠼⠉': '3', '⠼⠙': '4', '⠼⠑': '5', '⠼⠋': '6',
    '⠼⠛': '7', '⠼⠓': '8', '⠼⠊': '9', '⠼⠚': '0',
    '⠂': ',', '⠆': ';', '⠒': ':', '⠖': '!', '⠄': '.', '⠦': '?', '⠶': '"',
    '⠐': '-', '⠤': '—', '⠌': '/', '⠣': '(', '⠜': ')', '⠈': "'", '⠫': '*',
    '⠻': '@', '⠮': '#', '⠿': '%', '⠷': '[', '⠾': ']', '⠩': '&'
}

def braille_to_text(braille_input):
    output = ""
    i = 0
    while i < len(braille_input):
        if i + 1 < len(braille_input) and braille_input[i:i+2] == '⠼':
            # Handle number indicator
            if i + 2 < len(braille_input) and braille_input[i:i+3] in braille_dict:
                output += braille_dict[braille_input[i:i+3]]
                i += 3
            else:
                output += braille_dict.get(braille_input[i], '?')
                i += 1
        else:
            output += braille_dict.get(braille_input[i], '?')
            i += 1
    return output

def generate_pdf_bytes(text):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.multi_cell(0, 10, text)
    
    # Instead of saving to file, return the PDF as bytes
    return pdf.output(dest='S').encode('latin1')

@app.route('/')
def home():
    return """
    <h1>Braille to Text Converter API</h1>
    <p>Use POST /convert to convert braille to text</p>
    <p>Use POST /convert-pdf to convert braille to text and get a PDF</p>
    """

@app.route('/convert', methods=['POST'])
def convert():
    data = request.json
    
    if not data or 'braille' not in data:
        return jsonify({"error": "Missing 'braille' field in request"}), 400
    
    braille_input = data['braille']
    converted_text = braille_to_text(braille_input)
    
    return jsonify({
        "braille": braille_input,
        "text": converted_text
    })

@app.route('/convert-pdf', methods=['POST'])
def convert_pdf():
    try:
        data = request.json
        
        if not data or 'braille' not in data:
            return jsonify({"error": "Missing 'braille' field in request"}), 400
        
        braille_input = data['braille']
        converted_text = braille_to_text(braille_input)
        
        # Generate PDF as bytes
        pdf_bytes = generate_pdf_bytes(converted_text)
        
        # Create response with PDF attachment
        response = make_response(pdf_bytes)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = 'attachment; filename=braille_text.pdf'
        
        return response
    
    except Exception as e:
        app.logger.error(f"Error in convert_pdf: {str(e)}")
        return jsonify({"error": f"Failed to generate PDF: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)