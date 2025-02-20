import { apiSlice } from "../services/apiSlice";

export const articleApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generateArticle: builder.mutation({
      query: (topic) => ({
        url: "articles/generate/",
        method: "POST",
        body: { topic },
        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem("access")}`, // Ensure token is sent
        // },
      }),
    }),
    getUserArticles: builder.query({
      query: () => ({
        url: "articles/user-articles/",
        method: "GET",
        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem("access")}`, // Ensure token is sent
        // },
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGenerateArticleMutation, useGetUserArticlesQuery } = articleApiSlice;
