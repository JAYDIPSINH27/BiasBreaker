"use client";

import { useState } from "react";
import TopicCloud from "@/components/common/TopicCloud";
import ArticleDashboard from "@/components/common/ArticleDashboard";
import ArticleDetail from "@/components/common/ArticleDetail";

const Page = () => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const handleTopicSelection = (topics: string[]) => {
    setSelectedTopics(topics);
  };

  const handleArticleSelection = (article: any) => {
    setSelectedArticle(article);
  };

  const handleBackToDashboard = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Dashboard</h1>

      {/* Show Topic Selection if no topics are selected */}
      {!selectedTopics.length && <TopicCloud onTopicsSelected={handleTopicSelection} />}

      {/* Show Article Dashboard when topics are selected */}
      {selectedTopics.length > 0 && !selectedArticle && (
        <ArticleDashboard onSelectArticle={handleArticleSelection} />
      )}

      {/* Show Article Details when an article is selected */}
      {selectedArticle && <ArticleDetail article={selectedArticle} onBack={handleBackToDashboard} />}
    </div>
  );
};

export default Page;
