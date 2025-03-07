"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  useGetAlternativePerspectiveQuery, 
  useGenerateAlternativePerspectiveMutation, 
  useGetQuizQuery, 
  useGenerateQuizMutation 
} from "@/redux/features/articleApiSlice";
import { useAddUserPointsMutation } from "@/redux/features/userPointsApiSlice";
import { toast } from "react-hot-toast";
import AlternativePerspectiveModal from "@/components/common/AlternativePerspectiveModal";
import QuizModal from "@/components/common/QuizModal";

const ArticleDetail = ({ articleId, article, onBack }: { articleId: number | null; article: any; onBack: () => void }) => {
  const [isAltPerspectiveOpen, setAltPerspectiveOpen] = useState(false);
  const [isQuizUnlocked, setQuizUnlocked] = useState(false);
  const [isQuizOpen, setQuizOpen] = useState(false);
  const [addUserPoints] = useAddUserPointsMutation();

  // Fetch Alternative Perspective (Skip until generated)
  const { data: alternativePerspective, isLoading: isAltLoading, refetch: refetchAltPerspective } = useGetAlternativePerspectiveQuery(articleId, {
    skip: !articleId,
  });

  // Fetch Quiz (Only fetch if quiz is unlocked)
  const { data: quiz, isLoading: isQuizLoading, refetch: refetchQuiz } = useGetQuizQuery(articleId, {
    skip: !isQuizUnlocked || !articleId,
  });

  // Mutations for generating missing content
  const [generateAltPerspective, { isLoading: isGeneratingAlt }] = useGenerateAlternativePerspectiveMutation();
  const [generateQuiz, { isLoading: isGeneratingQuiz }] = useGenerateQuizMutation();

  useEffect(() => {
    if (article && articleId) {
      const viewedArticles = JSON.parse(localStorage.getItem("viewedArticles") || "[]");

      if (!viewedArticles.includes(articleId)) {
        addUserPoints("article_view")
          .unwrap()
          .then((res) => {
            toast.success("+5 Points for reading!");
            if (res.new_badges.length > 0) {
              toast.success(`🏅 New Badge Earned: ${res.new_badges.join(", ")}`);
            }
          })
          .catch(() => toast.error("Failed to update points."));

        // Mark this article as viewed
        localStorage.setItem("viewedArticles", JSON.stringify([...viewedArticles, articleId]));
      }
    }
  }, [article, articleId]);


  const handleOpenAltPerspective = async () => {
    if (!alternativePerspective && !isAltLoading) {
      await generateAltPerspective(articleId);
      await refetchAltPerspective();
    }
    
    addUserPoints("alternative_click")
      .unwrap()
      .then((res) => {
        toast.success("+10 Points for exploring different views!");
        if (res.new_badges.length > 0) {
          toast.success(`🏅 New Badge Earned: ${res.new_badges.join(", ")}`);
        }
      })
      .catch(() => toast.error("Failed to update points."));

    setAltPerspectiveOpen(true);
  };

  const handleCompleteAlternativePerspective = () => {
    setQuizUnlocked(true);
  };

  const handleOpenQuiz = async () => {
    if (!quiz && !isQuizLoading) {
      await generateQuiz(articleId);
      await refetchQuiz();
    }
    setQuizOpen(true);
  };

  return (
    <motion.div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-row gap-6">
      {/* Left Side: Article Content (Made Wider) */}
      <div className="w-3/4 bg-white shadow-md rounded-lg p-5 relative">
        {/* Small Back Button */}
        <button 
          onClick={onBack} 
          className="absolute top-3 left-3 text-gray-500 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          ⬅ Back
        </button>

        {/* Smaller Title */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 text-center mt-8">{article?.title || "No Title Available"}</h1>

        {/* Display metadata correctly */}
        <p className="text-gray-500 text-xs text-center mt-2">
          <span className="font-semibold">Perspective:</span> {article?.perspective || "Unknown"} | 
          <span className="font-semibold"> Cognitive Bias:</span> {article?.cognitive_bias || "Unknown"} | 
          <span className="font-semibold"> Word Count:</span> {article?.word_count || "N/A"}
        </p>

        {/* Introduction */}
        <p className="text-sm text-gray-700 mt-4">{article?.content?.introduction || "No introduction available."}</p>

        {/* Sections */}
        <div className="mt-4 space-y-3">
          {article?.content?.sections?.map((section: any, idx: number) => (
            <div key={idx} className="border-l-4 border-blue-500 pl-3">
              <h3 className="text-md md:text-lg font-semibold text-gray-900">{section.heading || "No Heading"}</h3>
              <p className="text-xs md:text-sm text-gray-700 mt-1">{section.content || "No content available."}</p>
            </div>
          ))}
        </div>

        {/* Conclusion */}
        <p className="mt-4 text-gray-800 font-medium text-sm italic">{article?.content?.conclusion || "No conclusion available."}</p>
      </div>

      {/* Right Side: Cards */}
      <div className="w-1/4 flex flex-col space-y-3">
        {/* Alternative Perspective Card */}
        <div className="border p-3 md:p-4 rounded-lg shadow-md bg-white hover:shadow-lg transition-all">
          <h3 className="text-sm font-semibold text-gray-900">Alternative Viewpoint</h3>
          {isGeneratingAlt ? (
            <p className="text-gray-600 mt-2 animate-pulse text-xs">Generating Alternative Perspective...</p>
          ) : (
            <button
              className="mt-3 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition w-full"
              onClick={handleOpenAltPerspective}
              disabled={isGeneratingAlt}
            >
              {isAltLoading ? "Loading..." : "Explore More"}
            </button>
          )}
        </div>

        {/* Quiz Card */}
        <div className={`border p-3 md:p-4 rounded-lg shadow-md transition-all ${isQuizUnlocked ? "bg-white hover:shadow-lg" : "bg-gray-200 opacity-75 cursor-not-allowed"}`}>
          <h3 className="text-sm font-semibold text-gray-900">Take a Quiz</h3>
          {isGeneratingQuiz ? (
            <p className="text-gray-600 mt-2 animate-pulse text-xs">Generating Quiz...</p>
          ) : (
            <button 
              className={`mt-3 px-3 py-1 text-xs rounded-lg shadow-md transition w-full ${isQuizUnlocked ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-400 text-gray-600"}`}
              onClick={handleOpenQuiz}
              disabled={!isQuizUnlocked || isGeneratingQuiz}
            >
              {isQuizLoading ? "Loading..." : "Start Quiz"}
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <AlternativePerspectiveModal 
        isOpen={isAltPerspectiveOpen} 
        onClose={() => setAltPerspectiveOpen(false)} 
        alternative={alternativePerspective} 
        onComplete={handleCompleteAlternativePerspective} 
      />
      
      <QuizModal 
        isOpen={isQuizOpen} 
        onClose={() => setQuizOpen(false)} 
        quiz={quiz} 
      />
    </motion.div>
  );
};

export default ArticleDetail;
