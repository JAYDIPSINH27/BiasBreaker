import { useState, useEffect } from "react";

const useTimeTracking = (articleId: number | null, minTime: number, onTimeComplete: () => void) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (!articleId || hasCompleted) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      if (elapsedTime >= minTime) {
        setHasCompleted(true);
        onTimeComplete();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [articleId, hasCompleted, elapsedTime, minTime, onTimeComplete]);

  return elapsedTime;
};

export default useTimeTracking;
