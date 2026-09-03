import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bike Savvy | Motorcycle Training in Cape Town",
  description: "Practical, confidence-building motorcycle training in Cape Town. Choose your course and request your preferred lesson online.",
  keywords: ["motorcycle training Cape Town", "motorbike lessons", "learner licence preparation", "riding lessons"],
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL('https://bikesavvy.theboostnation.com'),
  openGraph: {
    title: "Bike Savvy | Ride Ready. Road Confident.",
    description: "Practical motorcycle training built around your experience, your pace and the road ahead.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
