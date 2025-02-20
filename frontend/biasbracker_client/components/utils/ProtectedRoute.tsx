"use client";

import { useEffect } from "react";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useRouter } from "next/navigation";
import Spinner from "@/components/common/Spinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading, isError } = useRetrieveUserQuery(undefined, {
    pollingInterval: 60000, // Poll every 60 seconds for user authentication status
  });
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isError) {
      router.push("/auth/login"); // Redirect if not authenticated
    }
  }, [user, isLoading, isError, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return user ? children : null;
};

export default ProtectedRoute;
