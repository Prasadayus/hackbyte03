from flask import Flask, request, jsonify, send_file
import numpy as np
import soundfile as sf
import os
import tempfile
from fpdf import FPDF
from groq import Groq
from transformers import pipeline
from langchain_community.llms import HuggingFacePipeline
import werkzeug.utils

app = Flask(__name__)

# Initialize Groq client with your API key
groq_client = Groq(api_key="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")

# Initialize open-source speech-to-text model
asr_pipeline = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    device="cpu"
)
asr_llm = HuggingFacePipeline(pipeline=asr_pipeline)

def generate_pdf(text, filename="output.pdf"):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.multi_cell(0, 10, text)
    output_path = os.path.join(tempfile.gettempdir(), filename)
    pdf.output(output_path)
    return output_path

def enhance_with_groq(text):
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a transcription enhancer. Improve the grammar, punctuation and clarity while keeping the original meaning."
                },
                {
                    "role": "user",
                    "content": f"Please enhance this transcription:\n\n{text}"
                }
            ],
            model="llama3-70b-8192",
            temperature=0.3,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return jsonify({"error": f"Error enhancing transcription: {str(e)}"}), 500

def transcribe_audio(file_path):
    # Convert audio to text using the pipeline with chunking
    with open(file_path, "rb") as audio_file:
        result = asr_pipeline(
            audio_file.read(),
            chunk_length_s=30,  # Process in 30-second chunks
            stride_length_s=[6, 4],  # Overlap between chunks
            return_timestamps=False  # Don't return timestamps
        )
    return result["text"]

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Transcription API is running"}), 200

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        # Get the enhance parameter
        enhance = request.form.get('enhance', 'false').lower() == 'true'
        
        # Save uploaded file temporarily
        temp_path = os.path.join(tempfile.gettempdir(), werkzeug.utils.secure_filename(file.filename))
        file.save(temp_path)
        
        try:
            # Transcribe audio
            transcribed_text = transcribe_audio(temp_path)
            
            # Enhance transcription if requested
            if enhance:
                enhanced_text = enhance_with_groq(transcribed_text)
                if isinstance(enhanced_text, tuple):  # If error occurred in enhancement
                    return enhanced_text
                transcribed_text = enhanced_text
            
            # Generate PDF
            pdf_path = generate_pdf(transcribed_text, "transcription.pdf")
            
            # Return the transcription result
            return jsonify({
                "transcription": transcribed_text,
                "pdf_available": True
            }), 200
            
        except Exception as e:
            return jsonify({"error": f"Transcription error: {str(e)}"}), 500
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

@app.route('/api/download-pdf', methods=['GET'])
def download_pdf():
    pdf_path = os.path.join(tempfile.gettempdir(), "transcription.pdf")
    
    if os.path.exists(pdf_path):
        return send_file(pdf_path, as_attachment=True, download_name="transcription.pdf")
    else:
        return jsonify({"error": "PDF not found. Please transcribe audio first."}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)