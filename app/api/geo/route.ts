import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ features: [] });
  const url = "https://nominatim.openstreetmap.org/search"
    + `?format=jsonv2&limit=6&accept-language=fr&bounded=1`
    + `&viewbox=5.05,43.60,5.60,43.10&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, {
    headers: { "User-Agent": "MotoMarse/1.0 (contact@motomarse.fr)" },
    cache: "no-store",
  });
  if (!r.ok) return NextResponse.json({ features: [] }, { status: r.status });
  const data = await r.json();
  const features = (data || []).map((f:any)=>({
    id:f.place_id, name:f.display_name, lon:parseFloat(f.lon), lat:parseFloat(f.lat)
  }));
  return NextResponse.json({ features });
}
