"use client";

import { motion } from "framer-motion";

const ArticleDetail = ({ article, onBack }: { article: any; onBack: () => void }) => {
  return (
    <motion.div className="p-6 md:p-10 max-w-3xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
        ⬅ Back
      </button>
      <h2 className="text-4xl font-extrabold text-gray-800">{article?.title || "Untitled Article"}</h2>
      <p className="text-gray-700 text-lg mt-4">{article?.introduction || "No introduction available."}</p>
      <div className="mt-6 space-y-6">
        {article?.sections?.map((section: any, idx: number) => (
          <div key={idx}>
            <h3 className="text-2xl font-semibold text-gray-900">{section.heading}</h3>
            <p className="text-gray-700 text-lg">{section.content}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-gray-800 font-medium text-lg">{article?.conclusion || "No conclusion available."}</p>
    </motion.div>
  );
};

export default ArticleDetail;
