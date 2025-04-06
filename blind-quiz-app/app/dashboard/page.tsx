"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const audioPlayingRef = useRef<boolean>(false); // Track if audio is currently playing
  const initialWelcomePlayedRef = useRef<boolean>(false); // Track if welcome message already played

  // Handle focus on elements to trigger audio
  const handleElementFocus = async (text: string) => {
    if (!text || audioPlayingRef.current) return; // Skip if audio is already playing
    
    try {
      // Set audio playing state to prevent overlapping audio
      audioPlayingRef.current = true;
      setActiveElement(text);
      
      // Get JWT token from localStorage
      const jwtToken = localStorage.getItem("jwtToken");
      
      if (!jwtToken) {
        console.warn("No JWT token found, authentication may fail");
      }
      
      // Create a text file from the input text
      const textBlob = new Blob([text], { type: 'text/plain' });
      
      // Create a file from the blob
      const textFile = new File([textBlob], 'input.txt', { type: 'text/plain' });
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', textFile);
      
      // Send text to the API with bearer token
      const response = await fetch("http://localhost:8080/api/uploadFile", {
        method: "POST",
        headers: {
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to get audio file");
      
      // Get audio blob from response
      const audioBlob = await response.blob();
      
      // Play the audio file
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Set up event handlers for the audio
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setActiveElement(null);
        audioPlayingRef.current = false; // Reset audio playing state when done
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setActiveElement(null);
        audioPlayingRef.current = false; // Reset audio playing state on error
      };
      
      await audio.play();
    } catch (err) {
      console.error("Error getting audio for element", err);
      toast({
        title: "Audio Error",
        description: "Could not load audio for this element",
        variant: "destructive",
      });
      audioPlayingRef.current = false; // Reset audio playing state on error
    }
  };

  useEffect(() => {
    // Handle focus change events
    const handleFocusChange = (e: FocusEvent) => {
      if (audioPlayingRef.current) return; // Skip if audio is already playing
      
      const target = e.target as HTMLElement;
      
      // Get text content based on element type
      let textContent = "";
      
      if (target.tagName === "BUTTON") {
        // For buttons, use aria-label if available, otherwise use text content
        textContent = target.getAttribute("aria-label") || target.textContent || "";
      } else if (target.tagName === "H1" || target.tagName === "H2") {
        // For headings, use text content
        textContent = target.textContent || "";
      } else if (target.classList.contains("card-interactive")) {
        // For cards or other interactive elements with this class
        const heading = target.querySelector("h2, h3")?.textContent;
        const description = target.querySelector("[class*='description']")?.textContent;
        textContent = heading ? (description ? `${heading}. ${description}` : heading) : "";
      }
      
      if (textContent) {
        handleElementFocus(textContent);
      }
    };

    // Add event listener for focus changes
    document.addEventListener("focusin", handleFocusChange);
    
    // Initial welcome message - only play once
    if (!initialWelcomePlayedRef.current) {
      initialWelcomePlayedRef.current = true; // Mark as played
      setTimeout(() => {
        if (!audioPlayingRef.current) { // Double-check audio isn't playing
          handleElementFocus(
            "Dashboard loaded. Use Tab to navigate. Options include taking a quiz, submitting an assignment, or viewing your profile."
          );
        }
      }, 500);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener("focusin", handleFocusChange);
    };
  }, []);

  // Reset initialWelcomePlayedRef when component unmounts
  useEffect(() => {
    return () => {
      initialWelcomePlayedRef.current = false;
    };
  }, []);

  return (
    <main className="container py-10 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-10" tabIndex={0}>
        Student Dashboard
      </h1>
      <Button
        size="lg"
        className="w-full max-w-xs h-14 text-lg group-hover:scale-105 transition"
        onClick={() => {
          console.log("Navigating to /dashboard/userprofile");
          router.push("/userprofile"); // Updated path
        }}
        aria-label="View your profile"
      >
        View Profile
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Quiz Card */}
        <Card className="group h-64 transition-transform transform hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold" tabIndex={0}>
              Take Quiz
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Start a new quiz assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-end h-full pb-6">
            <Button
              size="lg"
              className="w-full max-w-xs h-14 text-lg group-hover:scale-105 transition"
              onClick={() => router.push("/quiz")}
              aria-label="Take a new quiz"
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>

        {/* Assignment Card */}
        <Card className="group h-64 transition-transform transform hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold" tabIndex={0}>
              Submit Assignment
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload and submit your assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-end h-full pb-6">
            <Button
              size="lg"
              className="w-full max-w-xs h-14 text-lg group-hover:scale-105 transition"
              onClick={() => router.push("/assignment")}
              aria-label="Submit an assignment"
            >
              Upload Assignment
            </Button>
          </CardContent>
        </Card>

        {/* User Profile Card */}
        <Card className="group h-64 transition-transform transform hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold" tabIndex={0}>
              View Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Check your user profile details
            </CardDescription>
          </CardHeader>
          {/* <CardContent className="flex justify-center items-end h-full pb-6">
            
          </CardContent> */}
        </Card>
      </div>
    </main>
  );
}
