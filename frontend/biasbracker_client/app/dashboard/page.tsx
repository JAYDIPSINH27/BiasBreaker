"use client";

import { useRouter } from "next/navigation";
import TopicCloud from "@/components/common/TopicCloud";
import ArticleDashboard from "@/components/common/ArticleDashboard";
import { useGetUserArticlesQuery } from "@/redux/features/articleApiSlice";
import { Article } from "@/types/article"; // Ensure your Article type is defined here

const page = () => {
  const router = useRouter();
  const { refetch } = useGetUserArticlesQuery();

  const handleSelectArticle = (articleId: number, articleData: Article) => {
    // Navigate to the article detail route with the article ID.
    router.push(`/article/${articleId}`);
  };

  return (
    <div className="p-6 mt-10">
      {/* TopicCloud triggers refetch when an article is generated */}
      <TopicCloud onArticleGenerated={refetch} />
      <ArticleDashboard onSelectArticle={handleSelectArticle} />
    </div>
  );
};

export default page;
