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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Provider>
          <Setup />
          <EyeTrackingSocketListener />
          {/* The flex container ensures the layout occupies full viewport height */}
          <div className="flex flex-col min-h-screen">
            <Navbar />
            {/* Main content area grows to fill space */}
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </Provider>
      </body>
    </html>
  );
}
