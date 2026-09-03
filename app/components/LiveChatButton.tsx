'use client';

import { useState, useEffect } from 'react';

export default function LiveChatButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show after user has been on page for 2 seconds
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <a
      href="https://t.me/Bikesavvy_bot"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-105 inline-flex items-center gap-2"
      title="Chat with Bike Savvy Assistant"
      style={{
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.75C6.617 21.75 2.25 17.383 2.25 12S6.617 2.25 12 2.25 21.75 6.617 21.75 12 17.383 21.75 12 21.75zm.75-15.75v6.375l3.75 2.25-.75 1.125-4.5-2.625V6h1.5z"/>
      </svg>
      <span className="font-medium text-sm">Need Help?</span>
    </a>
  );
}
