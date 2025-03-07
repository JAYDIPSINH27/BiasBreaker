import { apiSlice } from "../services/apiSlice";

export const pointsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserPoints: builder.query({
      query: () => "userpoints/",
    }),
    addUserPoints: builder.mutation({
      query: (action) => ({
        url: "userpoints/add/",
        method: "POST",
        body: { action },
      }),
    }),
  }),
});

export const { useGetUserPointsQuery, useAddUserPointsMutation } = pointsApiSlice;
