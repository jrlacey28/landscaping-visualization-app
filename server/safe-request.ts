import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import https from "node:https";

const blocked = new BlockList();
for (const [address, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3]] as const) blocked.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
blocked.addSubnet("2001::", 23, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");
blocked.addSubnet("2002::", 16, "ipv6");
export function isPublicAddress(address: string) {
  return isIP(address) === 4 ? !blocked.check(address, "ipv4") :
    isIP(address) === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}
export function publicHttpsUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") ||
    host === "localhost" || host.endsWith(".local") || host.endsWith(".localhost") || (isIP(host) && !isPublicAddress(host))) {
    throw new Error("Use a public HTTPS URL without credentials or a custom port");
  }
  return url;
}

// Validate all resolved addresses and pin the connection to one of them. Never follow redirects.
export async function safeRequest(value: string, options: { method?: string; body?: string; headers?: Record<string, string>; timeoutMs?: number; maxBytes?: number } = {}) {
  const url = publicHttpsUrl(value);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(host, { all: true }),
    new Promise<never>((_, reject) => { dnsTimer = setTimeout(() => reject(new Error("DNS lookup timed out")), options.timeoutMs || 8000); }),
  ]).finally(() => clearTimeout(dnsTimer));
  if (!addresses.length || addresses.some(entry => !isPublicAddress(entry.address))) throw new Error("Destination must resolve to a public address");
  const target = addresses[0];
  return new Promise<{ ok: boolean; status: number; buffer: Buffer }>((resolve, reject) => {
    const request = https.request(url, {
      method: options.method || "GET", headers: options.headers,
      lookup: ((_hostname: string, _options: any, callback: any) => {
        if (_options?.all) callback(null, [target]);
        else callback(null, target.address, target.family);
      }) as any,
    }, response => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > (options.maxBytes || 10 * 1024 * 1024)) request.destroy(new Error("Remote response too large"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => resolve({ ok: (response.statusCode || 500) >= 200 && (response.statusCode || 500) < 300, status: response.statusCode || 500, buffer: Buffer.concat(chunks) }));
    });
    const timeout = setTimeout(() => request.destroy(new Error("Remote request timed out")), options.timeoutMs || 8000);
    request.on("close", () => clearTimeout(timeout));
    request.on("error", reject);
    request.end(options.body);
  });
}
