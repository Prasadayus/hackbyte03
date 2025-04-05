# Blind Bridge

## Overview

This project is dedicated to making education and quizzes accessible for blind users. The application leverages speech-to-text and text-to-speech technologies to allow users to log in, navigate through a dashboard, and participate in quizzes and assignments—all through voice commands and accessible keyboard navigation.

## Features

- **Accessible Login:**  
  - Users speak their username and password.
  - The application converts the audio input to text for authentication with the backend.

- **Dashboard Navigation:**  
  - Post-login, users are directed to a dashboard.
  - Navigation is made accessible through tab and arrow keys.
  - The interface provides audio cues to guide users to the quiz or assignment sections.

- **Interactive Quiz Mode:**  
  - **Text-to-Audio Conversion:**  
    Quiz questions are converted from text to audio using an AI model, ensuring blind users can easily listen to and understand the questions.
  - **Keyboard Navigation:**  
    Users can answer questions using tab and arrow keys for a seamless experience.
  
- **Assignment Submission:**  
  - The application supports converting Braille text to normal text to facilitate the submission of assignments.

## Tech Stack

- **Frontend:** Next.js
- **Backend:** Spring Boot and Flask
- **AI Integration:** Hugging Face and Grok
-  **postgreSQL:** Database

## Architecture

1. **Authentication:**  
   - The backend verifies user credentials obtained via speech-to-text conversion.
   - **JWT Token Integration:**  
     After successful login, a JWT token is generated and used for authenticating further requests, ensuring secure communication between the frontend and backend.

2. **Dashboard & Navigation:**  
   After login, the user is directed to a dashboard where they can choose between:
   - **Quiz Section:**  
     - Quiz questions are converted to audio.
     - Users navigate through questions using keyboard inputs.
   - **Assignment Section:**  
     - Braille text is converted to normal text for assignment submission.
     - Also there is an option for audio file submission.

3. **AI Model Integration:**  
   The application integrates models from Hugging Face for:
   - Converting speech to text (for login and answering).
   - Converting text to audio (for presenting quiz questions and other notifications).

## Getting Started

### Prerequisites

- **Node.js and yarn and npm** for Next.js.
- **Java and Maven** for Spring Boot.
- **Python and pip** for Flask.
- Access to **Hugging Face** models.
- **Grok** setup for any specialized data processing.
