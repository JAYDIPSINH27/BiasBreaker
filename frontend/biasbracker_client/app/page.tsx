"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-indigo-50 to-blue-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col-reverse md:flex-row items-center max-w-6xl mx-auto gap-8"
      >
        {/* Branding & CTA */}
        <div className="md:w-1/2 text-center md:text-left space-y-6">
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold text-gray-900"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            BiasBreaker
          </motion.h1>
          <p className="text-lg md:text-xl text-gray-700">
            See Beyond. Think Deeper.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Uncover AI biases with precision and fairness. Engage with diverse perspectives and challenge your thinking in a new way.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/auth/register"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:bg-blue-500 transition"
              >
                Try BiasBreaker
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/auth/login"
                className="inline-block border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
              >
                Login
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="md:w-1/2 flex justify-center"
        >
          <div className="w-64 h-64 relative max-w-md">
            <Image
              src="/assets/Hero_Gif.gif"
              alt="BiasBreaker AI"
              fill
              className=" rounded-xl shadow-2xl"
              priority
            />
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}