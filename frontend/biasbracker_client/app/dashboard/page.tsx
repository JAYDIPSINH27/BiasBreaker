"use client";

import { useState } from "react";
import TopicCloud from "@/components/common/TopicCloud";
import ArticleDashboard from "@/components/common/ArticleDashboard";
import ArticleDetail from "@/components/common/ArticleDetail";

const Page = () => {
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Dashboard</h1>

      {!selectedArticle ? (
        <>
          <TopicCloud onArticleGenerated={() => window.location.reload()} />
          <ArticleDashboard onSelectArticle={setSelectedArticle} />
        </>
      ) : (
        <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
      )}
    </div>
  );
};

export default Page;
