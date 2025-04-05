"use client";

import { useRouter, useParams } from "next/navigation";
import ArticleDetail from "@/components/common/ArticleDetail/ArticleDetail";
import { useGetArticleQuery } from "@/redux/features/articleApiSlice";

const page = () => {
  const router = useRouter();
  const { id } = useParams();

  // Use the new endpoint to fetch a single article by its ID.
  const { data: article, error, isLoading } = useGetArticleQuery(Number(id));

  if (isLoading) return <div>Loading...</div>;
  if (error || !article) return <div>Error loading article</div>;

  return (
    <div className="p-6 mt-10">
      <ArticleDetail
        articleId={article.id}
        article={article}
        onBack={() => router.back()}
      />
    </div>
  );
};

export default page;
