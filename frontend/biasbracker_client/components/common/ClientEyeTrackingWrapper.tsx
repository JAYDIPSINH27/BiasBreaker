"use client";

import dynamic from "next/dynamic";
import { useCheckTobiAvailabilityQuery } from "@/redux/features/eyeTrackingApiSlice";

const MediaPipeEyeTracking = dynamic(
  () => import("@/components/common/MediaPipeEyeTracking"),
  { ssr: false }
);

const ClientEyeTrackingWrapper = () => {
  const { data: tobiData } = useCheckTobiAvailabilityQuery();

  if (!tobiData?.tobi_available) {
    return <MediaPipeEyeTracking />;
  }

  return null;
};

export default ClientEyeTrackingWrapper;
