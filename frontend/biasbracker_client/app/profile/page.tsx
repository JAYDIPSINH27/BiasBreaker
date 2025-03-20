"use client";

import { motion } from "framer-motion";
import { useGetUserPointsQuery } from "@/redux/features/userPointsApiSlice";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { FaMedal } from "react-icons/fa";
import Spinner from "@/components/common/Spinner";

// Define the TypeScript interface for User Points
interface UserPoints {
  total_points: number;
  badges: string[];
}

const ProfilePage = () => {
  const { data: user, isLoading: userLoading } = useRetrieveUserQuery();
  const { data: userPoints, isLoading: pointsLoading } = useGetUserPointsQuery<UserPoints>();



  if (userLoading || pointsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  // Ensure safe access
  const total_points = userPoints?.total_points ?? 0;
  const badges = userPoints?.badges ?? [];
  const userInitials = user.first_name ? user.first_name[0].toUpperCase() : "?";

  return (
    <motion.div
      className="max-w-3xl mx-auto my-auto p-8 bg-white shadow-lg rounded-lg mt-20 text-center border border-gray-200"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Profile Icon */}
      <motion.div
        className="w-24 h-24 mx-auto flex items-center justify-center text-4xl font-bold text-white bg-blue-500 rounded-full shadow-md"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {userInitials}
      </motion.div>

      {/* User Info */}
      <h2 className="text-2xl font-bold text-gray-800 mt-4">
        {user.first_name} {user.last_name}
      </h2>
      <p className="text-gray-600">{user.email}</p>

      {/* Points Section */}
      <div className="mt-6 bg-gray-100 p-5 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Total Points:</h3>
        <motion.p
          className="text-4xl font-extrabold text-blue-600 mt-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {total_points} pts
        </motion.p>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700">
          Next Badge Progress
        </h3>
        <div className="w-full bg-gray-300 rounded-full h-5 mt-2 relative overflow-hidden">
          <motion.div
            className="bg-green-500 h-5 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(total_points % 50) * 2}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.span
            className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-white font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {50 - (total_points % 50)} pts to next badge
          </motion.span>
        </div>
      </div>

      {/* Badges Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700">Your Badges</h3>
        {badges.length === 0 ? (
          <p className="text-gray-500 mt-2">
            No badges yet. Keep earning points!
          </p>
        ) : (
          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {badges.map((badge: string, idx: number) => (
              <motion.div
                key={idx}
                className="flex items-center bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg shadow-md"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <FaMedal className="mr-2 text-yellow-600" /> {badge}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ProfilePage;
