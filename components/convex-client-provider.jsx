"use client";

import { useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const normalizeConvexUrl = (rawUrl) => {
  if (!rawUrl) return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Allow localhost shortcuts such as "localhost:8187" during dev.
  if (/^localhost(?::\d+)?/i.test(trimmed) || /^127\.\d+\.\d+\.\d+/.test(trimmed)) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
};

export function ConvexClientProvider({ children }) {
  const convexClient = useMemo(() => {
    const normalizedUrl = normalizeConvexUrl(
      process.env.NEXT_PUBLIC_CONVEX_URL
    );

    if (!normalizedUrl) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "NEXT_PUBLIC_CONVEX_URL is required in production. Set it to your Convex deployment URL."
        );
      }

      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is missing; defaulting to http://localhost:8187. Update .env for production."
      );
    }

    const urlToUse = normalizedUrl || "http://localhost:8187";

    const options = urlToUse.startsWith("http://")
      ? { unsafelyAllowNonHttps: true }
      : undefined;

    return new ConvexReactClient(urlToUse, options);
  }, []);

  return (
    <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
