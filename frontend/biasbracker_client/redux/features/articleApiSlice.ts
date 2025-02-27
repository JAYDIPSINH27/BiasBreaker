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
    getUserArticles: builder.query({
      query: () => "articles/user-articles/",
    }),
    generateAlternativePerspective: builder.mutation({
      query: (articleId) => ({
        url: `articles/alternative/generate/${articleId}/`,
        method: "POST",
      }),
    }),
    getAlternativePerspective: builder.query({
      query: (articleId) => `articles/alternative/${articleId}/`,
    }),
    generateQuiz: builder.mutation({
      query: (articleId) => ({
        url: `articles/quiz/generate/${articleId}/`,
        method: "POST",
      }),
    }),
    getQuiz: builder.query({
      query: (articleId) => `articles/quiz/${articleId}/`,
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
} = articleApiSlice;
