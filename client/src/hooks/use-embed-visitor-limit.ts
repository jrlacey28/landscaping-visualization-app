import { useCallback, useEffect, useMemo, useState } from "react";

export type EmbedVisitorUsageStatus = {
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  limitEnabled: boolean;
  unlimitedAccountAccess?: boolean;
  quoteGateTitle?: string;
  quoteGateMessage?: string;
  quoteButtonText?: string;
  quoteFormTitle?: string;
  quoteFormMessage?: string;
};

type UseEmbedVisitorLimitArgs = {
  tenantId?: number | null;
  tenantSlug?: string | null;
  accountUserId?: string | number | null;
};

function getOrCreateVisitorId() {
  if (typeof window === "undefined") {
    return "";
  }

  const storageKey = "dreambuilder_embed_visitor_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(storageKey, value);
  return value;
}

export function useEmbedVisitorLimit({ tenantId, tenantSlug, accountUserId }: UseEmbedVisitorLimitArgs) {
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);
  const [status, setStatus] = useState<EmbedVisitorUsageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!tenantId && !tenantSlug) {
      setStatus(null);
      return;
    }

    const params = new URLSearchParams();
    if (tenantId) params.set("tenantId", String(tenantId));
    if (tenantSlug) params.set("tenantSlug", tenantSlug);
    if (accountUserId) params.set("accountUserId", String(accountUserId));
    if (visitorId) params.set("visitorId", visitorId);

    setIsLoading(true);
    try {
      const token = window.localStorage.getItem("auth_token");
      const response = await fetch(`/api/embed/visitor-usage?${params.toString()}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        setStatus(null);
        return;
      }

      setStatus(await response.json());
    } catch (error) {
      console.error("Failed to load embed visitor usage:", error);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [accountUserId, tenantId, tenantSlug, visitorId]);

  const trackQuoteClick = useCallback(async () => {
    if (!tenantId && !tenantSlug) {
      return;
    }

    try {
      await fetch("/api/embed/quote-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tenantId,
          tenantSlug,
          accountUserId,
          visitorId,
        }),
      });
    } catch (error) {
      console.error("Failed to track embed quote click:", error);
    }
  }, [accountUserId, tenantId, tenantSlug, visitorId]);

  const markLimitReached = useCallback((nextStatus?: EmbedVisitorUsageStatus) => {
    setStatus((current) => ({
      canGenerate: false,
      currentUsage: nextStatus?.currentUsage ?? current?.currentUsage ?? current?.limit ?? 0,
      limit: nextStatus?.limit ?? current?.limit ?? 3,
      remaining: 0,
      limitEnabled: true,
      quoteGateTitle: nextStatus?.quoteGateTitle ?? current?.quoteGateTitle,
      quoteGateMessage: nextStatus?.quoteGateMessage ?? current?.quoteGateMessage,
      quoteButtonText: nextStatus?.quoteButtonText ?? current?.quoteButtonText,
      quoteFormTitle: nextStatus?.quoteFormTitle ?? current?.quoteFormTitle,
      quoteFormMessage: nextStatus?.quoteFormMessage ?? current?.quoteFormMessage,
    }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    visitorId,
    status,
    isLoading,
    refresh,
    trackQuoteClick,
    markLimitReached,
  };
}
