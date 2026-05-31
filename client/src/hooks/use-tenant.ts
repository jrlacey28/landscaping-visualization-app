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
    queryKey: [tenantEndpoint, shouldFetchUserTenant ? user?.user.id : slug || "demo"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("auth_token");

      if (shouldFetchUserTenant && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(tenantEndpoint, {
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        const text = (await response.text()) || response.statusText;
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    retry: false, // Don't retry - use fallback immediately
    staleTime: 1000 * 60 * 5, // 5 minutes - tenant data rarely changes
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache longer
  });

  return {
    tenant,
    isLoading,
    error,
  };
}
