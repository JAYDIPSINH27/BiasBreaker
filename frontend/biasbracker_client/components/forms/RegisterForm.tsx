"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRegisterMutation, useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import InputField from "../common/InputField";
import PasswordField from "../common/PasswordField";
import { validateForm } from "../utils/registerValidation";
import Spinner from "../common/Spinner";
import Image from "next/image";
import Logo from "@/public/logo/Combine_Logo.png";
import { motion } from "framer-motion";
import Link from "next/link";
import GoogleLoginButton from "../common/GoogleLoginButton";

interface RegisterFormState {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  re_password: string;
}

const RegisterForm = () => {
  const router = useRouter();

  // 1) Check if user is already logged in
  const {
    data: user,
    isLoading: isUserLoading,
    isSuccess: isUserSuccess,
    isError: isUserError, // not really used here, but handy if you want to handle errors
  } = useRetrieveUserQuery();

  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState<RegisterFormState>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    re_password: "",
  });

  const [touched, setTouched] = useState<Record<keyof RegisterFormState, boolean>>({
    first_name: false,
    last_name: false,
    email: false,
    password: false,
    re_password: false,
  });

  const [errors, setErrors] = useState<Partial<RegisterFormState>>({});

  // 2) If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isUserLoading && isUserSuccess && user) {
      router.push("/dashboard");
    }
  }, [isUserLoading, isUserSuccess, user, router]);

  // Debounce form validation
  useEffect(() => {
    const timer = setTimeout(() => {
      setErrors(validateForm(formData));
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

    register(formData)
      .unwrap()
      .then(() => {
        toast.success("Check your email to verify your account.");
        router.push("/auth/login");
      })
      .catch(() => toast.error("Failed to register account"));
  };

  // 3) If user info is still loading, optionally display a spinner:
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <Spinner />
      </div>
    );
  }

  // 4) If not logged in, render the registration form
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 px-4 sm:px-6 pt-24 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white p-10 sm:p-12 rounded-lg shadow-lg w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Image src={Logo} alt="BiasBreaker Logo" className="h-20 w-auto" />
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-bold text-gray-900 mt-5">
          Sign up for an account
        </h2>

        {/* Form */}
        <form className="space-y-5 mt-6" onSubmit={onSubmit}>
          <motion.div whileFocus={{ scale: 1.05 }}>
            <InputField
              id="first_name"
              label="First Name"
              name="first_name"
              type="text"
              value={formData.first_name}
              error={errors.first_name}
              touched={touched.first_name}
              onChange={onChange}
            />
          </motion.div>

          <motion.div whileFocus={{ scale: 1.05 }}>
            <InputField
              id="last_name"
              label="Last Name"
              name="last_name"
              type="text"
              value={formData.last_name}
              error={errors.last_name}
              touched={touched.last_name}
              onChange={onChange}
            />
          </motion.div>

          <motion.div whileFocus={{ scale: 1.05 }}>
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
          </motion.div>

          <motion.div whileFocus={{ scale: 1.05 }}>
            <PasswordField
              id="password"
              label="Password"
              name="password"
              value={formData.password}
              error={errors.password}
              touched={touched.password}
              onChange={onChange}
            />
          </motion.div>

          <motion.div whileFocus={{ scale: 1.05 }}>
            <PasswordField
              id="re_password"
              label="Confirm Password"
              name="re_password"
              value={formData.re_password}
              error={errors.re_password}
              touched={touched.re_password}
              onChange={onChange}
            />
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-500 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? <Spinner /> : "Sign Up"}
          </motion.button>

          {/* Google Login Button */}
          <GoogleLoginButton text="Continue with Google" />

          {/* Login Redirect */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-indigo-600 hover:underline">
              Sign In here
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterForm;
