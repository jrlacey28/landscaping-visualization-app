import { useCallback, useEffect, useState } from "react";

export const DEMO_EMBED_TRIAL_LIMIT = 3;
export const DEMO_EMBED_TRIAL_STORAGE_KEY = "dreambuilder_demo_embed_trial_usage_v1";
export const DEMO_EMBED_TRIAL_MESSAGE = "dreambuilder:demo-embed-usage";

export function readDemoEmbedTrialUsage() {
  if (typeof window === "undefined") return 0;

  const parsed = Number(window.localStorage.getItem(DEMO_EMBED_TRIAL_STORAGE_KEY) || 0);
  if (!Number.isFinite(parsed)) return 0;

  return Math.min(Math.max(Math.floor(parsed), 0), DEMO_EMBED_TRIAL_LIMIT);
}

export function redirectDemoEmbedToPricing() {
  const pricingUrl = `${window.location.origin}/pricing?from=embed-demo`;

  if (window.top) {
    window.top.location.href = pricingUrl;
    return;
  }

  window.location.href = pricingUrl;
}

export function useDemoEmbedTrial() {
  const isDemoTrial =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demoTrial") === "1";
  const [usage, setUsage] = useState(() => readDemoEmbedTrialUsage());

  useEffect(() => {
    if (!isDemoTrial) return;

    const syncUsage = () => setUsage(readDemoEmbedTrialUsage());
    window.addEventListener("storage", syncUsage);
    return () => window.removeEventListener("storage", syncUsage);
  }, [isDemoTrial]);

  const canStartGeneration = useCallback(() => {
    if (!isDemoTrial) return true;

    const currentUsage = readDemoEmbedTrialUsage();
    setUsage(currentUsage);

    if (currentUsage >= DEMO_EMBED_TRIAL_LIMIT) {
      redirectDemoEmbedToPricing();
      return false;
    }

    return true;
  }, [isDemoTrial]);

  const recordSuccessfulGeneration = useCallback(() => {
    if (!isDemoTrial) return;

    const nextUsage = Math.min(readDemoEmbedTrialUsage() + 1, DEMO_EMBED_TRIAL_LIMIT);
    window.localStorage.setItem(DEMO_EMBED_TRIAL_STORAGE_KEY, String(nextUsage));
    setUsage(nextUsage);
    window.parent?.postMessage(
      { type: DEMO_EMBED_TRIAL_MESSAGE, usage: nextUsage, limit: DEMO_EMBED_TRIAL_LIMIT },
      window.location.origin,
    );
  }, [isDemoTrial]);

  const handleServerLimitReached = useCallback(() => {
    if (!isDemoTrial) return false;

    redirectDemoEmbedToPricing();
    return true;
  }, [isDemoTrial]);

  return {
    isDemoTrial,
    usage,
    remaining: Math.max(DEMO_EMBED_TRIAL_LIMIT - usage, 0),
    canStartGeneration,
    recordSuccessfulGeneration,
    handleServerLimitReached,
  };
}
