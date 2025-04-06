'use client'
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Replace with your actual auth token or fetch it from secure storage
  const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImlhdCI6MTc0Mzg4MTQxOSwiZXhwIjoxNzQzODg1MDE5fQ.bTrKSePauxu0TBfuC-38sQaCo_6u0K-POzNimB_eiaQ";
  
  // Function to handle key events globally
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Check if Tab key was pressed
      if (event.key === 'Tab') {
        // Give browser time to update focus
        setTimeout(() => {
          // Get the currently focused element
          const focusedElement = document.activeElement;
          
          // Get the text content of the focused element
          let textToSpeak = '';
          
          if (focusedElement) {
            // Get the accessible name (aria-label first, then text content)
            textToSpeak = focusedElement.getAttribute('aria-label') || 
                          focusedElement.textContent || 
                          '';
            
            // If it's a button or link without text, try to get its description
            if (!textToSpeak && (focusedElement.tagName === 'BUTTON' || focusedElement.tagName === 'A')) {
              const describedBy = focusedElement.getAttribute('aria-describedby');
              if (describedBy) {
                const descElement = document.getElementById(describedBy);
                if (descElement) {
                  textToSpeak = descElement.textContent || "";
                }
              }
            }
            
            // Clean up the text
            textToSpeak = textToSpeak.trim();
            
            if (textToSpeak) {
              fetchAndPlayAudio(textToSpeak);
            }
          }
        }, 10); // Small delay to ensure focus has updated
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Function to fetch audio from backend and play it
  const fetchAndPlayAudio = async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a text file from the input text
      const textBlob = new Blob([text], { type: 'text/plain' });
      
      // Create a file from the blob
      const textFile = new File([textBlob], 'input.txt', { type: 'text/plain' });
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', textFile);
      
      // Send the request with FormData and authorization header
      const response = await fetch('http://localhost:8080/api/uploadFile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: formData, // No need to set Content-Type header, browser sets it automatically with boundary
      });
      
      if (!response.ok) {
        throw new Error('Server error: ' + response.statusText);
      }
      
      // Get the audio data as array buffer
      const audioData = await response.arrayBuffer();
      
      // Convert array buffer to blob
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      
      // Create a URL for the blob
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl); // Clean up previous URL
      }
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      // Set the audio source and play
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(e => {
          console.error("Error playing audio:", e);
        });
      }
    } catch (error: any) {
      console.error('Error converting text to speech:', error);
      setError('Failed to convert text to speech. ' + (error?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Accessible Quiz App</CardTitle>
          <CardDescription className="text-center">
            An interactive quiz application designed for blind users
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="h-12 text-lg" aria-label="Login to your account">
            <Link href="/login">Login to your account</Link>
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Press Tab to navigate and Enter to select
          </div>
          {isLoading && (
            <div className="text-center text-sm">Loading audio...</div>
          )}
          {error && (
            <div className="text-center text-sm text-red-500">{error}</div>
          )}
        </CardContent>
      </Card>
      
      {/* Hidden audio element for playing the speech */}
      <audio 
        ref={audioRef} 
        style={{ display: 'none' }}
        onEnded={() => {
          // Optionally handle audio end event
        }}
      />
    </div>
  );
}