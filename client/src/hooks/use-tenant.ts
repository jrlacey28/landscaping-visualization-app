import { useQuery } from "@tanstack/react-query";
import type { Tenant } from "@shared/schema";

export function useTenant() {
  // For demo purposes, we'll use a fixed slug
  // In production, this would come from the URL subdomain or path
  const tenantSlug = "demo";

  const { data: tenant, isLoading, error } = useQuery<Tenant>({
    queryKey: [`/api/tenant/${tenantSlug}`],
    retry: false,
  });

  return {
    tenant,
    isLoading,
    error,
  };
}
