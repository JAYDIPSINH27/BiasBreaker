import { apiSlice } from "../services/apiSlice";


export const articleApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generateArticle: builder.mutation({
      query: (topic) => ({
        url: "articles/generate/",
        method: "POST",
        body: { topic },
      }),
    }),
    getUserArticles: builder.query<void, void>({
      query: () => "articles/user-articles/",
    }),
    generateAlternativePerspective: builder.mutation({
      query: (articleId) => ({
        url: `articles/alternative/generate/${articleId}/`,
        method: "POST",
      }),
    }),
    getAlternativePerspective: builder.query<void, void>({
      query: (articleId) => `articles/alternative/${articleId}/`,
    }),
    generateQuiz: builder.mutation({
      query: (articleId) => ({
        url: `articles/quiz/generate/${articleId}/`,
        method: "POST",
      }),
    }),
    getQuiz: builder.query<void, void>({
      query: (articleId) => `articles/quiz/${articleId}/`,
    }),
    getArticle: builder.query<Article, number>({
      query: (articleId) => `articles/${articleId}/`,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGenerateArticleMutation,
  useGetUserArticlesQuery,
  useGenerateAlternativePerspectiveMutation,
  useGetAlternativePerspectiveQuery,
  useGenerateQuizMutation,
  useGetQuizQuery,
  useGetArticleQuery, 
} = articleApiSlice;
