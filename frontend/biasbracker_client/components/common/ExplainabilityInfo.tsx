import React, { useState } from "react";
import explanations from "@/components/data/explanations.json";
import { FaInfoCircle } from "react-icons/fa";

type Category =
  | "perspectives"
  | "biases"
  | "warnings"
  | "transparency"
  | "sources"
  | "confidence"
  | "counterfactual"
  | "definitions"
  | "sentiment"
  | "reading_level"
  | "critical_questions"
  | "ethics";

interface ExplainabilityInfoProps {
  category: Category;
  keyName: string; // e.g. "Optimistic", "genai", or "default"
}

const ExplainabilityInfo: React.FC<ExplainabilityInfoProps> = ({
  category,
  keyName,
}) => {
  const [open, setOpen] = useState(false);
  const text =
    (explanations as any)[category]?.[keyName] ||
    (explanations as any)[category]?.["default"] ||
    "No explanation available.";

  return (
    <span className="relative inline-block ml-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-gray-400 hover:text-gray-600"
        aria-label="Show explanation"
      >
        <FaInfoCircle />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-64 bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm text-gray-700">
          {text}
        </div>
      )}
    </span>
  );
};

export default ExplainabilityInfo;
