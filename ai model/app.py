import streamlit as st
import pyttsx3
import PyPDF2
import os
import numpy as np
import tensorflow as tf
from transformers import BertTokenizer, TFBertModel
from sklearn.cluster import KMeans
import re
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
import threading
import time

# Initialize session state for controlling speech
if 'speaking' not in st.session_state:
    st.session_state.speaking = False
if 'stop_requested' not in st.session_state:
    st.session_state.stop_requested = False
if 'speech_thread' not in st.session_state:
    st.session_state.speech_thread = None

# Download NLTK resources
try:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('punkt_tab')  # Try the problematic resource too
except Exception as e:
    st.warning(f"NLTK resource download issue: {e}. Continuing with available resources.")

class PDFToSpeechConverter:
    def __init__(self, voice_rate=180, voice_volume=0.8):
        """
        Initialize the PDF to Speech converter with customizable voice settings
        
        Args:
            voice_rate (int): Speaking rate (words per minute)
            voice_volume (float): Volume from 0.0 to 1.0
        """
        # Initialize TTS engine
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', voice_rate)
        self.engine.setProperty('volume', voice_volume)
        
        # Get available voices and set a default
        voices = self.engine.getProperty('voices')
        self.engine.setProperty('voice', voices[0].id)  # Default voice (usually male)
        self.available_voices = voices
        
        # Initialize BERT for semantic understanding if TF and transformers are available
        try:
            self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
            self.model = TFBertModel.from_pretrained('bert-base-uncased')
            self.bert_available = True
        except Exception as e:
            st.warning(f"BERT model initialization failed: {e}. Running with limited features.")
            self.bert_available = False
        
        # Track reading state
        self.current_position = 0
        self.current_text = ""
        self.is_paused = False
        
    def set_voice(self, voice_index=0):
        """Set the voice by index"""
        if 0 <= voice_index < len(self.available_voices):
            self.engine.setProperty('voice', self.available_voices[voice_index].id)
            return True
        return False
    
    def extract_text_from_pdf(self, pdf_file):
        """Extract text from PDF file"""
        try:
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            
            # Extract text from each page
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n"
            
            # Clean up text
            text = self._clean_text(text)
            return text
        except Exception as e:
            st.error(f"Error extracting text from PDF: {e}")
            return None
    
    def _clean_text(self, text):
        """Clean and normalize text"""
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        
        # Replace common PDF artifacts
        text = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', text)  # Fix hyphenated words
        
        # Clean up other common issues
        text = text.replace('\n', ' ').strip()
        return text
    
    def _detect_document_structure(self, text):
        """
        Detect document structure (headings, paragraphs, etc.)
        Returns a list of (text_segment, segment_type) tuples
        """
        # Split into sentences with error handling for punkt_tab
        try:
            sentences = sent_tokenize(text)
        except LookupError as e:
            if 'punkt_tab' in str(e):
                # Try to download the correct resource
                nltk.download('punkt')
                try:
                    sentences = sent_tokenize(text)
                except:
                    # If that fails, use a simple sentence splitter
                    st.warning("NLTK sentence tokenizer not available. Using simple split.")
                    sentences = [s.strip() + '.' for s in text.split('.') if s.strip()]
            else:
                # Use simple split
                sentences = [s.strip() + '.' for s in text.split('.') if s.strip()]
        
        # Identify potential headings (short sentences with distinct features)
        structured_segments = []
        
        for i, sentence in enumerate(sentences):
            # Simple heuristics for heading detection
            is_heading = (len(sentence) < 100 and 
                         (sentence.isupper() or 
                          all(w[0].isupper() for w in sentence.split() if len(w) > 1) or
                          re.match(r'^[0-9]+\.', sentence.strip())))
            
            if is_heading:
                structured_segments.append((sentence, "heading"))
            else:
                # Group consecutive non-heading sentences into paragraphs
                if (structured_segments and 
                    structured_segments[-1][1] == "paragraph" and
                    i > 0 and not (len(sentences[i-1]) < 100 and sentences[i-1].isupper())):
                    structured_segments[-1] = (structured_segments[-1][0] + " " + sentence, "paragraph")
                else:
                    structured_segments.append((sentence, "paragraph"))
        
        return structured_segments
    
    def _generate_embeddings(self, text_segments):
        """Generate BERT embeddings for text segments"""
        if not self.bert_available:
            # Return dummy embeddings if BERT is not available
            return np.ones((len(text_segments), 768))
            
        embeddings = []
        
        for text, _ in text_segments:
            # Tokenize and get BERT embeddings
            inputs = self.tokenizer(text, return_tensors="tf", 
                                   padding=True, truncation=True, max_length=512)
            outputs = self.model(inputs)
            # Use the [CLS] token embedding as the sentence embedding
            embedding = outputs.last_hidden_state[:, 0, :].numpy()
            embeddings.append(embedding[0])
            
        return np.array(embeddings)
    
    def _identify_important_sections(self, text_segments, n_clusters=5):
        """
        Identify important sections using clustering
        Returns importance scores for each segment
        """
        if len(text_segments) < n_clusters or not self.bert_available:
            # Not enough segments for meaningful clustering or BERT not available
            return [1.0] * len(text_segments)
            
        # Generate embeddings
        embeddings = self._generate_embeddings(text_segments)
        
        # Apply K-means clustering
        kmeans = KMeans(n_clusters=min(n_clusters, len(embeddings)))
        clusters = kmeans.fit_predict(embeddings)
        
        # Calculate distance to cluster centers
        distances = np.zeros(len(embeddings))
        for i, embedding in enumerate(embeddings):
            distances[i] = np.linalg.norm(embedding - kmeans.cluster_centers_[clusters[i]])
        
        # Normalize distances to get importance scores (closer = more important)
        max_dist = np.max(distances) if np.max(distances) > 0 else 1
        importance = 1 - (distances / max_dist)
        
        return importance.tolist()
    
    def prepare_text_for_tts(self, text):
        """Prepare text for TTS by adding appropriate pauses and emphasis"""
        # Detect document structure
        structured_segments = self._detect_document_structure(text)
        
        # Identify important sections
        importance_scores = self._identify_important_sections(structured_segments)
        
        # Prepare text with appropriate SSML or pause indicators
        prepared_text = ""
        for i, ((segment, segment_type), importance) in enumerate(zip(structured_segments, importance_scores)):
            if segment_type == "heading":
                # Add pause before heading and speak with emphasis
                prepared_text += f"\n\n{segment}.\n"
            else:
                prepared_text += f"{segment} "
        
        self.current_text = prepared_text
        return prepared_text
    
    def read_pdf(self, pdf_file, start_from_beginning=True):
        """Read a PDF file aloud"""
        # Extract text
        text = self.extract_text_from_pdf(pdf_file)
        if not text:
            return "Error extracting text from the PDF file."
        
        # Prepare text for TTS
        prepared_text = self.prepare_text_for_tts(text)
        
        # Reset position if starting from beginning
        if start_from_beginning:
            self.current_position = 0
        
        # Return the prepared text
        return prepared_text
    
    def speak_text(self, text, check_stop_flag=None):
        """
        Speak the given text
        
        Args:
            text: Text to speak
            check_stop_flag: Function that returns True if speech should stop
        """
        if check_stop_flag is None:
            # Simple version without stop functionality
            self.engine.say(text)
            self.engine.runAndWait()
        else:
            # Split text into smaller chunks for better stop responsiveness
            sentences = []
            try:
                sentences = sent_tokenize(text)
            except:
                sentences = [s.strip() + '.' for s in text.split('.') if s.strip()]
            
            # Speak each sentence, checking for stop between them
            for sentence in sentences:
                if check_stop_flag():
                    self.engine.stop()
                    break
                self.engine.say(sentence)
                self.engine.runAndWait()
    
    def stop(self):
        """Stop reading completely"""
        self.engine.stop()
        self.is_paused = False
        self.current_position = 0

# Function to run speech in a separate thread
def speak_in_thread(converter, text):
    def check_stop():
        return st.session_state.stop_requested
    
    st.session_state.speaking = True
    st.session_state.stop_requested = False
    
    converter.speak_text(text, check_stop)
    
    st.session_state.speaking = False
    st.session_state.stop_requested = False

# Streamlit UI
def main():
    st.title("PDF to Speech Converter")
    st.write("Upload a PDF file to convert it to speech")
    
    # File uploader for PDF
    uploaded_file = st.file_uploader("Choose a PDF file", type="pdf")
    
    # Voice settings
    col1, col2 = st.columns(2)
    with col1:
        voice_rate = st.slider("Speech Rate", min_value=100, max_value=300, value=180, step=10)
    with col2:
        voice_volume = st.slider("Volume", min_value=0.0, max_value=1.0, value=0.8, step=0.1)
    
    # Initialize converter
    converter = PDFToSpeechConverter(voice_rate, voice_volume)
    
    # Voice selection (if available)
    if len(converter.available_voices) > 1:
        voice_options = [f"Voice {i+1}" for i in range(len(converter.available_voices))]
        selected_voice = st.selectbox("Select Voice", voice_options)
        voice_index = voice_options.index(selected_voice)
        converter.set_voice(voice_index)
    
    # Process PDF when uploaded
    if uploaded_file is not None:
        st.write("PDF uploaded successfully!")
        
        # Extract text button
        if st.button("Extract Text"):
            with st.spinner("Extracting text from PDF..."):
                text = converter.extract_text_from_pdf(uploaded_file)
                if text:
                    st.session_state.extracted_text = text
                    st.success("Text extracted successfully!")
                    st.text_area("Extracted Text", value=text[:1000] + "..." if len(text) > 1000 else text, height=200)
        
        # Read aloud button
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Read Aloud", key="read_button", disabled=st.session_state.speaking):
                with st.spinner("Preparing speech..."):
                    # Reset the file pointer position
                    uploaded_file.seek(0)
                    
                    # Get text to speak
                    prepared_text = converter.read_pdf(uploaded_file)
                    
                    if prepared_text:
                        # Start speaking in a separate thread
                        st.session_state.speech_thread = threading.Thread(
                            target=speak_in_thread, 
                            args=(converter, prepared_text)
                        )
                        st.session_state.speech_thread.start()
                        st.experimental_rerun()  # Rerun to update UI
        
        with col2:
            if st.button("Stop Reading", key="stop_button", disabled=not st.session_state.speaking):
                st.session_state.stop_requested = True
                st.success("Stopping speech...")
                time.sleep(0.5)  # Short delay to allow thread to respond
                st.experimental_rerun()  # Rerun to update UI
        
        # Display speech status
        if st.session_state.speaking:
            st.warning("Speaking... (Click 'Stop Reading' to stop)")

if __name__ == "__main__":
    main()