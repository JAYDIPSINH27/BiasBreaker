"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useLoginMutation } from "@/redux/features/authApiSlice";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import InputField from "../common/InputField";
import PasswordField from "../common/PasswordField";
import { validateLoginForm } from "../utils/loginValidation";
import Spinner from "../common/Spinner";
import GoogleLoginButton from "../common/GoogleLoginButton"; // NEW IMPORT
import Image from "next/image";
import Logo from "@/public/logo/Combine_Logo.png";
import { motion } from "framer-motion";
import Link from "next/link";

interface LoginFormState {
  email: string;
  password: string;
}

const LoginForm = () => {
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormState>({ email: "", password: "" });
  const [touched, setTouched] = useState<Record<keyof LoginFormState, boolean>>({ email: false, password: false });
  const [errors, setErrors] = useState<Partial<LoginFormState>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrors(validateLoginForm(formData));
    }, 300);
    return () => clearTimeout(timer);
  }, [formData]);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    setTouched({ ...touched, [name]: true });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(errors).some((err) => err)) {
      toast.error("Please fix errors before submitting.");
      return;
    }

    login(formData)
      .unwrap()
      .then(() => {
        toast.success("Login successful! 🎉");
        router.push("/dashboard");
      })
      .catch(() => toast.error("Invalid credentials"));
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <Image src={Logo} alt="Logo" className="mx-auto h-20 w-auto" />
        <h2 className="text-center text-2xl font-bold text-gray-900 mt-5">
          Login to Your Account
        </h2>
        <form className="space-y-4 mt-6" onSubmit={onSubmit}>
          <InputField id="email" label="Email" name="email" type="email" value={formData.email} error={errors.email} touched={touched.email} onChange={onChange} />
          <PasswordField id="password" label="Password" name="password" value={formData.password} error={errors.password} touched={touched.password} onChange={onChange} />
          <motion.button type="submit" className="btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {isLoading ? <Spinner /> : "Login"}
          </motion.button>

          {/* Reusable Google Login Button */}
          <GoogleLoginButton text="Continue with Google" />
          <p className="text-center text-sm text-gray-500 mt-4">
            Do not have any account?{" "}
            <Link href="/auth/register" className="text-indigo-600 hover:underline">
              Sign Up here
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginForm;
