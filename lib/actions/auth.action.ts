"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  // Create session cookie
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000, // milliseconds
  });

  // Set cookie in the browser
  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email, profileURL } = params;

  try {
    // check if user exists in db
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db with profile image
    await db
      .collection("users")
      .doc(uid)
      .set({
        name,
        email,
        profileURL: profileURL || null,
        createdAt: new Date().toISOString(),
      });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle Firebase specific errors
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken, profileURL } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) {
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };
    }

    // If profileURL is provided (from Google sign-in), update it in the database
    if (profileURL) {
      await db.collection("users").doc(userRecord.uid).set(
        {
          profileURL,
        },
        { merge: true }
      );
    }

    // Set the session cookie
    await setSessionCookie(idToken);

    // Return success response
    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error: any) {
    console.error("Sign in error:", error);

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");

  return {
    success: true,
    message: "Signed out successfully.",
  };
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      console.warn("No session cookie found");
      return null; // No session, return null
    }

    // Verify session cookie
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    } catch (error: any) {
      console.warn(
        "Invalid session cookie. Session clearing must be handled in a Server Action or Route Handler."
      );
      return null;
    }

    // Fetch user info from Firestore
    const userRef = db.collection("users").doc(decodedClaims.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn("No user record found for UID:", decodedClaims.uid);
      return null; // No user record, return null
    }

    // Return user data
    const userData = userDoc.data();
    return {
      uid: decodedClaims.uid,
      name: userData?.name || "",
      email: userData?.email || "",
      id: userDoc.id,
      ...userData,
    } as User;
  } catch (error: any) {
    console.error("Get current user error:", error);
    return null; // Gracefully handle unexpected errors
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
