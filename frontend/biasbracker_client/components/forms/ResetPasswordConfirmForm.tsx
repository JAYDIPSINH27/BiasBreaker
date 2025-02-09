"use client";

import { useState } from "react";
import { useResetPasswordConfirmMutation } from "@/redux/features/authApiSlice";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Spinner from "../common/Spinner";
import { motion } from "framer-motion";

const ResetPasswordConfirmForm = () => {
  const { uid, token } = useParams(); // Get dynamic params from the route
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [reNewPassword, setReNewPassword] = useState("");
  const [resetPasswordConfirm, { isLoading }] = useResetPasswordConfirmMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== reNewPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      await resetPasswordConfirm({ uid, token, new_password: newPassword, re_new_password: reNewPassword }).unwrap();
      toast.success("Password reset successfully! 🎉");
      setTimeout(() => router.push("/auth/login"), 3000); // Redirect after 3s
    } catch {
      toast.error("Failed to reset password.");
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
        <h2 className="text-center text-2xl font-bold text-gray-900">Set New Password</h2>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" required />
          <input type="password" className="input-field" value={reNewPassword} onChange={e => setReNewPassword(e.target.value)} placeholder="Confirm Password" required />
          <motion.button 
            type="submit" 
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? <Spinner /> : "Reset Password"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordConfirmForm;
