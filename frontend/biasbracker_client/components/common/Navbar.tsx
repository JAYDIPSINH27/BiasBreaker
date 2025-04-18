"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { useLogoutMutation, useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { logout as logoutAction } from "@/redux/features/authSlice";
import { apiSlice } from "@/redux/services/apiSlice";
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaBars,
  FaTimes
} from "react-icons/fa";

interface User {
  first_name: string;
  last_name: string;
  email: string;
}

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { data: user, refetch } = useRetrieveUserQuery();
  const [logout] = useLogoutMutation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync user state
  useEffect(() => {
    setCurrentUser(user || null);
  }, [user]);

  // Refetch on route change, close menu
  useEffect(() => {
    refetch();
    setMenuOpen(false);
  }, [pathname, refetch]);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(logoutAction());
      dispatch(apiSlice.util.resetApiState());
      setCurrentUser(null);
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={currentUser ? "/dashboard" : "/"} className="flex items-center space-x-2">
          <FaHome className="text-blue-600 text-2xl" />
          <span className="text-xl font-bold text-gray-800">BiasBreaker</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-4">
          {currentUser ? (
            <>
              <Link href="/profile" className="flex items-center px-3 py-2 hover:bg-gray-100 rounded-lg transition">
                <FaUser className="mr-2 text-gray-600" />
                <span className="text-gray-800">Hi, {currentUser.first_name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 hover:bg-red-100 rounded-lg transition"
              >
                <FaSignOutAlt className="mr-2 text-red-600" />
                <span className="text-red-600">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="flex items-center px-3 py-2 hover:bg-gray-100 rounded-lg transition">
                <FaSignInAlt className="mr-2 text-green-600" />
                <span className="text-gray-800">Login</span>
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
              >
                <FaUserPlus className="mr-2" />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(open => !open)}
          className="md:hidden text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden bg-white border-t ${menuOpen ? 'block' : 'hidden'}`}>
        <div className="px-4 pt-4 pb-2 space-y-1">
          {currentUser ? (
            <>
              <Link
                href="/profile"
                className="flex items-center px-3 py-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaUser className="mr-2 text-gray-600" />
                <span className="text-gray-800">Hi, {currentUser.first_name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center px-3 py-2 hover:bg-red-100 rounded-lg transition"
              >
                <FaSignOutAlt className="mr-2 text-red-600" />
                <span className="text-red-600">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="flex items-center px-3 py-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaSignInAlt className="mr-2 text-green-600" />
                <span className="text-gray-800">Login</span>
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center px-3 py-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaUserPlus className="mr-2 text-blue-600" />
                <span className="text-gray-800">Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;