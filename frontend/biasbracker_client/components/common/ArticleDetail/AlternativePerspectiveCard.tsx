import React from "react";
import { FaRegLightbulb } from "react-icons/fa";
import Spinner from "@/components/common/Spinner";

interface AlternativePerspectiveCardProps {
  article: any;
  isGeneratingAlt: boolean;
  isAltLoading: boolean;
  altCountdown: number | null;
  altPointsAwarded: boolean;
  handleOpenAltPerspective: () => void;
}

const AlternativePerspectiveCard: React.FC<AlternativePerspectiveCardProps> = ({
  article,
  isGeneratingAlt,
  isAltLoading,
  altCountdown,
  altPointsAwarded,
  handleOpenAltPerspective,
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

export default AlternativePerspectiveCard;
