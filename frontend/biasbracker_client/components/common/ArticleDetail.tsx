"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
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
import EyeTrackingSocketListener from "@/components/common/EyeTrackingSocketListener";
import { FaTrophy, FaRegLightbulb, FaArrowLeft, FaEye } from "react-icons/fa";

interface ArticleDetailProps {
  articleId: number | null;
  article: any; // The article object
  onBack: () => void;
}

/* --------------------- Custom Hook --------------------- */
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

/* --------------------- Sub Components --------------------- */

// Article content card with improved header and layout
const ArticleContent = ({
  article,
  handleGenerateArticle,
  isGeneratingArticle,
}: {
  article: any;
  handleGenerateArticle: () => void;
  isGeneratingArticle: boolean;
}) => {
  return (
    <div className="w-3/4 bg-white shadow-lg rounded-lg p-6 md:p-8 flex flex-col max-h-full overflow-hidden relative">
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
            <p className="text-gray-500 text-xs text-center mt-1">
              <span className="font-semibold">Perspective:</span>{" "}
              {article.perspective || "Unknown"} |{" "}
              <span className="font-semibold">Cognitive Bias:</span>{" "}
              {article.cognitive_bias || "Unknown"} |{" "}
              <span className="font-semibold">Word Count:</span>{" "}
              {article.word_count || "N/A"}
            </p>
          </header>
          {/* Article Body */}
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
        </>
      )}
    </div>
  );
};

// Eye Tracking Card
const EyeTrackingCard = ({
  tobiData,
  eyeTrackingSessionId,
  isGazeTracking,
  handleStartEyeTracking,
  handleStopEyeTracking,
  handleStartGazeTracking,
  handleStopGazeTracking,
  isStartingSession,
  isStoppingSession,
  isStartingGaze,
  isStoppingGaze,
}: {
  tobiData: any;
  eyeTrackingSessionId: string | null;
  isGazeTracking: boolean;
  handleStartEyeTracking: () => void;
  handleStopEyeTracking: () => void;
  handleStartGazeTracking: () => void;
  handleStopGazeTracking: () => void;
  isStartingSession: boolean;
  isStoppingSession: boolean;
  isStartingGaze: boolean;
  isStoppingGaze: boolean;
}) => {
  return (
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

      {eyeTrackingSessionId && (
        <>
          {!isGazeTracking ? (
            <button
              onClick={handleStartGazeTracking}
              disabled={isStartingGaze}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {isStartingGaze ? "Starting Gaze..." : "Start Gaze Tracking"}
            </button>
          ) : (
            <button
              onClick={handleStopGazeTracking}
              disabled={isStoppingGaze}
              className="px-3 py-1 text-xs bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              {isStoppingGaze ? "Stopping..." : "Stop Gaze Tracking"}
            </button>
          )}
        </>
      )}

      {tobiData && (
        <p className="text-xs text-gray-500 mt-2">
          {tobiData.tobi_available
            ? "Tobi Eye Tracker detected!"
            : "No Tobi found, using webcam"}
        </p>
      )}
    </div>
  );
};

// Reading Countdown Card
const ReadingCountdownCard = ({
  article,
  articlePointsAwarded,
  articleCountdown,
}: {
  article: any;
  articlePointsAwarded: boolean;
  articleCountdown: number;
}) => {
  if (!article || articlePointsAwarded) return null;
  return (
    <div className="border p-3 rounded-lg shadow-md bg-white hover:shadow-lg transition-all text-center">
      <p className="text-sm text-gray-500">
        Points for reading in: {articleCountdown}s
      </p>
    </div>
  );
};

// Alternative Perspective Card
const AlternativePerspectiveCard = ({
  article,
  isGeneratingAlt,
  isAltLoading,
  altCountdown,
  altPointsAwarded,
  handleOpenAltPerspective,
}: {
  article: any;
  isGeneratingAlt: boolean;
  isAltLoading: boolean;
  altCountdown: number | null;
  altPointsAwarded: boolean;
  handleOpenAltPerspective: () => void;
}) => {
  return (
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
        {altCountdown !== null && !altPointsAwarded && article && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Points in: {altCountdown}s
          </p>
        )}
      </div>
    </div>
  );
};

// Quiz Card
const QuizCard = ({
  article,
  isQuizUnlocked,
  isGeneratingQuiz,
  isQuizLoading,
  handleOpenQuiz,
}: {
  article: any;
  isQuizUnlocked: boolean;
  isGeneratingQuiz: boolean;
  isQuizLoading: boolean;
  handleOpenQuiz: () => void;
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

// Live Gaze Overlay Component with scaling using window size hook
const LiveGazeOverlay = ({
  gaze,
}: {
  gaze: { x: number; y: number } | null;
}) => {
  const { width, height } = useWindowSize();
  if (!gaze) return null;

  let left, top;
  // If the values are normalized (<= 1), assume they're in [0, 1] range.
  if (gaze.x <= 1 && gaze.y <= 1) {
    left = gaze.x * width;
    top = gaze.y * height;
  } else {
    // Otherwise, assume they are based on a 1920x1080 resolution.
    const scaleX = width / 1920;
    const scaleY = height / 1080;
    left = gaze.x * scaleX;
    top = gaze.y * scaleY;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: left,
        top: top,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "red",
          opacity: 0.7,
        }}
      ></div>
    </div>
  );
};


/* --------------------- Main Component --------------------- */

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

  // Live gaze state for overlay (default to null)
  const [liveGaze, setLiveGaze] = useState<{ x: number; y: number } | null>(null);

  // ------------------ RTK Mutations & Queries ------------------
  const [addUserPoints] = useAddUserPointsMutation();
  const [generateArticle, { isLoading: isGeneratingArticle }] = useGenerateArticleMutation();
  const [generateAltPerspective, { isLoading: isGeneratingAlt }] = useGenerateAlternativePerspectiveMutation();
  const [generateQuiz, { isLoading: isGeneratingQuiz }] = useGenerateQuizMutation();

  const {
    data: alternativePerspective,
    isLoading: isAltLoading,
    refetch: refetchAltPerspective,
  } = useGetAlternativePerspectiveQuery(articleId, { skip: !articleId });

  const {
    data: quiz,
    isLoading: isQuizLoading,
    refetch: refetchQuiz,
  } = useGetQuizQuery(articleId, {
    skip: !isQuizUnlocked || !articleId,
  });

  const { data: tobiData } = useCheckTobiAvailabilityQuery();
  const [startEyeTrackingSession, { isLoading: isStartingSession }] = useStartEyeTrackingSessionMutation();
  const [stopEyeTrackingSession, { isLoading: isStoppingSession }] = useStopEyeTrackingSessionMutation();
  const [startGazeTracking, { isLoading: isStartingGaze }] = useStartGazeTrackingMutation();
  const [stopGazeTracking, { isLoading: isStoppingGaze }] = useStopGazeTrackingMutation();

  // ------------------ Eye Tracking Handlers ------------------
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
      setLiveGaze(null); // Clear the live gaze overlay when session stops
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eyeTrackingSessionId) {
        stopEyeTrackingSession(eyeTrackingSessionId);
      }
    };
  }, [eyeTrackingSessionId, stopEyeTrackingSession]);

  // ------------------ Article Generation ------------------
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

  // ------------------ Reading Countdown ------------------
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

  // ------------------ Alternative Perspective ------------------
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
        toast.error(
          err?.data?.message || "Failed to generate alternative perspective"
        );
        return;
      }
    }
    setAltPerspectiveOpen(true);
    if (!altCountdown && !altPointsAwarded) {
      setAltCountdown(15);
    }
  };

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
          toast.error(
            res?.message || "Failed to award alt perspective points."
          );
        }
      })
      .catch((error) => {
        console.error("Error updating points:", error);
        toast.error("Failed to update alt perspective points.");
      });
  }, [altPointsAwarded, articleId, addUserPoints]);

  const handleCompleteAlternativePerspective = () => {
    setQuizUnlocked(true);
  };

  // ------------------ Quiz Logic ------------------
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
      {/* Improved Back Button */}
      <button
        onClick={onBack}
        className="absolute z-10 top-4 left-4 flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full shadow-xl hover:bg-gray-700 transition"
      >
        <FaArrowLeft className="h-6 w-6 text-white" />
      </button>

      {/* Left: Article Content */}
      <ArticleContent
        article={article}
        handleGenerateArticle={handleGenerateArticle}
        isGeneratingArticle={isGeneratingArticle}
      />

      {/* Right: Action/Utility Cards */}
      <div className="w-1/4 flex flex-col space-y-3">
        <EyeTrackingCard
          tobiData={tobiData}
          eyeTrackingSessionId={eyeTrackingSessionId}
          isGazeTracking={isGazeTracking}
          handleStartEyeTracking={handleStartEyeTracking}
          handleStopEyeTracking={handleStopEyeTracking}
          handleStartGazeTracking={handleStartGazeTracking}
          handleStopGazeTracking={handleStopGazeTracking}
          isStartingSession={isStartingSession}
          isStoppingSession={isStoppingSession}
          isStartingGaze={isStartingGaze}
          isStoppingGaze={isStoppingGaze}
        />
        <ReadingCountdownCard
          article={article}
          articlePointsAwarded={articlePointsAwarded}
          articleCountdown={articleCountdown}
        />
        <AlternativePerspectiveCard
          article={article}
          isGeneratingAlt={isGeneratingAlt}
          isAltLoading={isAltLoading}
          altCountdown={altCountdown}
          altPointsAwarded={altPointsAwarded}
          handleOpenAltPerspective={handleOpenAltPerspective}
        />
        <QuizCard
          article={article}
          isQuizUnlocked={isQuizUnlocked}
          isGeneratingQuiz={isGeneratingQuiz}
          isQuizLoading={isQuizLoading}
          handleOpenQuiz={handleOpenQuiz}
        />
      </div>

      {/* Live Gaze Overlay */}
      <LiveGazeOverlay gaze={liveGaze} />

      {/* Eye Tracking Socket Listener */}
      <EyeTrackingSocketListener
        onGazeData={(data) => setLiveGaze({ x: data.gaze_x, y: data.gaze_y })}
      />

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
