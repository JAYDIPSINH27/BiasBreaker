"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useGenerateArticleMutation } from "@/redux/features/articleApiSlice";

const DEFAULT_DISPLAY_COUNT = 12;
const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const chipVariants = { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } };
const buttonVariants = { hover: { scale: 1.03 }, tap: { scale: 0.97 } };

const TopicCloud = ({ onArticleGenerated }) => {
  const topicsList = useMemo(
    () => [
      "Technology", "AI", "Health", "Finance", "Travel",
      "Science", "Education", "Psychology", "Sports", "History",
      "Business", "Space Exploration", "Quantum Computing", "Cybersecurity",
      "Sustainability", "Mental Health", "Cryptocurrency", "Food & Nutrition",
      "Blockchain", "Climate Change", "Biotechnology", "Philosophy",
      "Gaming", "Social Media Trends", "Startups", "Leadership",
      "Machine Learning", "Augmented Reality", "Politics", "Ethics in Tech"
    ],
    []
  );

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [generateArticle, { isLoading }] = useGenerateArticleMutation();

  const visibleTopics = useMemo(() => {
    const filtered = topicsList.filter(t =>
      t.toLowerCase().includes(search.toLowerCase())
    );
    return showAll ? filtered : filtered.slice(0, DEFAULT_DISPLAY_COUNT);
  }, [topicsList, search, showAll]);

  const toggleTopic = topic => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const addCustom = () => {
    const trimmed = customTopic.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics(prev => [...prev, trimmed]);
    }
    setCustomTopic("");
  };

  const clearAll = () => setSelectedTopics([]);

  const generateArticles = async () => {
    if (!selectedTopics.length) return;
    await generateArticle(selectedTopics.join(", "));
    onArticleGenerated();
    setSelectedTopics([]);
  };

  return (
    <motion.div
      className="p-8 bg-gradient-to-b from-gray-50 to-white rounded-3xl shadow-lg max-w-4xl mx-auto"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">
        Generate Articles
      </h2>
      <p className="text-gray-600 text-center mb-6">Pick topics or add your own!</p>

      {/* Search Bar */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border rounded-full w-full"
        />
      </div>

      {/* Topics Cloud */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {visibleTopics.map(topic => (
          <motion.button
            key={topic}
            variants={chipVariants}
            className={`px-3 py-1 text-sm rounded-full border ${
selectedTopics.includes(topic)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => toggleTopic(topic)}
            whileHover="hover"
            whileTap="tap"
          >
            {topic}
          </motion.button>
        ))}
      </motion.div>

      {/* Show More/Less */}
      {topicsList.filter(t => t.toLowerCase().includes(search.toLowerCase())).length > DEFAULT_DISPLAY_COUNT && (
        <button
          onClick={() => setShowAll(prev => !prev)}
          className="flex mx-auto mb-4 items-center text-blue-600"
        >
          {showAll ? (
            <>Show Less <FiChevronUp className="ml-1" /></>
          ) : (
            <>Show All <FiChevronDown className="ml-1" /></>
          )}
        </button>
      )}

      {/* Custom Input & Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <input
          type="text"
          className="flex-1 border rounded-full py-2 px-4"
          placeholder="Custom topic..."
          value={customTopic}
          onChange={e => setCustomTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
        />
        <motion.button
          onClick={addCustom}
          className="px-6 py-2 bg-green-500 text-white rounded-full"
          variants={buttonVariants}
          whileHover="hover"
        >
          Add
        </motion.button>
        <motion.button
          onClick={clearAll}
          className="px-4 py-2 bg-red-200 text-red-800 rounded-full"
          variants={buttonVariants}
          whileHover="hover"
          disabled={!selectedTopics.length}
        >
          Clear All
        </motion.button>
      </div>

      {/* Selected Topics */}
      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedTopics.map((t, i) => (
            <motion.div
              key={i}
              className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-full"
              variants={chipVariants}
            >
              {t}
              <button className="ml-2" onClick={() => toggleTopic(t)}>×</button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Generate Button */}
      <motion.button
        onClick={generateArticles}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-full disabled:opacity-50"
        variants={buttonVariants}
        whileHover="hover"
        disabled={isLoading || !selectedTopics.length}
      >
        {isLoading ? 'Generating...' : 'Generate'}
      </motion.button>
    </motion.div>
  );
};

export default TopicCloud;
