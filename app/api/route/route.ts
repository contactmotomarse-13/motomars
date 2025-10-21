import { NextRequest, NextResponse } from "next/server";
type OsrmRoute = { distance: number; duration: number };
type OsrmResponse = { code: "Ok"; routes: OsrmRoute[] } | { code: string; message?: string };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get("from") || "").trim();
  const to = (searchParams.get("to") || "").trim();
  if (!from || !to || !from.includes(",") || !to.includes(",")) {
    return NextResponse.json({ error: "bad_params" }, { status: 400 });
  }
  const url = `https://router.project-osrm.org/route/v1/driving/${from};${to}?overview=false`;
  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) return NextResponse.json({ error: "osrm_error" }, { status: r.status });
  const data: OsrmResponse = await r.json();
  if (data.code !== "Ok" || !("routes" in data) || !data.routes?.length) {
    return NextResponse.json({ error: "no_route" }, { status: 404 });
  }
  const route = data.routes[0];
  const km = route.distance / 1000;
  const minutes = Math.round(route.duration / 60);
  return NextResponse.json({ km, minutes });
}
