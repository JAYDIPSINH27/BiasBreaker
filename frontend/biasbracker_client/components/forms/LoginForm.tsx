"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useLoginMutation, useRetrieveUserQuery } from "@/redux/features/authApiSlice";
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
  const router = useRouter();

  // 1) Check if user is already logged in
  const {
    data: user,
    isLoading: isUserLoading, // whether user retrieval is in progress
    isSuccess: isUserSuccess, // whether the query succeeded
    isError: isUserError,
  } = useRetrieveUserQuery();

  const [login, { isLoading }] = useLoginMutation();
  const [formData, setFormData] = useState<LoginFormState>({
    email: "jpsinh@yopmail.com",
    password: "Abcd@7635",
  });
  const [touched, setTouched] = useState<Record<keyof LoginFormState, boolean>>({
    email: false,
    password: false,
  });
  const [errors, setErrors] = useState<Partial<LoginFormState>>({});

  // 2) If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isUserLoading && isUserSuccess && user) {
      router.push("/dashboard");
    }
    // If there's an error, the user is definitely not logged in
    // so we just let them see the login page.
  }, [isUserLoading, isUserSuccess, user, router]);

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

  // 3) While user info is loading (optional), you can show a spinner:
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <Spinner />
      </div>
    );
  }

  // 4) If not logged in, render the login form
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
          <InputField
            id="email"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            error={errors.email}
            touched={touched.email}
            onChange={onChange}
          />
          <PasswordField
            id="password"
            label="Password"
            name="password"
            value={formData.password}
            error={errors.password}
            touched={touched.password}
            onChange={onChange}
          />
          <motion.button
            type="submit"
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
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
          <p className="text-center text-sm text-gray-500 mt-4">
            Forgot your password ?{" "}
            <Link href="/password-reset" className="text-indigo-600 hover:underline">
              Reset Password
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginForm;
