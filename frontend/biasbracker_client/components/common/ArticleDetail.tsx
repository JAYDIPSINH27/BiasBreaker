"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  // existing queries/mutations from your code
  useGenerateArticleMutation,
  useGenerateAlternativePerspectiveMutation,
  useGetAlternativePerspectiveQuery,
  useGenerateQuizMutation,
  useGetQuizQuery,
} from "@/redux/features/articleApiSlice";

import { useAddUserPointsMutation } from "@/redux/features/userPointsApiSlice";

// ---- Eye Tracking RTK hooks ----
import {
  useCheckTobiAvailabilityQuery,
  useStartEyeTrackingSessionMutation,
  useStopEyeTrackingSessionMutation,
  useStartGazeTrackingMutation,
  useStopGazeTrackingMutation,
} from "@/redux/features/eyeTrackingApiSlice";

import AlternativePerspectiveModal from "@/components/common/AlternativePerspectiveModal";
import QuizModal from "@/components/common/QuizModal";
import Spinner from "@/components/common/Spinner";
import {
  FaTrophy,
  FaRegLightbulb,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

interface ArticleDetailProps {
  articleId: number | null;
  article: any; // The article object
  onBack: () => void;
}

const ArticleDetail = ({ articleId, article, onBack }: ArticleDetailProps) => {
  // ------------------ States & UI Controls ------------------
  const [isAltPerspectiveOpen, setAltPerspectiveOpen] = useState(false);
  const [isQuizUnlocked, setQuizUnlocked] = useState(false);
  const [isQuizOpen, setQuizOpen] = useState(false);

  // Reading countdown
  const [articleCountdown, setArticleCountdown] = useState(30);
  const [articlePointsAwarded, setArticlePointsAwarded] = useState(false);

  // Alternative perspective countdown
  const [altCountdown, setAltCountdown] = useState<number | null>(null);
  const [altPointsAwarded, setAltPointsAwarded] = useState(false);

  // Eye tracking state
  const [eyeTrackingSessionId, setEyeTrackingSessionId] = useState<string | null>(null);
  const [isGazeTracking, setIsGazeTracking] = useState(false);

  // Mutations from your code
  const [addUserPoints] = useAddUserPointsMutation();
  const [generateArticle, { isLoading: isGeneratingArticle }] = useGenerateArticleMutation();
  const [generateAltPerspective, { isLoading: isGeneratingAlt }] =
    useGenerateAlternativePerspectiveMutation();
  const [generateQuiz, { isLoading: isGeneratingQuiz }] = useGenerateQuizMutation();

  // Alternative Perspective Query
  const {
    data: alternativePerspective,
    isLoading: isAltLoading,
    refetch: refetchAltPerspective,
  } = useGetAlternativePerspectiveQuery(articleId, { skip: !articleId });

  // Quiz Query
  const {
    data: quiz,
    isLoading: isQuizLoading,
    refetch: refetchQuiz,
  } = useGetQuizQuery(articleId, {
    skip: !isQuizUnlocked || !articleId,
  });

  // ------- Eye Tracking RTK hooks -------
  const { data: tobiData } = useCheckTobiAvailabilityQuery();
  const [startEyeTrackingSession, { isLoading: isStartingSession }] =
    useStartEyeTrackingSessionMutation();
  const [stopEyeTrackingSession, { isLoading: isStoppingSession }] =
    useStopEyeTrackingSessionMutation();
  const [startGazeTracking, { isLoading: isStartingGaze }] =
    useStartGazeTrackingMutation();
  const [stopGazeTracking, { isLoading: isStoppingGaze }] =
    useStopGazeTrackingMutation();

  // ------------------ 1) Eye Tracking Logic ------------------
  const handleStartEyeTracking = async () => {
    try {
      const response = await startEyeTrackingSession().unwrap();
      if (response?.session_id) {
        setEyeTrackingSessionId(response.session_id);
        toast.success("Eye tracking session started!");
      } else {
        toast.error("Could not start eye tracking session.");
      }
    } catch (err) {
      console.error("Error starting eye tracking session:", err);
      toast.error("Failed to start eye tracking session");
    }
  };

  const handleStopEyeTracking = async () => {
    if (!eyeTrackingSessionId) return;
    try {
      await stopEyeTrackingSession(eyeTrackingSessionId).unwrap();
      setEyeTrackingSessionId(null);
      setIsGazeTracking(false);
      toast.success("Eye tracking session stopped!");
    } catch (err) {
      console.error("Error stopping eye tracking session:", err);
      toast.error("Failed to stop eye tracking session");
    }
  };

  const handleStartGazeTracking = async () => {
    if (!eyeTrackingSessionId) {
      toast.error("No active eye tracking session. Start session first.");
      return;
    }
    try {
      await startGazeTracking(eyeTrackingSessionId).unwrap();
      setIsGazeTracking(true);
      // If Tobi is not available, your server code should fallback to webcam
      if (tobiData?.tobi_available) {
        toast("Using Tobi device for gaze tracking...");
      } else {
        toast("Using Webcam for gaze tracking...");
      }
    } catch (err) {
      console.error("Error starting gaze tracking:", err);
      toast.error("Failed to start gaze tracking");
    }
  };

  const handleStopGazeTracking = async () => {
    if (!eyeTrackingSessionId) return;
    try {
      await stopGazeTracking(eyeTrackingSessionId).unwrap();
      setIsGazeTracking(false);
      toast.success("Gaze tracking stopped!");
    } catch (err) {
      console.error("Error stopping gaze tracking:", err);
      toast.error("Failed to stop gaze tracking");
    }
  };

  // Optionally, you could open a WebSocket or poll the server for “looking away” events.
  // For a quick demo approach, your server might send a "looking away" message you can catch.
  // You’d pop a toast like: toast("User is looking away!");  

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop session if it’s still active
      if (eyeTrackingSessionId) {
        stopEyeTrackingSession(eyeTrackingSessionId);
      }
    };
  }, [eyeTrackingSessionId, stopEyeTrackingSession]);

  // ------------------ 2) Article Generation Example ------------------
  const handleGenerateArticle = async () => {
    if (!articleId) {
      toast.error("No valid Article ID to generate content.");
      return;
    }
    try {
      await generateArticle("Any Topic").unwrap();
      toast.success("Article generated successfully!");
    } catch (err: any) {
      console.error("Error generating article:", err);
      toast.error(err?.data?.message || "Failed to generate article");
    }
  };

  // ------------------ 3) Reading Countdown for awarding points ------------------
  useEffect(() => {
    if (!article || !articleId || articlePointsAwarded) return;

    const interval = setInterval(() => {
      setArticleCountdown((prev) => {
        if (prev <= 1) {
          setArticlePointsAwarded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [article, articleId, articlePointsAwarded]);

  useEffect(() => {
    if (!articlePointsAwarded || !articleId) return;

    addUserPoints({ action: "article_view", article_id: articleId })
      .unwrap()
      .then((res) => {
        if (res?.success === true) {
          toast.success("+5 Points for reading!");
          if (res?.new_badges?.length > 0) {
            toast.success(`New Badge: ${res.new_badges.join(", ")}`);
          }
        } else {
          toast.error(res?.message || "Failed to award reading points.");
        }
      })
      .catch((error) => {
        console.error("Error updating points:", error);
        toast.error("Failed to update reading points.");
      });
  }, [articlePointsAwarded, articleId, addUserPoints]);

  // ------------------ 4) Alternative Perspective Logic ------------------
  const handleOpenAltPerspective = async () => {
    if (!articleId) {
      toast.error("No article to explore an alternative perspective.");
      return;
    }
    if (!alternativePerspective && !isAltLoading) {
      try {
        await generateAltPerspective(articleId).unwrap();
        await refetchAltPerspective();
      } catch (err: any) {
        console.error("Error generating alternative perspective:", err);
        toast.error(err?.data?.message || "Failed to generate alternative perspective");
        return;
      }
    }
    setAltPerspectiveOpen(true);

    // Start alt countdown if not started
    if (!altCountdown && !altPointsAwarded) {
      setAltCountdown(15);
    }
  };

  // alt perspective countdown
  useEffect(() => {
    if (altCountdown === null || altPointsAwarded || !articleId) return;
    const interval = setInterval(() => {
      setAltCountdown((prev) => {
        if (!prev || prev <= 1) {
          setAltPointsAwarded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [altCountdown, altPointsAwarded, articleId]);

  // Award alt perspective points
  useEffect(() => {
    if (!altPointsAwarded || !articleId) return;

    addUserPoints({ action: "alternative_click", article_id: articleId })
      .unwrap()
      .then((res) => {
        if (res?.success === true) {
          toast.success("+10 Points for exploring different views!");
          if (res?.new_badges?.length > 0) {
            toast.success(`New Badge: ${res.new_badges.join(", ")}`);
          }
        } else {
          toast.error(res?.message || "Failed to award alt perspective points.");
        }
      })
      .catch((error) => {
        console.error("Error updating points:", error);
        toast.error("Failed to update alt perspective points.");
      });
  }, [altPointsAwarded, articleId, addUserPoints]);

  const handleCompleteAlternativePerspective = () => {
    // Once user finishes reading alt perspective, unlock quiz
    setQuizUnlocked(true);
  };

  // ------------------ 5) Quiz Logic (quiz_attempt) ------------------
  const handleOpenQuiz = async () => {
    if (!articleId) {
      toast.error("No article to create quiz from.");
      return;
    }
    if (!quiz && !isQuizLoading) {
      try {
        await generateQuiz(articleId).unwrap();
        await refetchQuiz();
      } catch (err: any) {
        console.error("Error generating quiz:", err);
        toast.error(err?.data?.message || "Failed to generate quiz");
        return;
      }
    }
    setQuizOpen(true);

    // Award points for quiz attempt
    addUserPoints({ action: "quiz_attempt", article_id: articleId })
      .unwrap()
      .then((res) => {
        if (res?.success === true) {
          toast.success("+15 Points for attempting the quiz!");
          if (res?.new_badges?.length > 0) {
            toast.success(`New Badge: ${res.new_badges.join(", ")}`);
          }
        } else {
          toast.error(res?.message || "Failed to award quiz attempt points.");
        }
      })
      .catch((error) => {
        console.error("Error awarding quiz attempt points:", error);
        toast.error("Failed to award quiz attempt points.");
      });
  };

  // ------------------ Render ------------------
  return (
    <motion.div
      className="relative h-screen max-h-screen flex gap-6 p-4 md:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="
          absolute flex items-center gap-2
          top-4 left-4
          bg-gray-200 text-gray-700
          text-sm px-3 py-2
          rounded-md shadow-sm
          hover:bg-gray-300
          transition
        "
      >
        <FaArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      {/* ------------------ Left: Article Content ------------------ */}
      <div className="w-3/4 bg-white shadow-lg rounded-lg p-4 md:p-5 flex flex-col max-h-full overflow-hidden">
        {/* If there's no article, show a "Generate Article" button */}
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
            <h1 className="text-lg md:text-xl font-bold text-gray-900 text-center">
              {article.title || "No Title Available"}
            </h1>

            <p className="text-gray-500 text-xs text-center mt-1">
              <span className="font-semibold">Perspective:</span>{" "}
              {article.perspective || "Unknown"} |{" "}
              <span className="font-semibold">Cognitive Bias:</span>{" "}
              {article.cognitive_bias || "Unknown"} |{" "}
              <span className="font-semibold">Word Count:</span>{" "}
              {article.word_count || "N/A"}
            </p>

            <div className="flex-1 overflow-y-auto mt-3 pr-2">
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
          </>
        )}
      </div>

      {/* ------------------ Right: Action/Utility Cards ------------------ */}
      <div className="w-1/4 flex flex-col space-y-3">

        {/* 1) Eye Tracking Card */}
        <div className="border p-3 rounded-lg shadow-md bg-white hover:shadow-lg transition-all flex flex-col space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FaEye /> Eye Tracking
          </h3>
          {!eyeTrackingSessionId ? (
            <button
              onClick={handleStartEyeTracking}
              disabled={isStartingSession}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {isStartingSession ? "Starting..." : "Start Session"}
            </button>
          ) : (
            <button
              onClick={handleStopEyeTracking}
              disabled={isStoppingSession}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              {isStoppingSession ? "Stopping..." : "Stop Session"}
            </button>
          )}

          {/* Start/Stop Gaze Tracking (within the session) */}
          {eyeTrackingSessionId && !isGazeTracking ? (
            <button
              onClick={handleStartGazeTracking}
              disabled={isStartingGaze}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {isStartingGaze ? "Starting Gaze..." : "Start Gaze Tracking"}
            </button>
          ) : null}
          {eyeTrackingSessionId && isGazeTracking ? (
            <button
              onClick={handleStopGazeTracking}
              disabled={isStoppingGaze}
              className="px-3 py-1 text-xs bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              {isStoppingGaze ? "Stopping..." : "Stop Gaze Tracking"}
            </button>
          ) : null}

          {/* Tobi or Webcam? */}
          {tobiData && (
            <p className="text-xs text-gray-500 mt-2">
              {tobiData.tobi_available
                ? "Tobi Eye Tracker detected!"
                : "No Tobi found, using webcam"}
            </p>
          )}
        </div>

        {/* 2) Reading Countdown Card (existing) */}
        {article && !articlePointsAwarded && (
          <div className="border p-3 rounded-lg shadow-md bg-white hover:shadow-lg transition-all text-center">
            <p className="text-sm text-gray-500">
              Points for reading in: {articleCountdown}s
            </p>
          </div>
        )}

        {/* 3) Alternative Perspective Card (existing) */}
        <div
          className={`border p-3 rounded-lg shadow-md transition-all flex items-center space-x-2 ${
            article ? "bg-white hover:shadow-lg" : "bg-gray-200 opacity-50"
          }`}
        >
          <FaRegLightbulb className="text-yellow-500 text-lg" />
          <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-900">
              Alternative Perspective
            </h3>
            <button
              className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition w-full flex justify-center items-center"
              onClick={handleOpenAltPerspective}
              disabled={!article || isGeneratingAlt}
            >
              {isGeneratingAlt ? (
                <Spinner size="sm" />
              ) : isAltLoading ? (
                "Loading..."
              ) : (
                "Explore More"
              )}
            </button>

            {/* Alt countdown if started */}
            {altCountdown !== null && !altPointsAwarded && article && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Points in: {altCountdown}s
              </p>
            )}
          </div>
        </div>

        {/* 4) Quiz Card (existing) */}
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
      </div>

      {/* Modals for alt perspective & quiz */}
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
