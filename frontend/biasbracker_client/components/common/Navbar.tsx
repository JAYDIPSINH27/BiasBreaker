"use client";

import { useLogoutMutation, useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

// Define User Type
interface User {
  first_name: string;
  last_name: string;
  email: string;
}

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname(); // Detect page changes
  const { data: user, refetch } = useRetrieveUserQuery();
  const [logout] = useLogoutMutation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync user state immediately when user data updates
  useEffect(() => {
    setCurrentUser(user || null);
  }, [user]);

  // Refetch user data when navigating to a new page (fixes login delay issue)
  useEffect(() => {
    refetch();
  }, [pathname, refetch]);

  const handleLogout = async () => {
    try {
      await logout().unwrap(); // Perform logout
      setCurrentUser(null); // Immediately update UI
      await refetch(); // Ensure backend state is updated
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-gray-900">
          BiasBreaker
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          {currentUser ? (
            <>
            <Link
             href="/profile">
              <span className="text-gray-800 font-medium">
                Welcome, {currentUser.first_name}
              </span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-700 hover:text-red-600 transition duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition duration-200"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
