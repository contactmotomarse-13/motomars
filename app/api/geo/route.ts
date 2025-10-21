import { NextRequest, NextResponse } from "next/server";
type NominatimItem = { osm_id?: number | string; display_name: string; lon: string; lat: string };
type Feature = { id: number | string; name: string; lon: number; lat: number };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ features: [] as Feature[] });

  const email = process.env.NOMINATIM_EMAIL || "contact@example.com";
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "7");
  url.searchParams.set("countrycodes", "fr");

  const r = await fetch(url.toString(), {
    headers: { "User-Agent": `MotoMarse/1.0 (${email})`, "Accept-Language": "fr" },
    next: { revalidate: 60 },
  });
  if (!r.ok) return NextResponse.json({ features: [] as Feature[] }, { status: r.status });

  const raw: NominatimItem[] = await r.json();
  const features: Feature[] = raw.map(it => ({
    id: it.osm_id ?? it.display_name, name: it.display_name,
    lon: Number(it.lon), lat: Number(it.lat),
  }));
  return NextResponse.json({ features });
}
