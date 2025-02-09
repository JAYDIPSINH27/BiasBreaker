"use client";

import { useState } from "react";
import { useResetPasswordMutation } from "@/redux/features/authApiSlice";
import toast from "react-hot-toast";
import Spinner from "../common/Spinner";
import { motion } from "framer-motion";

const ResetPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(email).unwrap();
      toast.success("Password reset link sent to your email!");
    } catch {
      toast.error("Failed to send reset link.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-center text-2xl font-bold text-gray-900">Reset Password</h2>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          <motion.button 
            type="submit" 
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? <Spinner /> : "Send Reset Link"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordForm;
