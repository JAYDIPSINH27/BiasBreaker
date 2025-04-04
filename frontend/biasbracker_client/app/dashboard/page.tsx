"use client";

import { useState } from "react";
import TopicCloud from "@/components/common/TopicCloud";
import ArticleDashboard from "@/components/common/ArticleDashboard";
import ArticleDetail from "@/components/common/ArticleDetail/ArticleDetail";
import { useGetUserArticlesQuery } from "@/redux/features/articleApiSlice";

// Export Article type so it can be reused elsewhere if needed.
export interface Article {
  id: number;
  title: string;
  content: string;
  // add other properties as needed
}

const DashboardPage = () => {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // We only need refetch from the query here.
  const { refetch } = useGetUserArticlesQuery();

  // Handle article selection by saving the article ID and full data.
  const handleSelectArticle = (articleId: number, articleData: Article) => {
    setSelectedArticleId(articleId);
    setSelectedArticle(articleData);
  };

  const handleBack = () => {
    setSelectedArticleId(null);
    setSelectedArticle(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Dashboard</h1>

      {!selectedArticle ? (
        <>
          {/* TopicCloud uses refetch when an article is generated */}
          <TopicCloud onArticleGenerated={refetch} />
          <ArticleDashboard onSelectArticle={handleSelectArticle} />
        </>
      ) : (
        <ArticleDetail
          articleId={selectedArticleId}
          article={selectedArticle}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default DashboardPage;
