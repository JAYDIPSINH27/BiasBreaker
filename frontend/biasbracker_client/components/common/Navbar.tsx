"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-white shadow-md fixed top-0 left-0 z-50 py-1"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {/* <Image src="/logo/Combine_Logo.png" alt="BiasBreaker Logo" width={40} height={40} /> */}
            <span className="ml-2 text-lg font-bold text-gray-900">BiasBreaker</span>
          </Link>

          {/* Navigation Buttons */}
          <div className="hidden md:flex space-x-4">
            <Link href="/auth/login" className="px-4 py-2 text-gray-700 hover:text-indigo-600">
              Login
            </Link>
            <Link href="/auth/register" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500">
              Register
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
