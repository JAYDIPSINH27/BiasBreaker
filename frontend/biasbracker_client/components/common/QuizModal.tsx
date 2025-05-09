"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { toast } from "react-hot-toast";
import { useAddUserPointsMutation } from "@/redux/features/userPointsApiSlice";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: any;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, quiz }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { width, height } = useWindowSize();
  const [addUserPoints] = useAddUserPointsMutation();

  if (!isOpen || !quiz || !quiz.questions || quiz.questions.length === 0) return null;

  const currentQ = quiz.questions[currentQuestion];

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQ.answer;
    const updatedScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      toast.success("Correct!");
    }

    setScore(updatedScore);
    setSelectedAnswer(null);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);

      const percentage = (updatedScore / quiz.questions.length) * 100;
      if (percentage >= 80) {
        setShowConfetti(true);

        addUserPoints({ action: "quiz_score_high", article_id: quiz.article_id })
          .unwrap()
          .then((res) => {
            if (res.success) {
              toast.success("+20 Bonus Points for High Score!");
              if (res.new_badges?.length > 0) {
                toast.success(`🏅 New Badge: ${res.new_badges.join(", ")}`);
              }
            } else {
              toast(res.message || "Bonus already awarded.");
            }
          })
          .catch(() => {
            toast.error("Failed to record high score bonus.");
          });
      }
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
    setShowConfetti(false);
    toast("Retrying Quiz! 🔄");
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {showConfetti && <Confetti width={width} height={height} />}

      <motion.div
        className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full text-center relative"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <h2 className="text-2xl font-extrabold text-gray-900">Quiz</h2>

        {quizCompleted ? (
          <div className="mt-6">
            <motion.p className="text-xl font-semibold text-gray-700">
              Quiz Completed!
            </motion.p>
            <motion.p className="text-lg text-gray-600 mt-2">
              Your Score: <span className="font-bold">{score}</span> / {quiz.questions.length}
            </motion.p>

            {showConfetti && (
              <p className="text-green-600 font-semibold mt-2">
                🎉 Amazing! You scored over 80%! 🎉
              </p>
            )}

            <div className="mt-6 flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600"
                onClick={handleRetry}
              >
                Retry Quiz 🔄
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <motion.div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <p className="mt-4 font-semibold text-lg">
              Question {currentQuestion + 1} / {quiz.questions.length}
            </p>

            <p className="mt-2 font-semibold text-gray-800">{currentQ.question}</p>

            <div className="mt-3 space-y-2">
              {currentQ.options.map((option: string, idx: number) => {
                let bgClass = "bg-gray-100 hover:bg-gray-200";
                if (selectedAnswer) {
                  if (option === currentQ.answer) {
                    bgClass = "bg-green-500 text-white"; // correct answer
                  } else if (option === selectedAnswer) {
                    bgClass = "bg-red-500 text-white"; // wrong answer selected
                  } else {
                    bgClass = "bg-gray-200";
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    className={`block w-full px-4 py-2 border rounded-lg transition ${bgClass}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAnswer(option)}
                    disabled={!!selectedAnswer}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>

            {/* Show correct answer below after selection */}
            {selectedAnswer && selectedAnswer !== currentQ.answer && (
              <p className="text-sm text-blue-600 mt-2">
                Correct Answer: <strong>{currentQ.answer}</strong>
              </p>
            )}

            <div className="mt-6 flex justify-between">
              <button className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded" onClick={onClose}>
                Close
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
              >
                {currentQuestion < quiz.questions.length - 1 ? "Next" : "Finish"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QuizModal;
