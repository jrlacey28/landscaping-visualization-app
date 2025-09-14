import { useQuery } from "@tanstack/react-query";
import type { Tenant } from "@shared/schema";

export function useTenant(slug?: string) {
  // Use provided slug or default to demo
  const tenantSlug = slug || "demo";

  const { data: tenant, isLoading, error } = useQuery<Tenant>({
    queryKey: [`/api/tenant/${tenantSlug}`],
    retry: 3, // Retry up to 3 times for network issues
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 1000 * 60 * 5, // 5 minutes - tenant data rarely changes
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache longer
  });

  return {
    tenant,
    isLoading,
    error,
  };
}
