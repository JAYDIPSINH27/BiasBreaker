"use client";

import { motion } from "framer-motion";

const AlternativePerspectiveModal = ({
  isOpen,
  onClose,
  alternative,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  alternative: any;
  onComplete: () => void;
}) => {
  if (!isOpen || !alternative) return null;

  const { title, introduction, sections, conclusion } = alternative.content || {};

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900">{title || "Alternative Perspective"}</h2>

        {/* Introduction */}
        <p className="mt-4 text-gray-700">{introduction || "No introduction available."}</p>

        {/* Sections */}
        <div className="mt-4 space-y-4">
          {sections && sections.length > 0 ? (
            sections.map((section: any, idx: number) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900">{section.heading || "No Heading"}</h3>
                <p className="text-gray-700 mt-2">{section.content || "No content available."}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No sections available.</p>
          )}
        </div>

        {/* Conclusion */}
        <p className="mt-6 text-gray-800 font-medium italic">{conclusion || "No conclusion available."}</p>

        {/* Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            onClick={() => {
              onComplete();
              onClose();
            }}
          >
            Mark as Read
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AlternativePerspectiveModal;
