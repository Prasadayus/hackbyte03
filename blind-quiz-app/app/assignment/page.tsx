"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mic, StopCircle, Trash } from "lucide-react"
import { motion } from "framer-motion"

function AssignmentPage() {
  const [textInput, setTextInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleElementFocus = async (text: string) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      
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
  
      if (!response.ok) throw new Error(`API error: ${response.status}`);
  
      // Instead of parsing as JSON, get the response as a blob
      const audioBlob = await response.blob();
      
      // Create an object URL from the blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } catch (error) {
      console.error("Error fetching speech:", error);
    }
  } 

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      let audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data)
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      handleElementFocus("Recording started")
    } catch (err) {
      console.error("Microphone access error:", err)
      toast({
        title: "Microphone Required",
        description: "Please enable microphone access to record",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      handleElementFocus("Recording stopped")
    }
  }

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput && !audioBlob) return
  
    setIsSubmitting(true)
    try {
      console.log("textInput=", textInput);
      
      // Get JWT token
      const jwtToken = localStorage.getItem("jwtToken");
      
      // Send text input to assignment API
      const response = await fetch("http://localhost:8080/api/assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
        },
        body: JSON.stringify({ braille: textInput })
      });
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Log response data if needed
      const data = await response.json();
      console.log("Assignment submission response:", data);
  
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been successfully submitted",
      })
  
      handleElementFocus("Assignment submitted. Redirecting to dashboard.")
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const handleFocusChange = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      let message = ""

      if (target.tagName === "TEXTAREA") {
        message = "Text input for assignment"
      } else if (target.tagName === "BUTTON") {
        message = target.getAttribute("aria-label") || target.textContent || ""
      }

      if (message) handleElementFocus(message)
    }

    document.addEventListener("focusin", handleFocusChange)
    handleElementFocus("Assignment page loaded. Enter text or record audio.")

    return () => document.removeEventListener("focusin", handleFocusChange)
  }, [])

  return (
    <main className="container flex items-center justify-center min-h-screen px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <Card className="rounded-3xl shadow-xl border bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-center font-bold" tabIndex={0}>
              Submit Assignment
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmitAssignment} className="space-y-6">
              {/* Text Input */}
              <div className="space-y-2">
                <Label htmlFor="assignment-text">Assignment Text</Label>
                <textarea
                  id="assignment-text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full min-h-[140px] p-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Type your assignment here..."
                  aria-label="Assignment text input"
                />
              </div>

              {/* Audio Section */}
              <div className="space-y-2">
                <Label>Audio Recording</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={isRecording ? stopRecording : startRecording}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                  >
                    {isRecording ? <StopCircle className="mr-2 w-4 h-4" /> : <Mic className="mr-2 w-4 h-4" />}
                    {isRecording ? "Stop" : "Record"}
                  </Button>

                  {audioBlob && (
                    <div className="flex items-center gap-3">
                      <audio
                        controls
                        src={URL.createObjectURL(audioBlob)}
                        className="h-10"
                        aria-label="Recorded audio playback"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setAudioBlob(null)}
                        aria-label="Delete recording"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push("/dashboard")}
              aria-label="Cancel and return to dashboard"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAssignment}
              disabled={isSubmitting || (!textInput && !audioBlob)}
              className="w-full sm:w-auto"
              aria-label="Submit assignment"
            >
              {isSubmitting ? "Submitting..." : "Submit Assignment"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  )
}

export default AssignmentPage
