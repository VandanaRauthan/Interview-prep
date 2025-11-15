"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  console.log("=== START CREATE FEEDBACK ===");
  console.log("Interview ID:", interviewId);
  console.log("User ID:", userId);
  console.log("Transcript length:", transcript.length);
  console.log("Feedback ID (optional):", feedbackId);

  try {
    // Format transcript
    const formattedTranscript = transcript
      .map((sentence) => `${sentence.role}: ${sentence.content}`)
      .join("\n");

    console.log(
      "Formatted transcript (first 300 chars):",
      formattedTranscript.substring(0, 300)
    );

    console.log("Calling Google Gemini AI...");

    // Generate feedback using AI
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Evaluate the candidate based on the following transcript.
        
        TRANSCRIPT:
        ${formattedTranscript}

        Please provide:
        1. A total score out of 100
        2. Scores for these 5 categories (each out of 100):
           - Communication Skills
           - Technical Knowledge
           - Problem Solving
           - Cultural Fit
           - Confidence and Clarity
        3. List of strengths (3-5 points)
        4. List of areas for improvement (3-5 points)
        5. A final assessment summary (2-3 sentences)
        `,
      system: "You are a professional interviewer analyzing mock interviews.",
    });

    console.log("AI Response received!");
    console.log("Total Score:", object.totalScore);
    console.log("Category Scores:", object.categoryScores.length);

    // Create feedback object
    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    console.log("Saving to Firestore...");

    // Save to Firestore
    let feedbackRef;
    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
      console.log("Updating existing feedback:", feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
      console.log("Creating new feedback with ID:", feedbackRef.id);
    }

    await feedbackRef.set(feedback);

    console.log("✅ Feedback saved successfully!");
    console.log("=== END CREATE FEEDBACK ===");

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("❌ ERROR IN CREATE FEEDBACK:");
    console.error("Error type:", typeof error);
    console.error("Error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      console.error("Error stack:", error.stack);
    }

    console.log("=== END CREATE FEEDBACK (WITH ERROR) ===");

    return { success: false, error: String(error) };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  try {
    const interview = await db.collection("interviews").doc(id).get();

    if (!interview.exists) {
      console.log("Interview not found:", id);
      return null;
    }

    return { id: interview.id, ...interview.data() } as Interview;
  } catch (error) {
    console.error("Error getting interview:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  try {
    const querySnapshot = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      console.log("No feedback found for interview:", interviewId);
      return null;
    }

    const feedbackDoc = querySnapshot.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
  } catch (error) {
    console.error("Error getting feedback:", error);
    return null;
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  try {
    const interviews = await db
      .collection("interviews")
      .orderBy("createdAt", "desc")
      .where("finalized", "==", true)
      .where("userId", "!=", userId)
      .limit(limit)
      .get();

    if (interviews.empty) {
      console.log("No latest interviews found");
      return [];
    }

    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[];
  } catch (error) {
    console.error("Error getting latest interviews:", error);
    return [];
  }
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  try {
    console.log("Fetching interviews for userId:", userId);

    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .where("finalized", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    console.log("Found interviews:", interviews.size);

    if (interviews.empty) {
      console.log("No interviews found for user:", userId);
      return [];
    }

    const interviewData = interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[];

    console.log("Interview data:", interviewData);
    return interviewData;
  } catch (error) {
    console.error("Error getting interviews by userId:", error);
    return [];
  }
}
