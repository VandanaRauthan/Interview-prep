"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";
import { toast } from "sonner";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          profileURL: userCredential.user.photoURL || undefined,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          return;
        }

        await signIn({
          email,
          idToken,
          profileURL: userCredential.user.photoURL || undefined,
        });

        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (error: any) {
      console.error("Auth error:", error);

      // Better error messages
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters");
      } else if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else {
        toast.error(`Authentication failed: ${error.message}`);
      }
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;

    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      // Add custom parameters to force account selection
      provider.setCustomParameters({
        prompt: "select_account",
      });

      console.log("Starting Google sign-in...");

      try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        console.log("Google sign-in successful:", user.email);

        // Get the ID token
        const idToken = await user.getIdToken();

        if (!idToken) {
          throw new Error("Failed to get authentication token");
        }

        console.log("Got ID token, checking if new user...");

        // Check if this is a new user by checking Firestore
        // We'll let the server action handle this
        const result = await signUp({
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email!,
          profileURL: user.photoURL || undefined,
        });

        console.log("SignUp result:", result);

        if (result.success) {
          // New user
          toast.success("Account created successfully!");

          // Now sign them in
          await signIn({
            email: user.email!,
            idToken,
            profileURL: user.photoURL || undefined,
          });

          router.push("/");
        } else if (result.message.includes("already exists")) {
          // Existing user - just sign in
          console.log("User exists, signing in...");

          const signInResult = await signIn({
            email: user.email!,
            idToken,
            profileURL: user.photoURL || undefined,
          });

          if (signInResult.success) {
            toast.success("Signed in successfully!");
            router.push("/");
          } else {
            toast.error(signInResult.message || "Failed to sign in");
          }
        } else {
          toast.error(result.message || "Failed to authenticate");
        }
      } catch (error: any) {
        if (error.code === "auth/popup-blocked") {
          console.warn("Popup blocked. Falling back to redirect.");
          await signInWithRedirect(auth, provider);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/popup-closed-by-user") {
        toast.error("Sign in cancelled");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup was blocked. Please allow popups for this site.");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        toast.error("An account already exists with this email");
      } else if (error.code === "auth/cancelled-popup-request") {
        // User cancelled - don't show error
        console.log("Popup request cancelled");
      } else if (error.code === "auth/unauthorized-domain") {
        toast.error(
          "This domain is not authorized. Please add it in Firebase Console."
        );
      } else {
        toast.error("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </div>

        <h3>Practice job interviews with AI</h3>

        {/* Google Sign In Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 border-2 disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button className="btn w-full" type="submit">
              {isSignIn ? "Sign In" : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
