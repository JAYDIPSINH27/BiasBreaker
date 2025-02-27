"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGenerateArticleMutation } from "@/redux/features/articleApiSlice";

const topicsList = [
  "Technology", "AI", "Health", "Finance", "Travel",
  "Science", "Education", "Psychology", "Sports", "History",
  "Business", "Space Exploration", "Quantum Computing", "Cybersecurity",
  "Sustainability", "Mental Health", "Cryptocurrency", "Food & Nutrition",
  "Blockchain", "Climate Change", "Biotechnology", "Philosophy",
  "Gaming", "Social Media Trends", "Startups", "Leadership",
  "Machine Learning", "Augmented Reality", "Politics", "Ethics in Tech"
];

const TopicCloud = ({ onArticleGenerated }: { onArticleGenerated: () => void }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [generateArticle, { isLoading }] = useGenerateArticleMutation();

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleCustomTopic = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic)) {
      setSelectedTopics((prev) => [...prev, customTopic]);
      setCustomTopic("");
    }
  };

  const generateArticles = async () => {
    await Promise.all(selectedTopics.map(topic => generateArticle(topic)));
    onArticleGenerated();
    setSelectedTopics([]);
  };

  return (
    <motion.div 
      className="p-8 bg-white rounded-lg shadow-lg w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-4">Generate New Articles</h2>
      <p className="text-gray-600 text-center mb-6">Select topics or enter your own to generate fresh articles.</p>

      {/* Topics Selection */}
      <div className="max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg shadow-inner scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {topicsList.map((topic) => (
          <motion.button
            key={topic}
            className={`px-4 py-2 text-sm rounded-full border shadow-sm transition-all duration-300 ${
              selectedTopics.includes(topic) 
                ? "bg-blue-600 text-white shadow-lg scale-105" 
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            onClick={() => toggleTopic(topic)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {topic}
          </motion.button>
        ))}
      </div>

      {/* Custom Topic Input */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 justify-center">
        <input
          type="text"
          className="border rounded-full p-2 px-4 text-gray-700 w-72 focus:ring-2 focus:ring-blue-400"
          placeholder="Enter custom topic..."
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustomTopic()}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition"
          onClick={handleCustomTopic}
        >
          Add Topic
        </button>
      </div>

      {/* Selected Topics Display */}
      {selectedTopics.length > 0 && (
        <div className="mt-4 bg-gray-100 p-4 rounded-lg shadow-md flex flex-wrap gap-3 justify-center">
          {selectedTopics.map((topic, index) => (
            <motion.div 
              key={index} 
              className="px-4 py-2 bg-green-500 text-white rounded-full text-sm flex items-center gap-2 shadow-md"
              whileHover={{ scale: 1.1 }}
            >
              {topic}
              <button className="text-white font-bold" onClick={() => toggleTopic(topic)}>×</button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Generate Button */}
      <motion.button
        onClick={generateArticles}
        className="mt-6 px-6 py-3 rounded-full bg-green-500 text-white font-semibold shadow-md hover:bg-green-600 transition-all disabled:opacity-50 w-full sm:w-auto"
        disabled={isLoading || selectedTopics.length === 0}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isLoading ? "Generating..." : "Generate Articles"}
      </motion.button>
    </motion.div>
  );
};

export default TopicCloud;
