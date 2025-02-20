"use client";

import { motion } from "framer-motion";

const ArticleDetail = ({ article, onBack }: { article: any; onBack: () => void }) => {
  return (
    <motion.div className="p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">Back</button>
      <h2 className="text-3xl font-extrabold mb-6 text-gray-800">{article.title}</h2>
      <p className="text-gray-700">{article.content?.introduction || "No introduction available."}</p>
      {article.sections?.map((section: any, idx: number) => (
        <div key={idx} className="mt-4">
          <h3 className="text-xl font-semibold text-gray-900">{section.heading}</h3>
          <p className="text-gray-700">{section.content}</p>
        </div>
      ))}
      <p className="mt-6 text-gray-800 font-medium">{article.content?.conclusion || "No conclusion available."}</p>
    </motion.div>
  );
};

export default ArticleDetail;
