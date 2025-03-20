"use client";

import { useState } from "react";
import TopicCloud from "@/components/common/TopicCloud";
import ArticleDashboard from "@/components/common/ArticleDashboard";
import ArticleDetail from "@/components/common/ArticleDetail";
import { useGetUserArticlesQuery } from "@/redux/features/articleApiSlice";

interface Article {
  id: number;
  title: string;
  content: string;
  // add other properties as needed
}

const Page = () => {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Fetch articles dynamically
  // If you are not using `articles`, you can omit it to avoid the unused variable error.
  const { refetch } = useGetUserArticlesQuery();

  // Handle article selection with ID and full content
  const handleSelectArticle = (articleId: number, articleData: Article) => {
    setSelectedArticleId(articleId);
    setSelectedArticle(articleData);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Dashboard</h1>

      {!selectedArticle ? (
        <>
          {/* Replace reload with refetch */}
          <TopicCloud onArticleGenerated={refetch} /> 
          <ArticleDashboard onSelectArticle={handleSelectArticle} />
        </>
      ) : (
        <ArticleDetail 
          articleId={selectedArticleId} 
          article={selectedArticle} 
          onBack={() => {
            setSelectedArticleId(null);
            setSelectedArticle(null);
          }} 
        />
      )}
    </div>
  );
};

export default Page;
