"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { vapi } from "@/lib/vapi.sdk";

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
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  // Determine if we're in production (deployed to Vercel)
  const isProduction = process.env.NODE_ENV === "production";

  // Use environment variable if available, otherwise fallback to hardcoded URL
  const apiUrl = isProduction
    ? (process.env.NEXT_PUBLIC_API_URL ||
        "https://vandhana-project.vercel.app") + "/api/vapi/generate"
    : `${window.location.origin}/api/vapi/generate`;

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = async (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }

      // Handle function calls client-side (for local development)
      if (message.type === "function-call" && !isProduction) {
        console.log(
          "Function call received (client-side):",
          message.functionCall
        );
        await handleFunctionCall(message);
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
  }, [isProduction]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  // Handle function calls client-side (for local development)
  const handleFunctionCall = async (message: any) => {
    const { functionCall } = message;
    const params = functionCall.parameters;

    if (functionCall.name === "generateInterview") {
      try {
        console.log("Generating interview (client-side)...", params);

        // Call your API
        const response = await fetch("/api/vapi/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: params.type,
            role: params.role,
            level: params.level,
            techstack: params.techstack,
            amount: params.amount,
            userid: userId,
          }),
        });

        const data = await response.json();

        // Send result back to VAPI using add-message
        if (data.success) {
          vapi.send({
            type: "add-message",
            message: {
              role: "system",
              content: `Function completed successfully. Tell the user: "Your interview has been generated! You can check it on the homepage. Goodbye!"`,
            },
          });

          // Wait 2 seconds for assistant to say goodbye, then end call
          setTimeout(() => {
            handleDisconnect();
          }, 2000);
        } else {
          vapi.send({
            type: "add-message",
            message: {
              role: "system",
              content:
                "Sorry, there was an issue generating your interview. Please try again.",
            },
          });
        }
      } catch (error) {
        console.error("Error:", error);
        vapi.send({
          type: "add-message",
          message: {
            role: "system",
            content: "An error occurred. Please try again.",
          },
        });
      }
    }
  };

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      // Base configuration for interview generation
      const baseConfig = {
        name: "Interview Generator",
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en",
        },
        voice: {
          provider: "11labs",
          voiceId: "sarah",
          stability: 0.4,
          similarityBoost: 0.8,
          speed: 0.9,
          style: 0.5,
          useSpeakerBoost: true,
        },
        model: {
          provider: "openai",
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that helps users generate interview questions. 

Important: The user ID is "${userId}". When calling the generateInterview function, ALWAYS include this userid parameter.

Your job is to:
1. Greet the user warmly and introduce yourself
2. Ask them about the job role they want to prepare for
3. Ask about their experience level (Junior, Mid, or Senior)
4. Ask about the tech stack or skills relevant to the role (comma-separated, e.g., "React, Node.js, MongoDB")
5. Ask whether they want Behavioral, Technical, or Mixed questions
6. Ask how many questions they want (suggest 5-10)
7. Once you have ALL the information, call the generateInterview function with all parameters INCLUDING the userid
8. After the function returns success, IMMEDIATELY say: "Your interview has been generated! You can check it on the homepage. Goodbye!"
9. Keep your goodbye VERY brief - the call will end in 2 seconds

Important:
- Ask ONE question at a time and wait for response
- Be conversational and friendly
- Collect all required information before calling the function
- After success, say goodbye IMMEDIATELY and BRIEFLY (one short sentence)`,
            },
          ],
          tools: [
            {
              type: "function",
              ...(isProduction && {
                // Server-side function for production (Vercel)
                async: false,
                messages: [
                  {
                    type: "request-start",
                    content:
                      "Let me generate your interview questions. This will take just a moment...",
                  },
                  {
                    type: "request-complete",
                    content:
                      "Your interview has been generated! You can check it on the homepage. Goodbye!",
                  },
                  {
                    type: "request-failed",
                    content:
                      "I apologize, but there was an issue generating your interview. Please try again.",
                  },
                ],
                server: {
                  url: apiUrl,
                  timeoutSeconds: 30,
                },
              }),
              function: {
                name: "generateInterview",
                description:
                  "Generate interview questions based on user preferences. Call this only when you have collected ALL required information.",
                parameters: {
                  type: "object",
                  properties: {
                    role: {
                      type: "string",
                      description: "The job role (e.g., 'Frontend Developer')",
                    },
                    level: {
                      type: "string",
                      enum: ["Junior", "Mid", "Senior"],
                      description: "Experience level",
                    },
                    techstack: {
                      type: "string",
                      description:
                        "Comma-separated technologies (e.g., 'React,Node.js,TypeScript')",
                    },
                    type: {
                      type: "string",
                      enum: ["Behavioral", "Technical", "Mixed"],
                      description: "Type of questions",
                    },
                    amount: {
                      type: "number",
                      description: "Number of questions (5-10 recommended)",
                      minimum: 3,
                      maximum: 15,
                    },
                    userid: {
                      type: "string",
                      description: "User ID",
                      default: userId || "",
                    },
                  },
                  required: [
                    "role",
                    "level",
                    "techstack",
                    "type",
                    "amount",
                    "userid",
                  ],
                },
              },
            },
          ],
        },
        ...(isProduction && {
          endCallFunctionEnabled: true,
          endCallMessage:
            "Thank you for using our interview preparation service. Have a great day!",
        }),
      };

      await vapi.start(baseConfig as any);
    } else {
      // Use existing interviewer config for actual interviews
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
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
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
