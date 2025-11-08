import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle both client-side calls and VAPI server-side calls
    let role, level, techstack, type, amount, userid;

    // Check if it's a VAPI server-side function call (production)
    if (body.message?.functionCall?.parameters) {
      const params = body.message.functionCall.parameters;
      role = params.role;
      level = params.level;
      techstack = params.techstack;
      type = params.type;
      amount = params.amount;
      userid = params.userid;
    } else {
      // Direct call from client (local development)
      ({ type, role, level, techstack, amount, userid } = body);
    }

    console.log("Generating interview with params:", {
      role,
      level,
      techstack,
      type,
      amount,
      userid,
    });

    // Generate questions using Google Gemini
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    // Parse questions and create interview document
    const parsedQuestions = JSON.parse(questions);

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(",").map((tech: string) => tech.trim()),
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    const docRef = await db.collection("interviews").add(interview);

    console.log("Interview created with ID:", docRef.id);

    // Return appropriate response format
    if (body.message?.functionCall) {
      // VAPI server-side format (production)
      return Response.json(
        {
          results: [
            {
              success: true,
              interviewId: docRef.id,
              message: `Your ${role} interview with ${amount} questions has been generated successfully!`,
            },
          ],
        },
        { status: 200 }
      );
    } else {
      // Client-side format (local)
      return Response.json(
        { success: true, interviewId: docRef.id },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error generating interview:", error);

    const body = await request.json().catch(() => ({}));

    if (body.message?.functionCall) {
      // VAPI format
      return Response.json(
        {
          results: [
            {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          ],
        },
        { status: 500 }
      );
    } else {
      // Client format
      return Response.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }
}

export async function GET() {
  return Response.json(
    { success: true, data: "Interview Generation API" },
    { status: 200 }
  );
}
