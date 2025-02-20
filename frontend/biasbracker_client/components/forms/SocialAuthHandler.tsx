"use client";

import { useEffect, useState } from "react";
import { useSocialAuthenticateMutation } from "@/redux/features/authApiSlice";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Spinner from "../common/Spinner";

const SocialAuthHandler = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [socialAuthenticate, { isLoading }] = useSocialAuthenticateMutation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Extract parameters from callback URL
  const provider = "google-oauth2"; // Hardcoded for now, update dynamically if needed
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  useEffect(() => {
    const processAuthentication = async () => {
      if (!provider || !state || !code) {
        toast.error("Invalid authentication parameters.");
        router.push("/auth/login");
        return;
      }

      setIsAuthenticating(true);
      try {
        await socialAuthenticate({ provider, state, code }).unwrap();
        toast.success("Authentication successful! 🎉");
        router.push("/dashboard"); // Redirect user to dashboard
      } catch (error) {
        console.error("Social authentication error:", error);
        toast.error("Authentication failed. Please try again.");
        router.push("/auth/login");
      } finally {
        setIsAuthenticating(false);
      }
    };

    if (state && code) {
      processAuthentication();
    }
  }, [provider, state, code, socialAuthenticate, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {isAuthenticating || isLoading ? (
        <>
          <Spinner />
          <p className="text-lg text-gray-600 mt-2">Authenticating...</p>
        </>
      ) : (
        <p className="text-lg text-gray-600">Waiting for authentication...</p>
      )}
    </div>
  );
};

export default SocialAuthHandler;
