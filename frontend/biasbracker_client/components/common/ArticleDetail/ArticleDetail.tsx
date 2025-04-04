"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";

// Existing local UI components
import ArticleContent from "./ArticleContent";
import EyeTrackingCard from "./EyeTrackingCard";
import ReadingCountdownCard from "./ReadingCountdownCard";
import AlternativePerspectiveCard from "./AlternativePerspectiveCard";
import QuizCard from "./QuizCard";
import LiveGazeOverlay from "./LiveGazeOverlay";
import MediaPipeEyeTracking from "@/components/common/MediaPipeEyeTracking";
import GazeTracker from "@/components/common/GazeTracker";
import AlternativePerspectiveModal from "@/components/common/AlternativePerspectiveModal";
import QuizModal from "@/components/common/QuizModal";
import EyeTrackingSocketListener from "@/components/common/EyeTrackingSocketListener";

// RTK-based queries & mutations
import {
  useGenerateArticleMutation,
  useGenerateAlternativePerspectiveMutation,
  useGetAlternativePerspectiveQuery,
  useGenerateQuizMutation,
  useGetQuizQuery,
} from "@/redux/features/articleApiSlice";
import { useAddUserPointsMutation } from "@/redux/features/userPointsApiSlice";
import {
  useCheckTobiAvailabilityQuery,
  useStartEyeTrackingSessionMutation,
  useStopEyeTrackingSessionMutation,
  useStartGazeTrackingMutation,
  useStopGazeTrackingMutation,
} from "@/redux/features/eyeTrackingApiSlice";

interface ArticleDetailProps {
  articleId: number | null;
  article: any; // The article object
  onBack: () => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({
  articleId,
  article,
  onBack,
}) => {
  // -----------------------------------
  // Basic reading countdown states
  // -----------------------------------
  const [articleCountdown, setArticleCountdown] = useState(30);
  const [articlePointsAwarded, setArticlePointsAwarded] = useState(false);

  // -----------------------------------
  // Alternative perspective countdown
  // -----------------------------------
  const [altCountdown, setAltCountdown] = useState<number | null>(null);
  const [altPointsAwarded, setAltPointsAwarded] = useState(false);
  const [isAltPerspectiveOpen, setAltPerspectiveOpen] = useState(false);

  // -----------------------------------
  // Quiz states
  // -----------------------------------
  const [isQuizUnlocked, setQuizUnlocked] = useState(false); // <--- declared only once
  const [isQuizOpen, setQuizOpen] = useState(false);

  // -----------------------------------
  // Eye tracking states
  // -----------------------------------
  const [eyeTrackingSessionId, setEyeTrackingSessionId] = useState<string | null>(null);
  const [isGazeTracking, setIsGazeTracking] = useState(false);
  const [liveGaze, setLiveGaze] = useState<{ x: number; y: number } | null>(null);

  // -----------------------------------
  // RTK queries & mutations
  // -----------------------------------
  const [addUserPoints] = useAddUserPointsMutation();
  const [generateArticle, { isLoading: isGeneratingArticle }] = useGenerateArticleMutation();
  const [generateAltPerspective, { isLoading: isGeneratingAlt }] =
    useGenerateAlternativePerspectiveMutation();
  const [generateQuiz, { isLoading: isGeneratingQuiz }] = useGenerateQuizMutation();

  const { data: alternativePerspective, isLoading: isAltLoading, refetch: refetchAltPerspective } =
    useGetAlternativePerspectiveQuery(articleId, { skip: !articleId });

  const {
    data: quiz,
    isLoading: isQuizLoading,
    refetch: refetchQuiz,
  } = useGetQuizQuery(articleId, {
    skip: !isQuizUnlocked || !articleId,
  });

  const { data: tobiData } = useCheckTobiAvailabilityQuery();

  // Eye-tracking session
  const [startEyeTrackingSession, { isLoading: isStartingSession }] =
    useStartEyeTrackingSessionMutation();
  const [stopEyeTrackingSession, { isLoading: isStoppingSession }] =
    useStopEyeTrackingSessionMutation();

  // Gaze tracking toggles
  const [startGazeTracking, { isLoading: isStartingGaze }] = useStartGazeTrackingMutation();
  const [stopGazeTracking, { isLoading: isStoppingGaze }] = useStopGazeTrackingMutation();

  // -----------------------------------
  // Eye Tracking Session handlers
  // -----------------------------------
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
      setLiveGaze(null);
      toast.success("Eye tracking session stopped!");
    } catch (err) {
      console.error("Error stopping eye tracking session:", err);
      toast.error("Failed to stop eye tracking session");
    }
  };

  // Cleanup if unmounted
  useEffect(() => {
    return () => {
      if (eyeTrackingSessionId) {
        stopEyeTrackingSession(eyeTrackingSessionId);
      }
    };
  }, [eyeTrackingSessionId, stopEyeTrackingSession]);

  // -----------------------------------
  // Gaze tracking (real-time)
  // -----------------------------------
  const handleStartGazeTracking = async () => {
    if (!eyeTrackingSessionId) {
      toast.error("No active session. Please start session first.");
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

  // -----------------------------------
  // Article generation
  // -----------------------------------
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

  // -----------------------------------
  // Reading countdown & awarding points
  // -----------------------------------
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

  // -----------------------------------
  // Alternative perspective logic
  // -----------------------------------
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
          toast.error(res?.message || "Failed to award alt perspective points.");
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

  // -----------------------------------
  // Quiz logic
  // -----------------------------------
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

      {/* Overlays & Socket Listener */}
      <LiveGazeOverlay gaze={liveGaze} />

      <EyeTrackingSocketListener
        onGazeData={(data) => setLiveGaze({ x: data.gaze_x, y: data.gaze_y })}
      />

{eyeTrackingSessionId && isGazeTracking && !tobiData?.tobi_available && (
  <GazeTracker />
)}

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
