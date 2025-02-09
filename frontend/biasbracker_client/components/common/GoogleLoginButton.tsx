"use client";

import { useState } from "react";
import { useGetGoogleAuthURLQuery } from "@/redux/features/authApiSlice";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";

interface GoogleLoginButtonProps {
  text?: string; // Allow customization (e.g., "Sign Up with Google")
}

const GoogleLoginButton = ({ text = "Continue with Google" }: GoogleLoginButtonProps) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectUri = "http://localhost:3000/auth/google"; // Ensure this matches your backend setup

  const { data: googleAuthData } = useGetGoogleAuthURLQuery(redirectUri, { skip: isRedirecting });

  const handleGoogleLogin = async () => {
    if (googleAuthData?.authorization_url) {
      setIsRedirecting(true);
      window.location.href = googleAuthData.authorization_url;
    } else {
      toast.error("Failed to get authentication URL.");
    }
  };

  return (
    <motion.button 
      onClick={handleGoogleLogin} 
      className="flex w-full items-center justify-center bg-white border border-gray-300 py-2 rounded-md shadow-sm hover:bg-gray-100 transition text-gray-700"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <FcGoogle size={24} className="mr-2" />
      {isRedirecting ? "Redirecting..." : text}
    </motion.button>
  );
};

export default GoogleLoginButton;
