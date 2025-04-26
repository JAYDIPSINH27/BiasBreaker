'use client'
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaMedal, FaClipboard, FaQuoteLeft, FaRedo, FaBook, FaStream, FaClock, FaEye, FaTags, FaChartLine, FaBrain } from "react-icons/fa";
import Spinner from "@/components/common/Spinner";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import {
  useGetUserPointsQuery,
  useGetUserAnalyticsSummaryQuery,
} from "@/redux/features/userPointsApiSlice";

// Quote bank
const QUOTES = [
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry D. Thoreau" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
];

// Reusable metric card
const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}> = ({ icon, label, value, hint }) => (
  <motion.div
    className="bg-white shadow-xl rounded-2xl p-6 flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ scale: 1.05 }}
  >
    <div className="text-3xl text-green-500 mb-2">{icon}</div>
    <h4 className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
      {label}
      {hint && <span className="text-sm text-blue-400 cursor-help" title={hint}>🛈</span>}
    </h4>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </motion.div>
);

const ProfilePage: React.FC = () => {
  // Fetch user and analytics data
  const { data: user, isLoading: userLoading } = useRetrieveUserQuery();
  const { data: userPoints, isLoading: pointsLoading } = useGetUserPointsQuery();
  const { data: summaryData, isLoading: summaryLoading } = useGetUserAnalyticsSummaryQuery();

  // Local state for clock and quote
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());
  const [quote, setQuote] = useState(QUOTES[0]);
  const [copied, setCopied] = useState(false);

  // Tick the clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Randomize quote once
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  // Copy email to clipboard
  const copyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading / error states
  if (userLoading || pointsLoading || summaryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }
  if (!user || !userPoints || !summaryData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load profile.
      </div>
    );
  }

  // Destructure analytics summary
  const {
    total_articles_read,
    total_alternative_views,
    total_quizzes_completed,
    eye_tracking_sessions,
    total_gaze_points,
    avg_focus_duration_seconds,
    max_focus_duration_seconds,
    total_words_read,
    average_article_length,
    most_common_bias,
    badge_count,
    high_density_sessions,
    latest_read_topic,
  } = summaryData;

  // Points and badges
  const { total_points, badges } = userPoints;
  const progressPercent = (total_points % 50) * 2;
  const userInitials = user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Top Bar with Clock */}
        <div className="absolute top-4 left-4 font-mono text-gray-600">{time}</div>

        {/* Header with Avatar */}
        <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 relative">
          <motion.div
            className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-white rounded-full flex items-center justify-center text-4xl font-extrabold text-gray-800 shadow-lg"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {userInitials}
          </motion.div>
        </div>

        {/* User Info */}
        <div className="pt-20 pb-4 text-center px-6">
          <h2 className="text-4xl font-bold text-gray-800">{user.first_name} {user.last_name}</h2>
          <p className="mt-2 flex justify-center items-center gap-2 text-gray-600 cursor-pointer" onClick={copyEmail}>
            {user.email} <FaClipboard className="text-gray-500" />
          </p>
          {copied && <span className="text-green-500 text-sm">Copied!</span>}
        </div>

         {/* Quote Section */}
         <div className="px-6 pb-12">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl shadow-inner flex items-start gap-4">
            <FaQuoteLeft className="text-3xl text-purple-400 mt-1" />
            <div className="flex-1">
              <motion.p className="italic text-gray-700" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>{`“${quote.text}”`}</motion.p>
              <motion.p className="mt-2 text-right font-semibold text-gray-600" initial={{ x: 20 }} animate={{ x: 0 }} transition={{ delay: 0.5 }}>— {quote.author}</motion.p>
            </div>
            <motion.button
              onClick={() => setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])}
              className="text-gray-600 hover:text-gray-800"
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaRedo />
            </motion.button>
          </div>
        </div>

                {/* Badges Section */}
                <div className="px-6 pb-12 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your Badges ({badge_count})</h3>
          {badges.length === 0 ? (
            <p className="text-gray-500">No badges yet. Start reading to earn!</p>
          ) : (
            <motion.div className="flex flex-wrap justify-center gap-4">
              {badges.map((name, idx) => (
                <motion.div key={idx} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-400 to-green-400 text-white rounded-full shadow-lg"
                  whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 200 }}>
                  <FaMedal /> {name}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>


        {/* Points & Progress */}
        <div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div className="bg-gray-50 p-6 rounded-2xl shadow-inner text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Your Points</h3>
            <motion.p className="text-5xl font-extrabold text-blue-600" initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>{total_points}</motion.p>
          </motion.div>
          <motion.div className="bg-gray-50 p-6 rounded-2xl shadow-inner text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Progress to Next Badge</h3>
            <div className="flex justify-center mb-2">
              <svg height={120} width={120} className="mx-auto">
                <circle stroke="#E5E7EB" fill="transparent" strokeWidth={8} r={50} cx={60} cy={60} />
                <motion.circle
                  stroke="#10B981" fill="transparent" strokeWidth={8} strokeLinecap="round"
                  r={50} cx={60} cy={60}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - progressPercent / 100) }}
                  transition={{ duration: 1 }}
                  style={{ strokeDasharray: 2 * Math.PI * 50 }}
                />
                <text x="50%" y="50%" dy=".3em" textAnchor="middle" className="text-lg font-bold fill-gray-800">{progressPercent}%</text>
              </svg>
            </div>
            <p className="text-gray-600">{50 - (total_points % 50)} pts to go</p>
          </motion.div>
        </div>

                {/* Analytics Metrics Grid */}
                <div className="px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard icon={<FaBook />} label="Articles Read" value={total_articles_read} hint="Total number of articles you've read." />
          <MetricCard icon={<FaTags />} label="Alt. Perspectives" value={total_alternative_views} hint="Count of alternative viewpoints you've explored." />
          <MetricCard icon={<FaClipboard />} label="Quizzes Done" value={total_quizzes_completed} hint="Number of quizzes attempted after reading articles." />
          <MetricCard icon={<FaEye />} label="Gaze Sessions" value={eye_tracking_sessions} hint="Sessions where your eye movements were tracked." />
          <MetricCard icon={<FaStream />} label="Total Gaze Points" value={total_gaze_points} hint="Total data points collected from gaze tracking." />
          <MetricCard icon={<FaClock />} label="Avg Focus (s)" value={Math.round(avg_focus_duration_seconds)} hint="Average duration of focused attention per session in seconds." />
          <MetricCard icon={<FaClock />} label="Max Focus (s)" value={Math.round(max_focus_duration_seconds)} hint="Longest single focus duration recorded in seconds." />
          <MetricCard icon={<FaBook />} label="Words Read" value={total_words_read} hint="Cumulative word count of all articles you've read." />
          <MetricCard icon={<FaChartLine />} label="Avg Article Length" value={`${Math.round(average_article_length)} words`} hint="Average length in words of the articles you've read." />
          <MetricCard icon={<FaBrain />} label="Common Bias" value={most_common_bias} hint="Most frequent cognitive bias detected in your reading." />
          <MetricCard icon={<FaStream />} label="High-Density Sessions" value={high_density_sessions} hint="Sessions with over 200 gaze data points." />
          <MetricCard icon={<FaBook />} label="Latest Topic" value={latest_read_topic} hint="Topic of the most recently read article." />
        </div>

        {/* Quote Section */}
        <div className="px-6 pb-12">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl shadow-inner flex items-start gap-4">
            <FaQuoteLeft className="text-3xl text-purple-400 mt-1" />
            <div className="flex-1">
              <motion.p className="italic text-gray-700" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>{`“${quote.text}”`}</motion.p>
              <motion.p className="mt-2 text-right font-semibold text-gray-600" initial={{ x: 20 }} animate={{ x: 0 }} transition={{ delay: 0.5 }}>— {quote.author}</motion.p>
            </div>
            <motion.button
              onClick={() => setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])}
              className="text-gray-600 hover:text-gray-800"
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaRedo />
            </motion.button>
          </div>
        </div>


      </div>
    </div>
  );
};

export default ProfilePage;
