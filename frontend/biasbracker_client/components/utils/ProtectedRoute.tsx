"use client";

import { useEffect } from "react";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useRouter } from "next/navigation";
import Spinner from "@/components/common/Spinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading, isError, refetch } = useRetrieveUserQuery(undefined, {
    pollingInterval: 60000, 
  });
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isError) {
      router.push("/auth/login");
    }
  }, [isLoading, isError, router]);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    refetch();
  }, []);

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
