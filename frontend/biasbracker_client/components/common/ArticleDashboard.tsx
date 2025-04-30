"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetUserArticlesQuery } from "@/redux/features/articleApiSlice";
import { FiRefreshCw, FiSearch, FiChevronDown } from "react-icons/fi";
import { BsArrowRightCircle } from "react-icons/bs";

// Animation variants
const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  hover: { scale: 1.02, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }
};
const buttonVariants = { hover: { scale: 1.05 }, tap: { scale: 0.95 } };

// Sort options
const SORT_OPTIONS = [
  { label: 'Newest', fn: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  { label: 'Oldest', fn: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
  { label: 'A–Z', fn: (a, b) => a.title.localeCompare(b.title) },
  { label: 'Z–A', fn: (a, b) => b.title.localeCompare(a.title) }
];

// Border colors for cards
const CARD_BORDER_COLORS = [
  'border-blue-300',
  'border-green-300',
  'border-pink-300',
  'border-purple-300',
  'border-yellow-300'
];

const ArticleDashboard = ({ onSelectArticle }) => {
  const { data: articles = [], isLoading, isError, refetch } = useGetUserArticlesQuery();
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
  const [showSort, setShowSort] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  // Unique topics for filter
  const topics = useMemo(() => Array.from(
    new Set(articles.map(a => a.topic).filter(Boolean))
  ), [articles]);
  const [activeTopic, setActiveTopic] = useState("");

  // Filter and sort
  const filtered = useMemo(() => {
    let arr = articles.filter(a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.introduction.toLowerCase().includes(search.toLowerCase())
    );
    if (activeTopic) arr = arr.filter(a => a.topic === activeTopic);
    return arr.slice().sort(sortOption.fn);
  }, [articles, search, activeTopic, sortOption]);

  const paged = useMemo(() => filtered.slice(0, currentPage * perPage), [filtered, currentPage]);

  const toggleExpand = id => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      className="p-6 max-w-7xl mx-auto bg-white rounded-2xl shadow mt-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Controls */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">📰 My Articles</h2>
          <p className="text-gray-600">Filter, search, and explore your collection.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Topic Filter */}
          <select
            value={activeTopic}
            onChange={e => setActiveTopic(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Topics</option>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="px-3 py-2 bg-gray-100 rounded-lg flex items-center hover:bg-gray-200"
            >
              {sortOption.label} <FiChevronDown className="ml-1" />
            </button>
            {showSort && (
              <ul className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg z-10">
                {SORT_OPTIONS.map(opt => (
                  <li
                    key={opt.label}
                    onClick={() => { setSortOption(opt); setShowSort(false); }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >{opt.label}</li>
                ))}
              </ul>
            )}
          </div>
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {/* Refresh Button */}
          <motion.button
            onClick={refetch}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          ><FiRefreshCw /></motion.button>
        </div>
      </header>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: perPage }).map((_, i) => (
            <div key={i} className="h-60 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-red-500 text-center">Unable to load articles.</p>
      ) : paged.length === 0 ? (
        <p className="text-gray-500 text-center">No articles match the criteria.</p>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {paged.map((article, idx) => {
            const borderColor = CARD_BORDER_COLORS[idx % CARD_BORDER_COLORS.length];
            return (
              <motion.div
                key={article.id}
                className={`bg-gray-50 rounded-lg ${borderColor} border-2 overflow-hidden flex flex-col min-h-[20rem]`}
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="p-4 flex-1 flex flex-col">
                  <div className="mb-4 font-semibold text-gray-900 text-2xl break-words">{article.title}</div>
                  <p className="text-gray-600 mb-4 flex-1 line-clamp-3">{article.introduction}</p>
                  <button
                    onClick={() => toggleExpand(article.id)}
                    className="flex items-center text-blue-600 mb-2"
                  >
                    <FiChevronDown className={`${expanded.has(article.id) ? 'rotate-180' : ''} transition-transform`} />
                    <span className="ml-1">Details</span>
                  </button>
                  <AnimatePresence>
                    {expanded.has(article.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden text-gray-700 mb-4 text-sm"
                      >
                        <p className="mb-2"><strong>Conclusion:</strong> {article.conclusion}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">Bias: {article.cognitive_bias}</span>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Perspective: {article.perspective}</span>
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{article.word_count} words</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="mt-auto flex justify-end">
                    <BsArrowRightCircle
                      className="text-gray-400 hover:text-blue-600 cursor-pointer transition"
                      size={24}
                      onClick={() => onSelectArticle(article.id, article)}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Load More */}
      {filtered && paged.length < filtered.length && (
        <div className="mt-8 text-center">
          <motion.button
            onClick={() => setCurrentPage(prev => prev + 1)}
            variants={buttonVariants}
            whileHover="hover"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
          >Load More</motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default ArticleDashboard;
