from flask import Flask, request, jsonify, send_file
from PyPDF2 import PdfReader
from gtts import gTTS
import io
from groq import Groq

app = Flask(__name__)

# Initialize Groq client
groq_client = Groq(api_key="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")

def enhance_text_for_audio(text):
    """Transform text for optimal audio listening without adding commentary"""
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an audio content transformer. Strictly transform the given text for better audio delivery by:\n"
                               "1. Improving flow for spoken word\n"
                               "2. Removing visual-only elements\n"
                               "3. Maintaining original meaning\n"
                               "4. NEVER adding any commentary about enhancement\n"
                               "5. NEVER mentioning that changes were made\n"
                               "6. Outputting ONLY the transformed content"
                },
                {
                    "role": "user",
                    "content": f"""Transform this text for audio delivery by making it flow better when spoken.\u00A0
                        Output ONLY the enhanced content without any additional commentary or explanations.
                        
                        Text to transform:\n\n{text}"""
                }
            ],
            model="llama3-70b-8192",
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        return {"error": f"Enhancement error: {str(e)}"}, text

def text_to_speech(text, lang='en'):
    """Convert text to speech with gTTS and return the audio data"""
    try:
        audio_io = io.BytesIO()
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.write_to_fp(audio_io)
        audio_io.seek(0)
        return audio_io
    except Exception as e:
        return {"error": f"Text-to-speech error: {str(e)}"}

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "PDF to Audio Converter API is running"})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/api/convert', methods=['POST'])
def convert_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "File must be a PDF"}), 400
    
    enhance = request.form.get('enhance', 'true').lower() == 'true'
    lang = request.form.get('language', 'en')
    
    try:
        pdf_file = io.BytesIO(file.read())
        reader = PdfReader(pdf_file)
        raw_text = " ".join([page.extract_text() or "" for page in reader.pages])
        
        if not raw_text.strip():
            return jsonify({"error": "No readable text found in this PDF"}), 400
        
        processed_text = raw_text
        
        if enhance:
            processed_text = enhance_text_for_audio(raw_text)
            if isinstance(processed_text, tuple):
                return jsonify(processed_text[0]), 500
        
        audio_data = text_to_speech(processed_text, lang=lang)
        if isinstance(audio_data, dict) and "error" in audio_data:
            return jsonify(audio_data), 500
        
        return send_file(
            audio_data,
            mimetype="audio/mpeg",
            as_attachment=True,
            download_name="converted_audio.mp3"
        )
    
    except Exception as e:
        return jsonify({"error": f"Processing error: {str(e)}"}), 500

@app.route('/api/extract-text', methods=['POST'])
def extract_text():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "File must be a PDF"}), 400
    
    try:
        pdf_file = io.BytesIO(file.read())
        reader = PdfReader(pdf_file)
        raw_text = " ".join([page.extract_text() or "" for page in reader.pages])
        
        if not raw_text.strip():
            return jsonify({"error": "No readable text found in this PDF"}), 400
        
        return jsonify({
            "success": True,
            "text_length": len(raw_text),
            "text": raw_text
        })
    
    except Exception as e:
        return jsonify({"error": f"Text extraction error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)