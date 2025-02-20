"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGenerateArticleMutation } from "@/redux/features/articleApiSlice";

const topicsList = [
  "Technology", "AI", "Health", "Finance", "Travel",
  "Science", "Education", "Psychology", "Sports", "History"
];

const TopicCloud = ({ onArticleGenerated }: { onArticleGenerated: () => void }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [generateArticle, { isLoading }] = useGenerateArticleMutation();

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const generateArticles = async () => {
    await Promise.all(selectedTopics.map(topic => generateArticle(topic)));
    onArticleGenerated(); // Refresh articles list after generation
    setSelectedTopics([]); // Reset topic selection
  };

  return (
    <motion.div className="p-6 text-center bg-gray-100 rounded-lg shadow-md" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h2 className="text-2xl font-extrabold mb-4 text-gray-800">Generate New Articles</h2>
      <p className="text-gray-600 mb-4">Select topics to generate fresh articles.</p>
      <div className="flex flex-wrap justify-center gap-3">
        {topicsList.map((topic) => (
          <motion.button
            key={topic}
            className={`px-4 py-2 rounded-full border shadow-sm transition-all duration-300 ${
              selectedTopics.includes(topic) ? "bg-blue-600 text-white shadow-lg scale-105" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
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
        className="mt-6 px-6 py-3 rounded-lg bg-green-500 text-white font-semibold shadow-md hover:bg-green-600 transition-all disabled:opacity-50"
        disabled={isLoading || selectedTopics.length === 0}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isLoading ? "Generating..." : "Generate Articles"}
      </motion.button>
    </motion.div>
  );
};

export default TopicCloud;
