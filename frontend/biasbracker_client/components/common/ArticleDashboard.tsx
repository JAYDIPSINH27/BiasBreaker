"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGetUserArticlesQuery } from "@/redux/features/articleApiSlice";

const ArticleDashboard = ({ onSelectArticle }: { onSelectArticle: (articleId: number, article: any) => void }) => {
  const { data: articles = [], isLoading, isError, refetch } = useGetUserArticlesQuery();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div className="p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h2 className="text-3xl font-extrabold mb-6 text-gray-800 text-center">Available Articles</h2>

      {isLoading && <p className="text-blue-500 text-center animate-pulse">Loading articles...</p>}
      {isError && <p className="text-red-500 text-center">Failed to fetch articles. Try again later.</p>}
      {!isLoading && articles.length === 0 && !isError && <p className="text-gray-500 text-center">No articles found. Generate one above.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {articles.map((article: any) => (
          <motion.div
            key={article.id}
            className="border p-5 rounded-lg shadow-md bg-white hover:shadow-lg transition-all cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onMouseEnter={() => setHovered(article.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectArticle(article.id, article)} // Ensure correct article ID is passed
          >
            <h3 className="text-xl font-semibold text-gray-900">{article?.title || "No Title Available"}</h3>
            <p className="text-gray-600 mt-2">{article?.content?.introduction || "No introduction available."}</p>
            <p className="text-sm text-gray-500 mt-3">{hovered === article.id ? "Click to Read More" : ""}</p>
          </motion.div>
        ))}
      </div>

      {/* Refresh Button */}
      {/* <motion.button
        onClick={refetch}
        className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        Refresh Articles
      </motion.button> */}
    </motion.div>
  );
};

export default ArticleDashboard;
