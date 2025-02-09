"use client";

import { useEffect, useState } from "react";
import { useActivationMutation } from "@/redux/features/authApiSlice";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Spinner from "../common/Spinner";
import { motion } from "framer-motion";

const ActivationForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activate, { isLoading }] = useActivationMutation();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (uid && token) {
      activate({ uid, token })
        .unwrap()
        .then(() => {
          setStatus("success");
          toast.success("Account activated successfully! 🎉");
          setTimeout(() => router.push("/auth/login"), 3000); // Redirect after 3s
        })
        .catch(() => {
          setStatus("error");
          toast.error("Invalid activation link or expired token.");
        });
    } else {
      setStatus("error");
      toast.error("Invalid activation URL.");
    }
  }, [uid, token, activate, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center"
      >
        {isLoading || status === "loading" ? (
          <>
            <Spinner />
            <h2 className="text-xl font-bold text-gray-900 mt-4">Activating your account...</h2>
            <p className="text-gray-600 mt-2">Please wait while we confirm your activation.</p>
          </>
        ) : status === "success" ? (
          <>
            <h2 className="text-xl font-bold text-green-600">Account Activated! ✅</h2>
            <p className="text-gray-600 mt-2">Redirecting you to the login page...</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-red-600">Activation Failed ❌</h2>
            <p className="text-gray-600 mt-2">Your activation link is invalid or expired.</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ActivationForm;
