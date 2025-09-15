import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import type { Tenant } from "@shared/schema";

export function useTenant(slug?: string) {
  const { user } = useAuth();
  
  // If user is authenticated and no slug is provided, fetch their tenant
  // Otherwise, use provided slug or default to demo
  const shouldFetchUserTenant = user && !slug;
  const tenantEndpoint = shouldFetchUserTenant 
    ? "/api/tenant/my-tenant" 
    : `/api/tenant/${slug || "demo"}`;

  const { data: tenant, isLoading, error } = useQuery<Tenant>({
    queryKey: [tenantEndpoint],
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
