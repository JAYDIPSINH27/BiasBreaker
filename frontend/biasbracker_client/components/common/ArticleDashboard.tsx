"use client";

import { motion } from "framer-motion";
import { useGetUserArticlesQuery } from "@/redux/features/articleApiSlice";

const ArticleDashboard = ({ onSelectArticle }: { onSelectArticle: (article: any) => void }) => {
  const { data: articles = [], isLoading, isError } = useGetUserArticlesQuery(undefined);

  return (
    <motion.div className="p-10" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.2 } }}}>
      <h2 className="text-3xl font-extrabold mb-6 text-gray-800 text-center">Generated Articles</h2>

      {isLoading && <p className="text-blue-500 text-center animate-pulse">Loading articles...</p>}
      {isError && <p className="text-red-500 text-center">Failed to fetch articles.</p>}
      {!isLoading && articles.length === 0 && !isError && <p className="text-gray-500 text-center">No articles found. Select topics to generate new ones.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article: any) => (
          <motion.div key={article.id} className="border p-5 rounded-lg shadow-lg bg-white hover:shadow-xl transition-all cursor-pointer" whileHover={{ scale: 1.02 }} onClick={() => onSelectArticle(article)}>
            <h3 className="text-xl font-semibold text-gray-900">{article.title}</h3>
            <p className="text-gray-700 mt-2">{article.content?.introduction || "No introduction available."}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ArticleDashboard;
