"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useGetUserPointsQuery } from "@/redux/features/userPointsApiSlice";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { FaMedal, FaClipboard, FaQuoteLeft, FaRedo } from "react-icons/fa";
import Spinner from "@/components/common/Spinner";

// Define the TypeScript interface for User Points
interface UserPoints {
  total_points: number;
  badges: string[];
}

// Motivational quotes list
const QUOTES: { text: string; author: string }[] = [
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
];

// Badge color gradients
const BADGE_GRADIENTS = [
  "from-blue-400 to-blue-600",
  "from-green-400 to-green-600",
  "from-pink-400 to-pink-600",
  "from-purple-400 to-purple-600",
  "from-yellow-400 to-yellow-600",
];

// Reusable radial progress component
const RadialProgress: React.FC<{ percent: number }> = ({ percent }) => {
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto">
      <circle
        stroke="#E5E7EB"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <motion.circle
        stroke="#10B981"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ strokeDasharray: circumference, transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        className="text-xl font-bold fill-gray-800"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
};

const ProfilePage: React.FC = () => {
  const { data: user, isLoading: userLoading } = useRetrieveUserQuery();
  const { data: userPoints, isLoading: pointsLoading } = useGetUserPointsQuery<UserPoints>();

  // Clock state
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quote state
  const [quote, setQuote] = useState(QUOTES[0]);
  const randomQuote = () => setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  useEffect(() => { randomQuote(); }, []);

  // Copy email
  const [copied, setCopied] = useState<boolean>(false);
  const copyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (userLoading || pointsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }

  if (!user || !userPoints) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        Failed to load profile.
      </div>
    );
  }

  const total_points = userPoints.total_points;
  const badges = userPoints.badges;
  const progressPercent = (total_points % 50) * 2;
  const userInitials = user.first_name?.[0].toUpperCase() ?? user.last_name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 md:px-8">
      <div className="relative max-w-2xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200">
        {/* Clock */}
        <div className="absolute top-4 left-4 font-mono text-gray-600">{time}</div>

        {/* Header & Avatar */}
        <div className="h-40 bg-gradient-to-r from-green-400 to-blue-500 relative">
          <motion.div
            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-white rounded-full flex items-center justify-center text-3xl font-extrabold text-gray-800 shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {userInitials}
          </motion.div>
        </div>

        {/* User Info */}
        <div className="pt-16 pb-4 px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800">{user.first_name} {user.last_name}</h2>
          <p
            className="mt-1 flex items-center justify-center space-x-2 cursor-pointer text-gray-600"
            onClick={copyEmail}
          >
            <span>{user.email}</span>
            <FaClipboard className="text-gray-500" />
          </p>
          {copied && <div className="text-sm text-green-500 mt-1">Copied!</div>}
        </div>

        {/* Main Content */}
        <div className="px-6 pb-8 space-y-8">
          {/* Points & Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-2xl shadow-inner">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Your Points</h3>
              <motion.div
                className="text-5xl font-extrabold text-blue-600"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {total_points}
              </motion.div>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl shadow-inner text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Progress</h3>
              <RadialProgress percent={progressPercent} />
              <p className="mt-2 text-sm text-gray-600">{50 - (total_points % 50)} pts to next badge</p>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="bg-gray-100 p-6 rounded-2xl shadow-inner flex items-start space-x-4">
            <FaQuoteLeft className="text-2xl text-gray-400 mt-1" />
            <div className="flex-1">
              <p className="italic text-gray-700">“{quote.text}”</p>
              <p className="text-right mt-2 font-semibold text-gray-600">— {quote.author}</p>
            </div>
            <button onClick={randomQuote} className="text-gray-600 hover:text-gray-800">
              <FaRedo />
            </button>
          </div>

          {/* Badges & CTA */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Your Badges</h3>
            {badges.length === 0 ? (
              <p className="text-gray-500 text-center">No badges yet. Start earning!</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                {badges.map((badge, idx) => (
                  <motion.div
                    key={idx}
                    className={`flex items-center px-5 py-2 rounded-full shadow-lg bg-gradient-to-r ${BADGE_GRADIENTS[idx % BADGE_GRADIENTS.length]} text-white transform transition hover:scale-105`}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 250 }}
                  >
                    <FaMedal className="mr-2" />
                    {badge}
                  </motion.div>
                ))}
              </div>
            )}
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">
                Balance your perspective and earn new badges by reading more articles!
              </p>
              <Link href="/dashboard" className="inline-block bg-blue-500 text-white px-6 py-2 rounded-full shadow hover:bg-blue-600 transition">
                Explore Articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
