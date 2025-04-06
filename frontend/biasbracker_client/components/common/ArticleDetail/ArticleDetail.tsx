"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import ArticleContent from "./ArticleContent";
import EyeTrackingCard from "./EyeTrackingCard";
import ReadingCountdownCard from "./ReadingCountdownCard";
import AlternativePerspectiveCard from "./AlternativePerspectiveCard";
import QuizCard from "./QuizCard";
import LiveGazeOverlay from "./LiveGazeOverlay";

import AlternativePerspectiveModal from "@/components/common/AlternativePerspectiveModal";
import QuizModal from "@/components/common/QuizModal";
import EyeTrackingSocketListener from "@/components/common/EyeTrackingSocketListener";
import WebcamGazeTracker from "./WebcamGazeTracker";

import {
  useGenerateArticleMutation,
  useGenerateAlternativePerspectiveMutation,
  useGetAlternativePerspectiveQuery,
  useGenerateQuizMutation,
  useGetQuizQuery,
} from "@/redux/features/articleApiSlice";

import { useAddUserPointsMutation } from "@/redux/features/userPointsApiSlice";
import {
  useStartEyeTrackingSessionMutation,
  useStopEyeTrackingSessionMutation,
} from "@/redux/features/eyeTrackingApiSlice";

interface ArticleDetailProps {
  articleId: number | null;
  article: any;
  onBack: () => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({
  articleId,
  article,
  onBack,
}) => {
  // UI States
  const [isAltPerspectiveOpen, setAltPerspectiveOpen] = useState(false);
  const [isQuizUnlocked, setQuizUnlocked] = useState(false);
  const [isQuizOpen, setQuizOpen] = useState(false);

  // Reading countdown
  const [articleCountdown, setArticleCountdown] = useState(30);
  const [articlePointsAwarded, setArticlePointsAwarded] = useState(false);

  // Alternative perspective countdown
  const [altCountdown, setAltCountdown] = useState<number | null>(null);
  const [altPointsAwarded, setAltPointsAwarded] = useState(false);

  // Eye tracking
  const [eyeTrackingSessionId, setEyeTrackingSessionId] = useState<
    string | null
  >(null);
  const [liveGaze, setLiveGaze] = useState<{ x: number; y: number } | null>(
    null
  );
  const [trackingMethod, setTrackingMethod] = useState<"webcam" | "tobii">(
    "webcam"
  );
  
  const router = useRouter();
  // Mutations
  const [addUserPoints] = useAddUserPointsMutation();
  const [generateArticle, { isLoading: isGeneratingArticle }] =
    useGenerateArticleMutation();
  const [generateAltPerspective, { isLoading: isGeneratingAlt }] =
    useGenerateAlternativePerspectiveMutation();
  const [generateQuiz, { isLoading: isGeneratingQuiz }] =
    useGenerateQuizMutation();

  const [startEyeTrackingSession, { isLoading: isStartingSession }] =
    useStartEyeTrackingSessionMutation();
  const [stopEyeTrackingSession, { isLoading: isStoppingSession }] =
    useStopEyeTrackingSessionMutation();

  // Queries
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

  // Start / Stop Eye Tracking
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
      setLiveGaze(null);
      setEyeTrackingSessionId(null); // <--- Make sure this is LAST so it triggers unmount
      toast.success("Eye tracking session stopped!");
      // router.refresh();
      console.log(eyeTrackingSessionId)
    } catch (err) {
      console.error("Error stopping eye tracking session:", err);
      toast.error("Failed to stop eye tracking session");
    }
  };
  
  // Clean up
  useEffect(() => {
    return () => {
      if (eyeTrackingSessionId) stopEyeTrackingSession(eyeTrackingSessionId);
     
    };
  }, [eyeTrackingSessionId, stopEyeTrackingSession]);

  // Reading countdown
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
        if (res.success) {
          toast.success("+5 Points for reading!");
          if (res.new_badges?.length > 0) {
            toast.success(`New Badge: ${res.new_badges.join(", ")}`);
          }
        } else {
          toast(res.message || "Points already awarded");
        }
      })
      .catch(() => toast.error("Failed to update reading points."));
  }, [articlePointsAwarded]);

  // Alternative Perspective
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
        toast.error(
          err?.data?.message || "Failed to generate alternative perspective"
        );
        return;
      }
    }
    setAltPerspectiveOpen(true);
    if (!altCountdown && !altPointsAwarded) setAltCountdown(15);
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
  }, [altCountdown, altPointsAwarded]);

  useEffect(() => {
    if (!altPointsAwarded || !articleId) return;
    addUserPoints({ action: "alternative_click", article_id: articleId })
      .unwrap()
      .then((res) => {
        if (res.success) {
          toast.success("+10 Points for exploring different views!");
          if (res?.new_badges?.length > 0) {
            toast.success(`New Badge: ${res.new_badges.join(", ")}`);
          }
        } else {
          toast(res.message || "Points already awarded");
        }
      })
      .catch(() => toast.error("Failed to update alt perspective points."));
  }, [altPointsAwarded]);

  const handleCompleteAlternativePerspective = () => setQuizUnlocked(true);

  // Quiz
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
        toast.error(err?.data?.message || "Failed to generate quiz");
        return;
      }
    }
    setQuizOpen(true);
    addUserPoints({ action: "quiz_attempt", article_id: articleId })
      .unwrap()
      .then((res) => {
        if (res.success) {
          toast.success("+15 Points for attempting the quiz!");
          if (res?.new_badges?.length > 0) {
            toast.success(`New Badge: ${res.new_badges.join(", ")}`);
          }
        } else {
          toast(res.message || "Points already awarded");
        }
      })
      .catch(() => toast.error("Failed to award quiz attempt points."));
  };

  return (
    <motion.div
      className="relative h-screen max-h-screen flex gap-6 p-4 md:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="absolute z-10 top-4 left-4 flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full shadow-xl hover:bg-gray-700 transition"
      >
        <FaArrowLeft className="h-6 w-6 text-white" />
      </button>

      {/* Article */}
      <ArticleContent
        article={article}
        handleGenerateArticle={async () => {
          if (!articleId) return;
          try {
            await generateArticle("Any Topic").unwrap();
            toast.success("Article generated!");
          } catch (err: any) {
            toast.error(err?.data?.message || "Failed to generate article");
          }
        }}
        isGeneratingArticle={isGeneratingArticle}
      />

      {/* Right side cards */}
      <div className="w-1/4 flex flex-col space-y-3">
        <EyeTrackingCard
          eyeTrackingSessionId={eyeTrackingSessionId}
          handleStartEyeTracking={handleStartEyeTracking}
          handleStopEyeTracking={handleStopEyeTracking}
          isStartingSession={isStartingSession}
          isStoppingSession={isStoppingSession}
          trackingMethod={trackingMethod}
          setTrackingMethod={setTrackingMethod}
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

      {/* Gaze Overlay */}
      {liveGaze && <LiveGazeOverlay gaze={liveGaze} />}

      {/* EyeTrackingSocketListener only if Tobii */}
      {trackingMethod === "tobii" && (
        <EyeTrackingSocketListener
          onGazeData={(data) => setLiveGaze({ x: data.gaze_x, y: data.gaze_y })}
        />
      )}

      {/* Webcam Tracker (includes alert listener internally) */}
      {trackingMethod === "webcam" && eyeTrackingSessionId && (
        <WebcamGazeTracker
        key={eyeTrackingSessionId || "none"}
          isActive={!!eyeTrackingSessionId}
          sessionId={eyeTrackingSessionId}
          onGazeData={(data) => setLiveGaze({ x: data.x, y: data.y })}
        />
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
