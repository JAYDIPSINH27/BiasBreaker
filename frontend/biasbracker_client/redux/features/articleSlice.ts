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
  }),
  overrideExisting: false,
});

export const { useGenerateArticleMutation, useGetUserArticlesQuery } = articleApiSlice;
