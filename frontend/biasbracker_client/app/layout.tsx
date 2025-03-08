import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

import { Navbar, Footer } from "@/components/common";
import Provider from "@/redux/provider";
import { Setup } from "@/components/utils";
import EyeTrackingSocketListener from "@/components/common/EyeTrackingSocketListener";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BiasBreaker",
  description: "A platform to help you break your biases",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          <Setup />
          {/* <ProtectedRouter> */}

          {/* EyeTracking WebSocket Listener */}
          <EyeTrackingSocketListener />
          <Navbar />
          <div>{children}</div>
          <Footer />
          {/* </ProtectedRouter> */}
        </Provider>
      </body>
    </html>
  );
}
