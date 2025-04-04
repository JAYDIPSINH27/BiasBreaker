import React from "react";
import { FaTrophy } from "react-icons/fa";
import Spinner from "@/components/common/Spinner";

interface QuizCardProps {
  article: any;
  isQuizUnlocked: boolean;
  isGeneratingQuiz: boolean;
  isQuizLoading: boolean;
  handleOpenQuiz: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({
  article,
  isQuizUnlocked,
  isGeneratingQuiz,
  isQuizLoading,
  handleOpenQuiz,
}) => {
  return (
    <div
      className={`border p-3 rounded-lg shadow-md transition-all flex items-center space-x-2 ${
        isQuizUnlocked && article
          ? "bg-white hover:shadow-lg"
          : "bg-gray-200 opacity-75 cursor-not-allowed"
      }`}
    >
      <FaTrophy className="text-green-500 text-lg" />
      <div className="w-full">
        <h3 className="text-sm font-semibold text-gray-900">Take a Quiz</h3>
        <button
          className={`mt-2 px-3 py-1 text-xs rounded-lg shadow-md transition w-full flex items-center justify-center ${
            isQuizUnlocked && article
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-400 text-gray-600"
          }`}
          onClick={handleOpenQuiz}
          disabled={!isQuizUnlocked || !article || isGeneratingQuiz}
        >
          {isGeneratingQuiz ? (
            <Spinner size="sm" />
          ) : isQuizLoading ? (
            "Loading..."
          ) : (
            "Start Quiz"
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
