// "use client"

// import { useState, useEffect, useRef } from "react"
// import { Button } from "@/components/ui/button"
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Label } from "@/components/ui/label"
// import { useRouter } from "next/navigation"
// import { useToast } from "@/hooks/use-toast"
// import { Progress } from "@/components/ui/progress"

// const quizQuestions = [
//   {
//     id: 1,
//     question: "What is the capital of France?",
//     options: ["London", "Berlin", "Paris", "Madrid"],
//     correctAnswer: "Paris",
//   },
//   {
//     id: 2,
//     question: "Which planet is known as the Red Planet?",
//     options: ["Earth", "Mars", "Jupiter", "Venus"],
//     correctAnswer: "Mars",
//   },
//   {
//     id: 3,
//     question: "What is the largest mammal?",
//     options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
//     correctAnswer: "Blue Whale",
//   },
// ]

// export default function QuizPage() {
//   const [currentQuestion, setCurrentQuestion] = useState(0)
//   const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
//     Array(quizQuestions.length).fill(""),
//   )
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const audioRef = useRef<HTMLAudioElement | null>(null)
//   const router = useRouter()
//   const { toast } = useToast()

//   const handleElementFocus = async (text: string) => {
//     try {
//       const response = await fetch("/api/text-to-speech", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text }),
//       })
//       if (!response.ok) throw new Error(`API error: ${response.status}`)
//       const data = await response.json()
//       if (data.audioUrl) {
//         if (!audioRef.current) audioRef.current = new Audio()
//         audioRef.current.src = data.audioUrl
//         audioRef.current.play()
//       }
//     } catch (error) {
//       console.error("Speech error:", error)
//     }
//   }

//   const handleAnswerSelect = (answer: string) => {
//     const updatedAnswers = [...selectedAnswers]
//     updatedAnswers[currentQuestion] = answer
//     setSelectedAnswers(updatedAnswers)
//   }

//   const handleNextQuestion = () => {
//     if (currentQuestion < quizQuestions.length - 1) {
//       setCurrentQuestion(currentQuestion + 1)
//     }
//   }

//   const handlePreviousQuestion = () => {
//     if (currentQuestion > 0) {
//       setCurrentQuestion(currentQuestion - 1)
//     }
//   }

//   const handleSubmitQuiz = async () => {
//     setIsSubmitting(true)
//     try {
//       await new Promise((r) => setTimeout(r, 1500))
//       const score = selectedAnswers.reduce((acc, ans, i) => {
//         return ans === quizQuestions[i].correctAnswer ? acc + 1 : acc
//       }, 0)
//       toast({
//         title: "Quiz Submitted",
//         description: `Your score: ${score}/${quizQuestions.length}`,
//       })
//       handleElementFocus(
//         `Quiz submitted. Your score is ${score} out of ${quizQuestions.length}.`,
//       )
//       setTimeout(() => router.push("/dashboard"), 3000)
//     } catch (error) {
//       toast({
//         title: "Submission Failed",
//         description: "Please try again",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   useEffect(() => {
//     const handleFocusChange = (e: FocusEvent) => {
//       const target = e.target as HTMLElement
//       if (["BUTTON", "LABEL", "H2"].includes(target.tagName)) {
//         handleElementFocus(target.textContent || "")
//       }
//     }

//     document.addEventListener("focusin", handleFocusChange)
//     const question = quizQuestions[currentQuestion]
//     handleElementFocus(
//       `Question ${currentQuestion + 1}: ${question.question}. Options: ${question.options.join(
//         ", ",
//       )}`,
//     )

//     return () => {
//       document.removeEventListener("focusin", handleFocusChange)
//     }
//   }, [currentQuestion])

//   const question = quizQuestions[currentQuestion]
//   const progressPercent = ((currentQuestion + 1) / quizQuestions.length) * 100

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-10">
//       <Card className="w-full max-w-2xl shadow-xl">
//         <CardHeader className="pb-2">
//           <CardTitle
//             className="text-center text-xl md:text-2xl font-bold"
//             tabIndex={0}
//           >
//             Question {currentQuestion + 1} of {quizQuestions.length}
//           </CardTitle>
//           <Progress value={progressPercent} className="mt-4" />
//         </CardHeader>

//         <CardContent className="space-y-6">
//           <h2
//             className="text-lg md:text-xl font-semibold"
//             tabIndex={0}
//             aria-live="polite"
//           >
//             {question.question}
//           </h2>

//           <RadioGroup
//             value={selectedAnswers[currentQuestion]}
//             onValueChange={handleAnswerSelect}
//             className="space-y-3"
//           >
//             {question.options.map((option, index) => (
//               <Label
//                 key={index}
//                 htmlFor={`option-${index}`}
//                 className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${
//                   selectedAnswers[currentQuestion] === option
//                     ? "bg-primary/10 border-primary"
//                     : "hover:bg-accent"
//                 }`}
//               >
//                 <RadioGroupItem
//                   value={option}
//                   id={`option-${index}`}
//                   className="peer"
//                   aria-label={option}
//                 />
//                 {option}
//               </Label>
//             ))}
//           </RadioGroup>
//         </CardContent>

//         <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-6 border-t">
//           <div className="flex gap-2 w-full sm:w-auto">
//             <Button
//               variant="outline"
//               onClick={handlePreviousQuestion}
//               disabled={currentQuestion === 0}
//               aria-label="Previous question"
//               className="w-full sm:w-auto"
//             >
//               Previous
//             </Button>
//             <Button
//               variant="outline"
//               onClick={handleNextQuestion}
//               disabled={currentQuestion === quizQuestions.length - 1}
//               aria-label="Next question"
//               className="w-full sm:w-auto"
//             >
//               Next
//             </Button>
//           </div>

//           <Button
//             onClick={handleSubmitQuiz}
//             disabled={
//               isSubmitting || selectedAnswers.includes("")
//             }
//             aria-label="Submit quiz"
//             className="w-full sm:w-auto"
//           >
//             {isSubmitting ? "Submitting..." : "Submit Quiz"}
//           </Button>
//         </CardFooter>
//       </Card>
//     </div>
//   )
// }

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

const quizQuestions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    correctAnswer: "Mars",
  },
  {
    id: 3,
    question: "What is the largest mammal?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswer: "Blue Whale",
  },
]

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    Array(quizQuestions.length).fill(""),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeElement, setActiveElement] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleElementFocus = async (text: string) => {
    if (!text) return;
    setActiveElement(text);
    
    try {
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
      audio.play();
      
      // Clean up the URL object after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setActiveElement(null);
      };
    } catch (err) {
      console.error("Error getting audio for element", err);
      toast({
        title: "Audio Error",
        description: "Could not load audio for this element",
        variant: "destructive",
      });
    }
  }

  const handleAnswerSelect = (answer: string) => {
    const updatedAnswers = [...selectedAnswers]
    updatedAnswers[currentQuestion] = answer
    setSelectedAnswers(updatedAnswers)
    
    // Announce selection
    handleElementFocus(`Selected: ${answer}`);
  }

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 1500))
      const score = selectedAnswers.reduce((acc, ans, i) => {
        return ans === quizQuestions[i].correctAnswer ? acc + 1 : acc
      }, 0)
      toast({
        title: "Quiz Submitted",
        description: `Your score: ${score}/${quizQuestions.length}`,
      })
      handleElementFocus(
        `Quiz submitted. Your score is ${score} out of ${quizQuestions.length}.`,
      )
      setTimeout(() => router.push("/dashboard"), 3000)
    } catch (error) {
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
    // Handle focus change events
    const handleFocusChange = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Get text content based on element type
      let textContent = "";
      
      if (target.tagName === "BUTTON") {
        // For buttons, use aria-label if available, otherwise use text content
        textContent = target.getAttribute("aria-label") || target.textContent || "";
      } else if (target.tagName === "H2") {
        // For headings, use text content
        textContent = target.textContent || "";
      } else if (target.tagName === "LABEL") {
        // For option labels
        const radioId = target.getAttribute("for");
        if (radioId) {
          const radioInput = document.getElementById(radioId) as HTMLInputElement;
          if (radioInput) {
            textContent = `Option: ${target.textContent?.trim()}`;
          }
        }
      } else if (target.classList.contains("progress")) {
        // For progress elements
        textContent = `Progress: Question ${currentQuestion + 1} of ${quizQuestions.length}`;
      }
      
      if (textContent) {
        handleElementFocus(textContent);
      }
    };

    document.addEventListener("focusin", handleFocusChange);
    
    // Announce the current question and options when question changes
    const question = quizQuestions[currentQuestion];
    const questionText = `Question ${currentQuestion + 1} of ${quizQuestions.length}: ${question.question}. Options: ${question.options.join(", ")}`;
    
    // Slight delay to ensure DOM is updated before announcing
    setTimeout(() => handleElementFocus(questionText), 300);

    return () => {
      document.removeEventListener("focusin", handleFocusChange);
    }
  }, [currentQuestion]);

  const question = quizQuestions[currentQuestion]
  const progressPercent = ((currentQuestion + 1) / quizQuestions.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-10">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle
            className="text-center text-xl md:text-2xl font-bold"
            tabIndex={0}
          >
            Question {currentQuestion + 1} of {quizQuestions.length}
          </CardTitle>
          <Progress 
            value={progressPercent} 
            className="mt-4 progress" 
            tabIndex={0}
          />
        </CardHeader>

        <CardContent className="space-y-6">
          <h2
            className="text-lg md:text-xl font-semibold"
            tabIndex={0}
            aria-live="polite"
          >
            {question.question}
          </h2>

          <RadioGroup
            value={selectedAnswers[currentQuestion]}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <Label
                key={index}
                htmlFor={`option-${index}`}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                  selectedAnswers[currentQuestion] === option
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-accent"
                }`}
                aria-label={option}
                tabIndex={0}
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  className="peer"
                />
                {option}
                {activeElement === `Option: ${option}` && (
                  <span className="sr-only">Currently focused</span>
                )}
              </Label>
            ))}
          </RadioGroup>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-6 border-t">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              aria-label="Previous question"
              className="w-full sm:w-auto"
            >
              Previous
              {activeElement === "Previous question" && (
                <span className="sr-only">Currently focused</span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleNextQuestion}
              disabled={currentQuestion === quizQuestions.length - 1}
              aria-label="Next question"
              className="w-full sm:w-auto"
            >
              Next
              {activeElement === "Next question" && (
                <span className="sr-only">Currently focused</span>
              )}
            </Button>
          </div>

          <Button
            onClick={handleSubmitQuiz}
            disabled={
              isSubmitting || selectedAnswers.includes("")
            }
            aria-label="Submit quiz"
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
            {activeElement === "Submit quiz" && (
              <span className="sr-only">Currently focused</span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}