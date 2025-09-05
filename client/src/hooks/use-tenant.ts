import { useQuery } from "@tanstack/react-query";
import type { Tenant } from "@shared/schema";

export function useTenant(slug?: string) {
  // Use provided slug or default to demo
  const tenantSlug = slug || "demo";

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
