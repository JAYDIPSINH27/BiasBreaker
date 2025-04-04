import React from "react";

interface ReadingCountdownCardProps {
  article: any;
  articlePointsAwarded: boolean;
  articleCountdown: number;
}

const ReadingCountdownCard: React.FC<ReadingCountdownCardProps> = ({
  article,
  articlePointsAwarded,
  articleCountdown,
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

export default ReadingCountdownCard;
