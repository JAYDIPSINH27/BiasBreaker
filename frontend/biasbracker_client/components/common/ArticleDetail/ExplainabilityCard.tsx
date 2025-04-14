"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * ExplainabilityCard Component
 * 
 * This card explains what is going on behind the scenes on the website.
 * It describes how the platform is designed to:
 * - Break out of echo chambers by generating alternative perspectives.
 * - Utilize gamified elements (reading countdowns, quizzes, rewards) to motivate engagement.
 * - Integrate technologies like eye-tracking to personalize interactions.
 * 
 * The intended effect is to challenge inherent biases and promote balanced,
 * reflective thinking by exposing users to diverse viewpoints and rewarding in-depth exploration.
 */
const ExplainabilityCard: React.FC = () => {
  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl p-6 max-w-md mx-auto my-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold mb-4">How This Platform Works</h2>
      <p className="mb-2">
        <strong>Breaking Bias & Expanding Views:</strong> Traditional media and online content often reinforce personal biases and create echo chambers.
        Our platform disrupts this by presenting alternative perspectives that challenge accepted narratives and encourage users to think critically.
      </p>
      <p className="mb-2">
        <strong>Persuasive & Gamified Experience:</strong> Integrated elements like reading countdowns, interactive quizzes, and point rewards (along with badges)
        are designed to increase engagement and promote a more mindful reading experience.
      </p>
      <p className="mb-2">
        <strong>Engaging Through Innovative Tech:</strong> By using advanced features such as eye-tracking (via webcam or specialized devices), the platform can
        tailor content delivery in real time, ensuring that users remain focused and immersed in the experience.
      </p>
      <p className="mb-2">
        <strong>Positive Change:</strong> The ultimate goal is to foster a balanced viewpoint, empowering users to embrace a diversity of ideas while
        rewarding them for their active participation and exploration of alternative narratives.
      </p>
      <p>
        Explore, engage, and let this transparent, interactive design guide you to a more well-rounded understanding of complex issues.
      </p>
    </motion.div>
  );
};

export default ExplainabilityCard;
