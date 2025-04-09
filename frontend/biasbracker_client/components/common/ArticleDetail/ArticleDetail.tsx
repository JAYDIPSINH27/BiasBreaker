"use client";

import React, { useState, useEffect, useCallback } from "react";
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

/**
 * Custom hook to handle a countdown timer.
 * @param initial - initial countdown value in seconds.
 * @param autoStart - if true, the countdown starts immediately.
 * @returns count, a boolean indicating if the countdown completed, and a function to start/reset the countdown.
 */
function useCountdown(initial: number, autoStart = false) {
  const [count, setCount] = useState(initial);
  const [active, setActive] = useState(autoStart);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          setCompleted(true);
          setActive(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const start = useCallback(() => {
    setCount(initial);
    setCompleted(false);
    setActive(true);
  }, [initial]);

  return { count, completed, start };
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ articleId, article, onBack }) => {
  const router = useRouter();

  // UI states
  const [isAltPerspectiveOpen, setAltPerspectiveOpen] = useState(false);
  const [isQuizUnlocked, setQuizUnlocked] = useState(false);
  const [isQuizOpen, setQuizOpen] = useState(false);
  const [eyeTrackingSessionId, setEyeTrackingSessionId] = useState<string | null>(null);
  const [liveGaze, setLiveGaze] = useState<{ x: number; y: number } | null>(null);
  const [trackingMethod, setTrackingMethod] = useState<"webcam" | "tobii">("webcam");

  // Countdown hooks:
  // For reading article points: start automatically when article and articleId exist.
  const {
    count: articleCountdown,
    completed: articlePointsAwarded,
    start: startArticleCountdown,
  } = useCountdown(30, false);

  // For alternative perspective points: start when the modal is opened.
  const { count: altCountdown, completed: altPointsAwarded, start: startAltCountdown } =
    useCountdown(15, false);

  // Mutations & Queries
  const [addUserPoints] = useAddUserPointsMutation();
  const [generateArticle, { isLoading: isGeneratingArticle }] = useGenerateArticleMutation();
  const [generateAltPerspective, { isLoading: isGeneratingAlt }] =
    useGenerateAlternativePerspectiveMutation();
  const [generateQuiz, { isLoading: isGeneratingQuiz }] = useGenerateQuizMutation();
  const [startEyeTrackingSession, { isLoading: isStartingSession }] = useStartEyeTrackingSessionMutation();
  const [stopEyeTrackingSession, { isLoading: isStoppingSession }] = useStopEyeTrackingSessionMutation();

  const {
    data: alternativePerspective,
    isLoading: isAltLoading,
    refetch: refetchAltPerspective,
  } = useGetAlternativePerspectiveQuery(articleId, { skip: !articleId });

  const { data: quiz, isLoading: isQuizLoading, refetch: refetchQuiz } = useGetQuizQuery(articleId, {
    skip: !isQuizUnlocked || !articleId,
  });

  // Automatically start reading countdown when article data is available.
  useEffect(() => {
    if (article && articleId) {
      startArticleCountdown();
    }
  }, [article, articleId, startArticleCountdown]);

  // Award reading points once the countdown completes.
  useEffect(() => {
    if (articlePointsAwarded && articleId) {
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
    }
  }, [articlePointsAwarded, articleId, addUserPoints]);

  // Award alternative perspective points once the alt countdown completes.
  useEffect(() => {
    if (altPointsAwarded && articleId) {
      addUserPoints({ action: "alternative_click", article_id: articleId })
        .unwrap()
        .then((res) => {
          if (res.success) {
            toast.success("+10 Points for exploring different views!");
            if (res.new_badges?.length > 0) {
              toast.success(`New Badge: ${res.new_badges.join(", ")}`);
            }
          } else {
            toast(res.message || "Points already awarded");
          }
        })
        .catch(() => toast.error("Failed to update alt perspective points."));
    }
  }, [altPointsAwarded, articleId, addUserPoints]);

  // Eye tracking handlers
  const handleStartEyeTracking = useCallback(async () => {
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
  }, [startEyeTrackingSession]);

  const handleStopEyeTracking = useCallback(async () => {
    if (!eyeTrackingSessionId) return;
    const currentSessionId = eyeTrackingSessionId; // preserve current session id for logging
  
    try {
      await stopEyeTrackingSession(currentSessionId).unwrap();
      setLiveGaze(null);
      setEyeTrackingSessionId(null);
      toast.success("Eye tracking session stopped!");
  
      // Manual refresh after successful stop
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Delay to ensure state updates & toast shows
  
    } catch (err) {
      console.error("Error stopping eye tracking session:", err);
      toast.error("Failed to stop eye tracking session");
    }
  }, [eyeTrackingSessionId, stopEyeTrackingSession]);

  // Cleanup eye tracking session on unmount.
  useEffect(() => {
    return () => {
      if (eyeTrackingSessionId) stopEyeTrackingSession(eyeTrackingSessionId);
    };
  }, [eyeTrackingSessionId, stopEyeTrackingSession]);

  // Handle alternative perspective: generate data if needed and open modal.
  const handleOpenAltPerspective = useCallback(async () => {
    if (!articleId) {
      toast.error("No article to explore an alternative perspective.");
      return;
    }
    if (!alternativePerspective && !isAltLoading) {
      try {
        await generateAltPerspective(articleId).unwrap();
        await refetchAltPerspective();
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to generate alternative perspective");
        return;
      }
    }
    setAltPerspectiveOpen(true);
    if (!altPointsAwarded) {
      startAltCountdown();
    }
  }, [articleId, alternativePerspective, isAltLoading, generateAltPerspective, refetchAltPerspective, altPointsAwarded, startAltCountdown]);

  const handleCompleteAlternativePerspective = useCallback(() => {
    setQuizUnlocked(true);
  }, []);

  // Handle quiz: generate data if needed, open modal, and award quiz attempt points.
  const handleOpenQuiz = useCallback(async () => {
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
    try {
      const res = await addUserPoints({ action: "quiz_attempt", article_id: articleId }).unwrap();
      if (res.success) {
        toast.success("+15 Points for attempting the quiz!");
        if (res.new_badges?.length > 0) {
          toast.success(`New Badge: ${res.new_badges.join(", ")}`);
        }
      } else {
        toast(res.message || "Points already awarded");
      }
    } catch {
      toast.error("Failed to award quiz attempt points.");
    }
  }, [articleId, quiz, isQuizLoading, generateQuiz, refetchQuiz, addUserPoints]);

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

      {/* Article Content */}
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

      {/* Right Side Cards */}
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

      {/* Eye Tracking Socket Listener (for Tobii) */}
      {trackingMethod === "tobii" && (
        <EyeTrackingSocketListener
          onGazeData={(data) => setLiveGaze({ x: data.gaze_x, y: data.gaze_y })}
        />
      )}

      {/* Webcam Gaze Tracker (for Webcam) */}
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
      <QuizModal isOpen={isQuizOpen} onClose={() => setQuizOpen(false)} quiz={quiz} />
    </motion.div>
  );
};

export default ArticleDetail;
