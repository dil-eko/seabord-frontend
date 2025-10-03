"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem("cookieConsent");
    if (!savedConsent) {
      setVisible(true);
    } else {
      setConsent(savedConsent);
    }
  }, []);

  const handleConsent = (value: "accept" | "reject") => {
    localStorage.setItem("cookieConsent", value);
    setConsent(value);
    setVisible(false);

    if (value === "accept") {
      loadAnalytics();
    }
  };

  const loadAnalytics = () => {
    // Google Analytics script injection (opt-in)
    if (document.getElementById("ga-script")) return;
    const script = document.createElement("script");
    script.id = "ga-script";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID";
    document.body.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      (window.dataLayer as any).push(args);
    }
    gtag("js", new Date());
    gtag("config", "GA_MEASUREMENT_ID");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-gray-900 text-white p-4 flex flex-col md:flex-row items-center justify-between z-50 shadow-lg">
      <p className="text-sm mb-2 md:mb-0 md:mr-4">
        This website uses cookies to improve your browsing experience and to collect analytics data. 
        You can accept or reject cookies. See our{" "}
        <a href="/privacy-policy" className="underline">
          Privacy Policy
        </a>{" "}
        for details.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleConsent("reject")}
          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
        >
          Reject
        </button>
        <button
          onClick={() => handleConsent("accept")}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
