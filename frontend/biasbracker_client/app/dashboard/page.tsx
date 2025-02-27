"use client";

import { useState } from "react";
import TopicCloud from "@/components/common/TopicCloud";
import ArticleDashboard from "@/components/common/ArticleDashboard";
import ArticleDetail from "@/components/common/ArticleDetail";
import { useGetUserArticlesQuery } from "@/redux/features/articleApiSlice";

const Page = () => {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  //  Fetch articles dynamically
  const { data: articles = [], refetch } = useGetUserArticlesQuery();

  // Handle article selection with ID and full content
  const handleSelectArticle = (articleId: number, articleData: any) => {
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
