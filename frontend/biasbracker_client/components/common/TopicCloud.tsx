"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGenerateArticleMutation } from "@/redux/features/articleApiSlice";

const topicsList = [
  "Technology", "AI", "Health", "Finance", "Travel",
  "Science", "Education", "Psychology", "Sports", "History"
];

const TopicCloud = ({ onTopicsSelected }: { onTopicsSelected: (topics: string[]) => void }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [generateArticle, { isLoading }] = useGenerateArticleMutation();

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const generateArticles = async () => {
    await Promise.all(selectedTopics.map(topic => generateArticle(topic)));
    onTopicsSelected(selectedTopics);
  };

  return (
    <motion.div className="p-10 text-center" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h2 className="text-2xl font-extrabold mb-6 text-gray-800">Select Topics You Like</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {topicsList.map((topic) => (
          <motion.button
            key={topic}
            className={`px-4 py-2 rounded-full transition-all duration-300 border shadow-md ${selectedTopics.includes(topic) ? "bg-blue-600 text-white shadow-lg scale-105" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
            onClick={() => toggleTopic(topic)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {topic}
          </motion.button>
        ))}
      </div>
      <motion.button
        onClick={generateArticles}
        className="mt-6 px-6 py-3 rounded-lg bg-green-500 text-white font-semibold shadow-md hover:bg-green-600 transition-all"
        disabled={isLoading}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isLoading ? "Generating..." : "Generate Articles"}
      </motion.button>
    </motion.div>
  );
};

export default TopicCloud;
