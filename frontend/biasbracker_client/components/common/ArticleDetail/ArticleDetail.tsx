"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
 */
function useCountdown(initial: number, autoStart = false) {
  const [count, setCount] = useState(initial);
  const [active, setActive] = useState(autoStart);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          setCompleted(true);
          setActive(false);
          clearInterval(iv);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [active]);

  const start = useCallback(() => {
    setCount(initial);
    setCompleted(false);
    setActive(true);
  }, [initial]);

  return { count, completed, start };
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({
  articleId,
  article,
  onBack,
}) => {
  const router = useRouter();

  // ----- mutable refs for focus/away logic -----
  const readingStartRef = useRef<number | null>(null);
  const awayToastShownRef = useRef(false);
  const hasSuggestedAltRef = useRef(false);
  const readCompleteRef = useRef(false);

  // ----- DOM ref -----
  const articleRef = useRef<HTMLDivElement>(null);

  // ----- UI state -----
  const [isAltPerspectiveOpen, setAltPerspectiveOpen] = useState(false);
  const [isQuizUnlocked, setQuizUnlocked] = useState(false);
  const [isQuizOpen, setQuizOpen] = useState(false);
  const [eyeTrackingSessionId, setEyeTrackingSessionId] = useState<string | null>(null);
  const [liveGaze, setLiveGaze] = useState<{ x: number; y: number } | null>(null);
  const [trackingMethod, setTrackingMethod] = useState<"webcam" | "tobii">("webcam");

  // ----- countdowns -----
  const {
    count: articleCountdown,
    completed: articlePointsAwarded,
    start: startArticleCountdown,
  } = useCountdown(30, false);

  const {
    count: altCountdown,
    completed: altPointsAwarded,
    start: startAltCountdown,
  } = useCountdown(15, false);

  // ----- API hooks -----
  const [addUserPoints] = useAddUserPointsMutation();
  const [generateArticle, { isLoading: isGeneratingArticle }] =
    useGenerateArticleMutation();
  const [generateAltPerspective, { isLoading: isGeneratingAlt }] =
    useGenerateAlternativePerspectiveMutation();
  const [generateQuiz, { isLoading: isGeneratingQuiz }] = useGenerateQuizMutation();

  const {
    data: alternativePerspective,
    isLoading: isAltLoading,
    refetch: refetchAltPerspective,
  } = useGetAlternativePerspectiveQuery(articleId, { skip: !articleId });

  const { data: quiz, isLoading: isQuizLoading, refetch: refetchQuiz } = useGetQuizQuery(
    articleId,
    { skip: !articleId }
  );

  const [startEyeTrackingSession, { isLoading: isStartingSession }] =
    useStartEyeTrackingSessionMutation();
  const [stopEyeTrackingSession, { isLoading: isStoppingSession }] =
    useStopEyeTrackingSessionMutation();

  // start reading countdown when article loads
  useEffect(() => {
    if (article && articleId) {
      startArticleCountdown();
    }
  }, [article, articleId, startArticleCountdown]);

  // ----- Imperative focus/away handler -----
  const FOCUS_THRESHOLD_MS = 50000; // 5 seconds for testing

const handleGazeData = useCallback(
  (nx: number, ny: number) => {
    console.log("raw gaze data:", nx, ny);
    if (readCompleteRef.current) return;
    if (!articleRef.current) return;

    const rect = articleRef.current.getBoundingClientRect();

    // handle both normalized [0..1] and pixel coords:
    const gazeX = nx <= 1 ? nx * window.innerWidth : nx;
    const gazeY = ny <= 1 ? ny * window.innerHeight : ny;
    console.log("gaze px:", gazeX, gazeY, "rect:", rect);

    const inside =
      gazeX >= rect.left &&
      gazeX <= rect.right &&
      gazeY >= rect.top &&
      gazeY <= rect.bottom;
    console.log("inside?", inside);

    if (inside) {
      awayToastShownRef.current = false;

      if (readingStartRef.current === null) {
        readingStartRef.current = performance.now();
      } else {
        const elapsed = performance.now() - readingStartRef.current;
        console.log("focus elapsed (ms):", elapsed);
        if (!hasSuggestedAltRef.current && elapsed >= FOCUS_THRESHOLD_MS) {
          // toast.success("👀 Great focus! Check out the alternative perspective now.");
          toast.custom((t) => (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#ff4d4f",
                color: "white",
                padding: "16px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                zIndex: 9999,
              }}
              onClick={() => toast.dismiss(t.id)}
            >
              👀 Great focus! Check out the alternative perspective now.
            </div>
          ));
          readCompleteRef.current = true; 
          hasSuggestedAltRef.current = true;
          // setAltPerspectiveOpen(true);
          // setQuizUnlocked(false);
          // startAltCountdown();
          // (optional) reset your timer if you want repeated suggestions
          // readingStartRef.current = performance.now();
        }
      }
    } else {
      if (!awayToastShownRef.current) {
        // toast.error("👀 You are looking away!");
        toast.custom((t) => (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#ff4d4f",
              color: "white",
              padding: "16px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              zIndex: 9999,
            }}
            onClick={() => toast.dismiss(t.id)}
          >
            👀 You are looking away! Focus on the article
          </div>
        ));
        awayToastShownRef.current = true;
      }
      readingStartRef.current = null;
      hasSuggestedAltRef.current = false;
    }

    setLiveGaze({ x: nx, y: ny });
  },
  [startAltCountdown]
);

  // award points after reading countdown
  useEffect(() => {
    if (articlePointsAwarded && articleId) {
      addUserPoints({ action: "article_view", article_id: articleId })
        .unwrap()
        .then((res) => {
          if (res.success) {
            toast.success("+5 Points for reading!");
            if (res.new_badges?.length) {
              toast.success(`New Badge: ${res.new_badges.join(", ")}`);
            }
          }
        })
        .catch(() => toast.error("Failed to update reading points."));
    }
  }, [articlePointsAwarded, articleId, addUserPoints]);

  // award points after alt-perspective countdown
  useEffect(() => {
    if (altPointsAwarded && articleId) {
      addUserPoints({ action: "alternative_click", article_id: articleId })
        .unwrap()
        .then((res) => {
          if (res.success) {
            toast.success("+10 Points for exploring different views!");
            if (res.new_badges?.length) {
              toast.success(`New Badge: ${res.new_badges.join(", ")}`);
            }
          }
        })
        .catch(() => toast.error("Failed to update alt perspective points."));
    }
  }, [altPointsAwarded, articleId, addUserPoints]);

  // start eye-tracking session
  const handleStartEyeTracking = useCallback(async () => {
    try {
      const { session_id } = await startEyeTrackingSession().unwrap();
      setEyeTrackingSessionId(session_id);
      toast.success("Eye tracking session started!");
    } catch {
      toast.error("Failed to start eye tracking session");
    }
  }, [startEyeTrackingSession]);

  // stop eye-tracking session
  const handleStopEyeTracking = useCallback(async () => {
    if (!eyeTrackingSessionId) return;
    try {
      await stopEyeTrackingSession(eyeTrackingSessionId).unwrap();
      setLiveGaze(null);
      setEyeTrackingSessionId(null);
      toast.success("Eye tracking session stopped!");
      // if(trackingMethod === "webcam"){

        window.location.reload()
      // }
    } catch {
      toast.error("Failed to stop eye tracking session");
    }
  }, [eyeTrackingSessionId, stopEyeTrackingSession]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (eyeTrackingSessionId) {
        stopEyeTrackingSession(eyeTrackingSessionId).unwrap().catch(() => {});
      }
    };
  }, [eyeTrackingSessionId, stopEyeTrackingSession]);

  // open alt-perspective manually if user clicks
  const handleOpenAltPerspective = useCallback(async () => {
    if (!articleId) return toast.error("No article to explore an alternative perspective.");
    if (!alternativePerspective && !isAltLoading) {
      await generateAltPerspective(articleId).unwrap();
      await refetchAltPerspective();
    }
    setAltPerspectiveOpen(true);
    startAltCountdown();
  }, [
    articleId,
    alternativePerspective,
    isAltLoading,
    generateAltPerspective,
    refetchAltPerspective,
    startAltCountdown,
  ]);

  // open quiz & award attempt points
  const handleOpenQuiz = useCallback(async () => {
    if (!articleId) return toast.error("No article to create quiz from.");
    if (!quiz && !isQuizLoading) {
      await generateQuiz(articleId).unwrap();
      await refetchQuiz();
    }
    setQuizOpen(true);
    try {
      const res = await addUserPoints({ action: "quiz_attempt", article_id: articleId }).unwrap();
      if (res.success) {
        toast.success("+15 Points for attempting the quiz!");
        if (res.new_badges?.length) {
          toast.success(`New Badge: ${res.new_badges.join(", ")}`);
        }
      }
    } catch {
      toast.error("Failed to award quiz attempt points.");
    }
  }, [
    articleId,
    quiz,
    isQuizLoading,
    generateQuiz,
    refetchQuiz,
    addUserPoints,
  ]);

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
      <div
        ref={articleRef}
        className="relative w-5/6 border-2 border-blue-500 rounded-md overflow-hidden"
      >
        <ArticleContent
          article={article}
          handleGenerateArticle={async () => {
            if (!articleId) return;
            try {
              await generateArticle("Any Topic").unwrap();
              toast.success("Article generated!");
            } catch (err: any) {
              toast.error(err.data?.message || "Failed to generate article");
            }
          }}
          isGeneratingArticle={isGeneratingArticle}
        />
      </div>

      {/* Sidebar Cards */}
      <div className="w-1/6 flex flex-col space-y-3">
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
          articleCountdown={articleCountdown}
          articlePointsAwarded={articlePointsAwarded}
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
      {liveGaze && <LiveGazeOverlay gaze={liveGaze} />}

      {/* Eye Tracking Source */}
      {trackingMethod === "tobii" && eyeTrackingSessionId && (
        <EyeTrackingSocketListener
          onGazeData={(data) => handleGazeData(data.gaze_x, data.gaze_y)}
        />
      )}
      {trackingMethod === "webcam" && eyeTrackingSessionId && (
        <WebcamGazeTracker
          key={eyeTrackingSessionId}
          isActive={!!eyeTrackingSessionId}
          sessionId={eyeTrackingSessionId}
          onGazeData={(data) => handleGazeData(data.x, data.y)}
        />
      )}

      {/* Modals */}
      <AlternativePerspectiveModal
        isOpen={isAltPerspectiveOpen}
        onClose={() => setAltPerspectiveOpen(false)}
        alternative={alternativePerspective}
        onComplete={() => {
          setQuizUnlocked(true);
          setAltPerspectiveOpen(false);
        }}
      />
      <QuizModal isOpen={isQuizOpen} onClose={() => setQuizOpen(false)} quiz={quiz} />
    </motion.div>
  );
};

export default ArticleDetail;
