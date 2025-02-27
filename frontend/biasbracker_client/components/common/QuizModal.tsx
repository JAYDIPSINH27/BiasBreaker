"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const QuizModal = ({ isOpen, onClose, quiz }: { isOpen: boolean; onClose: () => void; quiz: any }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  if (!isOpen || !quiz || !quiz.questions || quiz.questions.length === 0) return null;

  const currentQ = quiz.questions[currentQuestion];

  const handleNextQuestion = () => {
    if (selectedAnswer === currentQ.answer) {
      setScore(score + 1);
    }

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
    } else {
      setQuizCompleted(true);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-900">Quiz</h2>

        {quizCompleted ? (
          <div className="mt-6 text-center">
            <p className="text-xl font-semibold text-gray-700">Quiz Completed!</p>
            <p className="text-lg text-gray-600">Your Score: {score} / {quiz.questions.length}</p>
            <button
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
              onClick={onClose}
            >
              Close Quiz
            </button>
          </div>
        ) : (
          <>
            <p className="mt-4 font-semibold text-lg">{currentQ?.question || "No question available."}</p>

            <div className="mt-3 space-y-2">
              {currentQ?.options?.map((option: string, idx: number) => (
                <button
                  key={idx}
                  className={`block w-full px-4 py-2 border rounded ${
                    selectedAnswer === option ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
              >
                {currentQuestion < quiz.questions.length - 1 ? "Next" : "Finish"}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default QuizModal;
