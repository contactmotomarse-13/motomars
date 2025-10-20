import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error:"Missing params" }, { status:400 });
  const url = `https://router.project-osrm.org/route/v1/motorcycle/${from};${to}?alternatives=false&overview=false&annotations=duration,distance&language=fr`;
  const r = await fetch(url, { cache:"no-store" });
  if (!r.ok) return NextResponse.json({ error:"OSRM error" }, { status:r.status });
  const data = await r.json(); const route = data?.routes?.[0];
  if (!route) return NextResponse.json({ error:"No route" }, { status:502 });
  return NextResponse.json({
    km: +(route.distance/1000).toFixed(1),
    minutes: Math.max(1, Math.round(route.duration/60)),
  });
}
