import { apiSlice } from "../services/apiSlice";

interface UserPoints {
  total_points: number;
  badges: string[];
}

export const pointsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserPoints: builder.query<UserPoints, void>({
      query: () => "userpoints/",
    }),
    addUserPoints: builder.mutation({
      query: ({ action, article_id }) => ({
        url: "userpoints/add/",
        method: "POST",
        body: { action, article_id },
      }),
    }),
  }),
});

export const { useGetUserPointsQuery, useAddUserPointsMutation } = pointsApiSlice;
