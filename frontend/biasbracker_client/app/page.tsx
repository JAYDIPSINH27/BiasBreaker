"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row items-center max-w-6xl mx-auto"
      >
        {/* Left - Branding & CTA */}
        <div className="text-center md:text-left md:w-1/2">
          <h1 className="text-5xl font-extrabold text-gray-900">BiasBreaker</h1>
          <p className="text-xl text-gray-600 mt-2 font-medium">
            See Beyond. Think Deeper.
          </p>
          <p className="text-gray-500 mt-4 text-lg leading-relaxed">
            Uncover AI biases with precision and fairness. Engage with diverse perspectives and challenge your thinking in a new way.
          </p>

          {/* CTA Buttons */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-6">
            <Link href="/auth/register" className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-500 transition">
              Try BiasBreaker
            </Link>
          </motion.div>

          {/* Already a user? Login */}
          <p className="text-gray-500 mt-4">
            Already a user?{" "}
            <Link href="/auth/login" className="text-indigo-600 hover:underline">
              Login
            </Link>
          </p>
        </div>

        {/* Right - Illustration (Optional, can be removed) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block md:w-1/2"
        >
          <Image 
            src="/assets/Hero_Gif.gif" 
            alt="BiasBreaker AI" 
            width={500} 
            height={500} 
            className="rounded-lg shadow-lg"
          />
        </motion.div>
      </motion.div>
    </main>
  );
}
