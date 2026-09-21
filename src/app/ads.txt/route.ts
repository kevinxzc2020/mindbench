import { getAdSenseConfig } from "@/lib/adsense";

export const dynamic = "force-static";

export function GET() {
  const { clientId } = getAdSenseConfig();
  if (!clientId) {
    return new Response("# No AdSense publisher configured.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(`google.com, ${clientId.slice(3)}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
