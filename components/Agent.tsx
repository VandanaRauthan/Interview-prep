"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const totalQuestions = questions?.length || 0;

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      console.log("Message received:", message);

      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        console.log("Adding message to transcript:", newMessage);
        setMessages((prev) => [...prev, newMessage]);

        // Count questions asked by assistant
        if (message.role === "assistant") {
          // Check if this message contains a question mark (likely a question)
          if (message.transcript.includes("?")) {
            setQuestionsAsked((prev) => prev + 1);
          }
        }
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  // Auto-end call when all questions are asked and answered
  useEffect(() => {
    console.log(`Questions asked: ${questionsAsked}/${totalQuestions}`);

    // Only auto-end if all questions asked AND we have enough messages (indicating answers were given)
    if (
      questionsAsked >= totalQuestions &&
      totalQuestions > 0 &&
      messages.length >= totalQuestions * 2 &&
      callStatus === CallStatus.ACTIVE
    ) {
      console.log("All questions completed, ending call in 15 seconds...");

      // Give more time for the last answer and acknowledgment
      const timer = setTimeout(() => {
        console.log("Auto-ending call now");
        handleDisconnect();
      }, 15000); // 15 seconds delay

      return () => clearTimeout(timer);
    }
  }, [questionsAsked, totalQuestions, messages.length, callStatus]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("Generating feedback with messages:", messages);

      if (messages.length === 0) {
        console.log("No messages to generate feedback from");
        toast.error("No conversation recorded. Please try again.");
        router.push("/");
        return;
      }

      // Show loading toast
      const toastId = toast.loading("Generating your feedback...");

      try {
        console.log("Calling createFeedback server action...");
        console.log("Interview ID:", interviewId);
        console.log("User ID:", userId);
        console.log("Messages count:", messages.length);

        const result = await createFeedback({
          interviewId: interviewId!,
          userId: userId!,
          transcript: messages,
          feedbackId,
        });

        console.log("createFeedback result:", result);

        if (result.success && result.feedbackId) {
          console.log("Feedback created successfully:", result.feedbackId);
          toast.success("Feedback generated successfully!", { id: toastId });

          // Redirect after short delay
          setTimeout(() => {
            router.push(`/interview/${interviewId}/feedback`);
          }, 1000);
        } else {
          console.log("Error saving feedback - result:", result);
          console.error("Error details:", result.error);
          toast.error(
            `Failed to generate feedback: ${result.error || "Unknown error"}`,
            { id: toastId }
          );

          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } catch (error) {
        console.error("Exception in feedback generation:", error);
        toast.error("An error occurred while generating feedback.", {
          id: toastId,
        });

        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    };

    if (callStatus === CallStatus.FINISHED && messages.length > 0) {
      console.log("Call finished, generating feedback...");
      handleGenerateFeedback(messages);
    }
  }, [messages, callStatus, feedbackId, interviewId, router, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setQuestionsAsked(0); // Reset counter

    // Format questions for the interviewer - make it VERY clear
    const formattedQuestions =
      questions
        ?.map((question, index) => `Question ${index + 1}: ${question}`)
        .join("\n\n") || "";

    console.log("Starting interview with questions:", formattedQuestions);
    console.log("Total questions:", totalQuestions);

    try {
      // Use Assistant ID (which works) with variable values
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
        variableValues: {
          questions: formattedQuestions,
          userName: userName || "candidate",
        },
      });
    } catch (error) {
      console.error("Error starting VAPI:", error);
      toast.error("Failed to start interview", {
        description: "Please check your connection and try again",
      });
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    console.log("Disconnecting call...");
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          {callStatus === CallStatus.ACTIVE && (
            <p className="text-sm text-gray-400 mt-2">
              Question {Math.min(questionsAsked + 1, totalQuestions)} of{" "}
              {totalQuestions}
            </p>
          )}
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Start Interview"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End Interview
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
