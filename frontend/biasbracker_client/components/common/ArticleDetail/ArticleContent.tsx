import React from "react";
import Spinner from "@/components/common/Spinner";
import ExplainabilityInfo from "@/components/common/ExplainabilityInfo";

interface ArticleContentProps {
  article: any;
  handleGenerateArticle: () => void;
  isGeneratingArticle: boolean;
}

const ArticleContent: React.FC<ArticleContentProps> = ({
  article,
  handleGenerateArticle,
  isGeneratingArticle,
}) => {
  return (
    <div className=" bg-white shadow-lg rounded-lg p-6 md:p-8 flex flex-col max-h-full overflow-hidden relative">
      {!article ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 mb-4">No article found!</p>
          <button
            onClick={handleGenerateArticle}
            disabled={isGeneratingArticle}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {isGeneratingArticle ? "Generating..." : "Generate Article"}
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="border-b pb-3 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
              {article.title || "No Title Available"}
            </h1>
            <p className="text-gray-500 text-xs text-center mt-1 flex flex-wrap justify-center items-center gap-2">
              <span className="font-semibold">Perspective:</span>
              <span>{article.perspective || "Unknown"}</span>
              <ExplainabilityInfo
                category="perspectives"
                keyName={article.perspective}
              />

              <span>|</span>

              <span className="font-semibold">Cognitive Bias:</span>
              <span>{article.cognitive_bias || "Unknown"}</span>
              <ExplainabilityInfo
                category="biases"
                keyName={article.cognitive_bias}
              />

              <span>|</span>

              <span className="font-semibold">Word Count:</span>
              <span>{article.word_count || "N/A"}</span>
            </p>
          </header>
          {/* Body */}
          <div className="flex-1 overflow-y-auto pr-2">
            <p className="text-sm text-gray-700 leading-relaxed">
              {article.content?.introduction || "No introduction available."}
            </p>
            <div className="mt-4 space-y-4">
              {article.content?.sections?.map((section: any, idx: number) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-3">
                  <h3 className="text-md font-semibold text-gray-900">
                    {section.heading || "No Heading"}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {section.content || "No content available."}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-gray-800 font-medium text-sm italic">
              {article.content?.conclusion || "No conclusion available."}
            </p>
          </div>
          {/* GenAI warning */}
          <div className="mt-4 text-xs text-yellow-800 bg-yellow-100 p-2 rounded flex items-center">
            <ExplainabilityInfo category="warnings" keyName="genai" />
            <span className="ml-2">
              AI‑generated content – verify critical facts.
            </span>
          </div>

          
        </>
      )}
    </div>
  );
};

export default ArticleContent;
