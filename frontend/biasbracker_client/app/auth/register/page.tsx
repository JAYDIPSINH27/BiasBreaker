"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRegisterMutation } from "@/redux/features/authApiSlice";
import toast from "react-hot-toast";
import Spinner from "@/components/common/Spinner";
import { useRouter } from "next/navigation";
import Logo from "@/public/logo/Combine_Logo.png";
import Image from "next/image";
import { HiEye, HiEyeOff } from "react-icons/hi";

const Page = () => {
  const [register, { isLoading }] = useRegisterMutation();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    re_password: "",
  });

  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    re_password: "",
  });

  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const { first_name, last_name, email, password, re_password } = formData;

  useEffect(() => {
    const timer = setTimeout(() => {
      validateForm();
    }, 300);
    return () => clearTimeout(timer);
  }, [formData]);

  const validateForm = () => {
    let newErrors: any = {};

    if (!/^[A-Za-z]{2,}$/.test(first_name)) {
      newErrors.first_name = "Must be at least 2 letters";
    }

    if (!/^[A-Za-z]{2,}$/.test(last_name)) {
      newErrors.last_name = "Must be at least 2 letters";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        password
      )
    ) {
      newErrors.password =
        "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char";
    }

    if (re_password !== password) {
      newErrors.re_password = "Passwords do not match";
    }

    setErrors(newErrors);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Track touched fields for validation feedback
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      Object.values(errors).some((err) => err) ||
      Object.values(formData).some((field) => !field)
    ) {
      toast.error("Please fix errors before submitting.");
      return;
    }

    register(formData)
      .unwrap()
      .then(() => {
        toast.success("Please check your email to verify your account.");
        router.push("/auth/login");
      })
      .catch(() => {
        toast.error("Failed to register account");
      });
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Image alt="BiasBreaker" src={Logo} className="mx-auto h-20 w-auto" />
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Sign up for an account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={onSubmit}>
          {/* First Name */}
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-900"
            >
              First Name
            </label>
            <input
              id="first_name"
              className={`block w-full rounded-md px-3 py-1.5 ${
                errors.first_name && touched.first_name
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              name="first_name"
              type="text"
              value={first_name}
              onChange={onChange}
              autoFocus
              required
            />
            {errors.first_name && touched.first_name && (
              <p className="text-red-500 text-sm">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-900"
            >
              Last Name
            </label>
            <input
              id="last_name"
              className={`block w-full rounded-md px-3 py-1.5 ${
                errors.last_name && touched.last_name
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              name="last_name"
              type="text"
              value={last_name}
              onChange={onChange}
              required
            />
            {errors.last_name && touched.last_name && (
              <p className="text-red-500 text-sm">{errors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`block w-full rounded-md px-3 py-1.5 ${
                errors.email && touched.email ? "border-red-500" : "border-gray-300"
              }`}
              value={email}
              onChange={onChange}
              required
              autoComplete="email"
            />
            {errors.email && touched.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="block w-full rounded-md px-3 py-1.5"
                name="password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={onChange}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2 text-gray-500"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>
            {errors.password && touched.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="re_password" className="block text-sm font-medium text-gray-900">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="re_password"
                className="block w-full rounded-md px-3 py-1.5"
                name="re_password"
                type={confirmPasswordVisible ? "text" : "password"}
                value={re_password}
                onChange={onChange}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2 text-gray-500"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              >
                {confirmPasswordVisible ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>
            {errors.re_password && touched.re_password && <p className="text-red-500 text-sm">{errors.re_password}</p>}
          </div>

          {/* Submit Button */}
          <div>
            <button type="submit" className="w-full rounded-md px-3 py-1.5 bg-indigo-600 text-white">
              {isLoading ? <Spinner sm /> : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
