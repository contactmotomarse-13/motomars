"use client";
import React from "react";
import { motion } from "framer-motion";
import { Bike, Star, Clock, Shield, Smartphone, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Types **/
type Place = { id: string | number; name: string; lon: number; lat: number };
type Estimate = { price: string; km: number; minutes: number };

/** Utilitaire de délai (debounce simple) **/
const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms = 350) => {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

/* --------- Simulateur Express --------- */
function Estimator({ onEstimate }: { onEstimate: (e: Estimate) => void }) {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [fromPick, setFromPick] = React.useState<Place | null>(null);
  const [toPick, setToPick] = React.useState<Place | null>(null);
  const [fromSug, setFromSug] = React.useState<Place[]>([]);
  const [toSug, setToSug] = React.useState<Place[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const debouncedFetch = React.useMemo(
    () =>
      debounce(async (q: string, which: "from" | "to") => {
        if (!q || q.length < 2) {
          (which === "from" ? setFromSug : setToSug)([]);
          return;
        }
        const r = await fetch(`/api/geo?q=${encodeURIComponent(q)}`);
        const data: { features?: Place[] } = await r.json();
        (which === "from" ? setFromSug : setToSug)(data.features ?? []);
      }, 350),
    []
  );

  React.useEffect(() => {
    debouncedFetch(from, "from");
    setFromPick(null);
  }, [from, debouncedFetch]);

  React.useEffect(() => {
    debouncedFetch(to, "to");
    setToPick(null);
  }, [to, debouncedFetch]);

  async function estimate() {
    setError(null);
    if (!fromPick || !toPick) {
      setError("Choisis les adresses dans la liste.");
      return;
    }
    setLoading(true);
    const r = await fetch(
      `/api/route?from=${fromPick.lon},${fromPick.lat}&to=${toPick.lon},${toPick.lat}`
    );
    const data: { km?: number; minutes?: number; error?: string } = await r.json();
    setLoading(false);
    if (!r.ok || !data.km || !data.minutes) {
      setError("Itinéraire introuvable.");
      return;
    }
    const km = data.km;
    const minutes = data.minutes;
    const airportWords = ["aéroport", "marseille provence", "mrs"];
    const hasAirport =
      [fromPick.name, toPick.name].some((n) =>
        airportWords.some((w) => n.toLowerCase().includes(w))
      );
    let price = Math.max(12, 5 + 2.2 * km);
    if (hasAirport) price = 39;
    onEstimate({ price: Math.round(price) + "€", km, minutes });
  }

  function Suggest({ items, onPick }: { items: Place[]; onPick: (it: Place) => void }) {
    if (!items.length) return null;
    return (
      <div className="border rounded-md bg-white shadow-sm max-h-48 overflow-auto">
        {items.map((it) => (
          <button
            key={it.id}
            className="block w-full text-left px-3 py-2 hover:bg-slate-50"
            onClick={() => onPick(it)}
          >
            {it.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>Simulateur express</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Départ (ex: Vieux-Port)"
          />
          <Suggest
            items={fromSug}
            onPick={(it) => {
              setFrom(it.name);
              setFromPick(it);
              setFromSug([]);
            }}
          />
        </div>
        <div>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Arrivée (ex: Aéroport MRS)"
          />
          <Suggest
            items={toSug}
            onPick={(it) => {
              setTo(it.name);
              setToPick(it);
              setToSug([]);
            }}
          />
        </div>
        <Button onClick={estimate} disabled={loading}>
          {loading ? "Calcul..." : "Estimer la course"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

/* --------- Page --------- */
export default function Home() {
  const [estimate, setEstimate] = React.useState<Estimate | undefined>(undefined);
  return (
    <div>
      <nav className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold">
            <Bike className="w-5 h-5" /> Moto Marse
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#pricing" className="hover:opacity-80">Tarifs</a>
            <a href="#reserve" className="hover:opacity-80">Réserver</a>
            <a href="#contact" className="hover:opacity-80">Contact</a>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Le moto-taxi malin à Marseille
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Arrivez à l’heure, sans stress. Simulateur express, réservation directe, chauffeurs pros.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <Star className="w-4 h-4" /> Note 4,9/5 • 10k+ trajets
          </div>
        </motion.div>
        <div className="space-y-4">
          <Estimator onEstimate={(e) => setEstimate(e)} />
          {estimate && (
            <div className="text-sm border rounded-md p-3 bg-slate-50">
              <div>Prix estimé : <b>{estimate.price}</b></div>
              <div>Distance : {estimate.km.toFixed(1)} km • Durée ~{estimate.minutes} min</div>
              <div className="text-xs text-gray-500 mt-1">Prix indicatif, confirmé avant départ.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
