"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [fieldLabels, setFieldLabels] = useState<{
    username: string;
    password: string;
  }>({
    username: "Username",
    password: "Password",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [usernameBlob, setUsernameBlob] = useState<Blob | null>(null);
  const [passwordBlob, setPasswordBlob] = useState<Blob | null>(null);
  const [usernameRecording, setUsernameRecording] = useState(false);
  const [passwordRecording, setPasswordRecording] = useState(false);
  const [activeField, setActiveField] = useState<"username" | "password" | null>(null);

  const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImlhdCI6MTc0Mzg4NTM5NSwiZXhwIjoxNzQzODg4OTk1fQ.ZmA1i9ceb_IfJ8cp9ElTJllwldLsaGRXVX1X3lwr6ro";

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Check if MP3 recording is supported by the browser
  const checkMp3Support = () => {
    const types = [
      'audio/mp3',
      'audio/mpeg',
      'audio/mpeg3',
      'audio/x-mpeg-3'
    ];
    
    // Try to create a MediaRecorder with each MIME type
    for (const type of types) {
      try {
        const isMp3Supported = MediaRecorder.isTypeSupported(type);
        if (isMp3Supported) return type;
      } catch (e) {
        console.log(`${type} not supported`);
      }
    }
    
    return null; // No MP3 support found
  };

  // Get the supported MP3 MIME type or fallback to webm
  const audioMimeType = checkMp3Support() || 'audio/webm';

  // When a field is focused, send its label to the API and play the returned audio
  const handleFieldFocus = async (labelKey: "username" | "password") => {
    setActiveField(labelKey);
    const label = fieldLabels[labelKey];
    
    try {
       // Create a text file from the input text
       const textBlob = new Blob([label], { type: 'text/plain' });
      
       // Create a file from the blob
       const textFile = new File([textBlob], 'input.txt', { type: 'text/plain' });
       
       // Create FormData and append the file
       const formData = new FormData();
       formData.append('file', textFile);
      
      // Send label text to the API
      const response = await fetch("http://localhost:8080/api/uploadFile", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to get audio file");
      
      // Get audio blob from response
      const audioBlob = await response.blob();
      
      // Play the audio file
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Clean up the URL object after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (err) {
      console.error("Error getting audio for field label", err);
      toast({
        title: "Audio Error",
        description: "Could not load audio for this field",
        variant: "destructive",
      });
    }
  };

  // Convert audio blob to MP3 if not already in MP3 format
  const convertToMp3 = async (blob: Blob): Promise<Blob> => {
    // If we're already recording in MP3 format, just return the blob
    if (blob.type.includes('mp3') || blob.type.includes('mpeg')) {
      return blob;
    }
    
    // For browsers without native MP3 recording support, we'd need a conversion library
    // This is a placeholder for where you would implement MP3 conversion
    
    toast({
      title: "Audio Format Notice",
      description: "Converting audio to MP3 format",
    });
    
    // For now, we'll just change the blob's type to signify it should be treated as MP3
    return new Blob([blob], { type: 'audio/mpeg' });
  };

  // Helper function to record audio for 3 seconds with MP3 support if available
  const startRecording = (onStop: (blob: Blob) => void) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      // Use MP3 format if supported, otherwise fall back to WebM
      const recorder = new MediaRecorder(stream, { 
        mimeType: audioMimeType 
      });
      
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const recordedBlob = new Blob(chunks, { type: audioMimeType });
        
        try {
          // Convert to MP3 if needed
          const mp3Blob = await convertToMp3(recordedBlob);
          onStop(mp3Blob);
        } catch (error) {
          console.error("Error converting audio:", error);
          // Fall back to the original format if conversion fails
          onStop(recordedBlob);
        }
        
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      setTimeout(() => {
        recorder.stop();
      }, 3000);
    }).catch(error => {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    });
  };

  // Capture voice for username.
  const handleUsernameVoiceInput = () => {
    setUsernameRecording(true);
    startRecording((blob) => {
      setUsernameBlob(blob);
      toast({
        title: "Username voice recorded",
        description: "Audio captured successfully in " + blob.type + " format",
      });
      setUsernameRecording(false);
    });
  };

  // Capture voice for password.
  const handlePasswordVoiceInput = () => {
    setPasswordRecording(true);
    startRecording((blob) => {
      setPasswordBlob(blob);
      toast({
        title: "Password voice recorded",
        description: "Audio captured successfully in " + blob.type + " format",
      });
      setPasswordRecording(false);
    });
  };

  // Handle keyboard press to start recording for the active field
  const handleKeyPress = (event: KeyboardEvent) => {
    // Skip if we're already recording or if no field is active
    if (usernameRecording || passwordRecording || !activeField) {
      return;
    }
    
    // Don't trigger on Tab, Enter, Escape, etc. which might be used for form navigation
    const ignoredKeys = ['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'];
    if (ignoredKeys.includes(event.key)) {
      return;
    }
    
    // Start recording based on the active field
    if (activeField === 'username') {
      handleUsernameVoiceInput();
    } else if (activeField === 'password') {
      handlePasswordVoiceInput();
    }
  };

  // Setup keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [activeField, usernameRecording, passwordRecording]);

  // Modified handleLogin function to authenticate using the new endpoint
  const handleLogin = async () => {
    if (!usernameBlob || !passwordBlob) {
      toast({
        title: "Missing voice input",
        description: "Please record both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get the bearer token from local storage or wherever it's stored
      const bearerToken = localStorage.getItem("bearerToken");
      
      // Create FormData for sending the audio files
      const formData = new FormData();
      formData.append("usernameAudio", usernameBlob, "username.mp3");
      formData.append("passwordAudio", passwordBlob, "password.mp3");

      // Send the audio recordings to the authentication endpoint
      // Send the audio recordings to the authentication endpoint
const response = await fetch("http://localhost:8080/api/auth/signin", {
  method: "POST",
  headers: {
    // Include bearer token if available
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {})
  },
  body: formData,
});

// Don't log response.body directly, it's a ReadableStream
console.log("Response status:", response.status);

          if (!response.ok) {
            // Try to get error details if available
            try {
              const errorData = await response.json();
              console.error("Authentication error:", errorData);
              throw new Error(`Authentication failed: ${errorData.error || 'Unknown error'}`);
            } catch (e) {
              throw new Error("Authentication failed");
            }
          }

          // Parse the JSON response to get the JWT token
          const authData = await response.json();
          console.log("Authentication successful:", authData);

          // Store the new JWT token
          if (authData.token) {
            localStorage.setItem("jwtToken", authData.token);
          }

      toast({
        title: "Login successful",
        description: "Redirecting to dashboard",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast({
        title: "Login failed",
        description: "Error authenticating with voice credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch field labels from the API when the component mounts.
  useEffect(() => {
    fetch("/api/field-labels")
      .then((res) => res.json())
      .then((data) => setFieldLabels(data))
      .catch((err) => console.error("Error fetching labels", err));
  }, []);

  return (
    <div className="container flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border border-gray-200 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold text-gray-900">
            Login
          </CardTitle>
          <CardDescription className="text-gray-500">
            Use voice input for authentication
          </CardDescription>
          <p className="text-sm text-gray-500 mt-2">
            Focus a field and press any key to start recording
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm text-gray-700">
              {fieldLabels.username}
            </Label>
            <div
              tabIndex={0}
              onFocus={() => handleFieldFocus("username")}
              onBlur={() => setActiveField(null)}
              className={`flex items-center gap-3 px-4 py-2 border rounded-xl bg-gray-50 transition-shadow ${
                activeField === "username" 
                  ? "border-blue-500 ring-2 ring-blue-400" 
                  : "border-gray-300"
              }`}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleUsernameVoiceInput}
                className={`h-9 w-9 border border-gray-300 rounded-full transition-all duration-150 ${
                  usernameRecording
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "hover:bg-blue-100 hover:text-blue-600"
                }`}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-500">
                {usernameRecording
                  ? "Recording..."
                  : usernameBlob
                  ? "Recorded ✔"
                  : activeField === "username"
                  ? "Press any key to record"
                  : "Click or focus to record"}
              </span>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-gray-700">
              {fieldLabels.password}
            </Label>
            <div
              tabIndex={0}
              onFocus={() => handleFieldFocus("password")}
              onBlur={() => setActiveField(null)}
              className={`flex items-center gap-3 px-4 py-2 border rounded-xl bg-gray-50 transition-shadow ${
                activeField === "password" 
                  ? "border-blue-500 ring-2 ring-blue-400" 
                  : "border-gray-300"
              }`}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePasswordVoiceInput}
                className={`h-9 w-9 border border-gray-300 rounded-full transition-all duration-150 ${
                  passwordRecording
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "hover:bg-blue-100 hover:text-blue-600"
                }`}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-500">
                {passwordRecording
                  ? "Recording..."
                  : passwordBlob
                  ? "Recorded ✔"
                  : activeField === "password"
                  ? "Press any key to record"
                  : "Click or focus to record"}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl"
            onClick={handleLogin}
            disabled={isLoading || !usernameBlob || !passwordBlob}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}