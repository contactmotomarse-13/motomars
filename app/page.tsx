"use client";
import React from "react";
import { motion } from "framer-motion";
import { Bike, Star, Clock, Shield, Smartphone, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* --------- Simulateur (OSM + OSRM) --------- */
const useDebounce = (fn:Function, ms=350) => { let t:any; return (...a:any[])=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };
function Estimator({ onEstimate }:{ onEstimate:(e:{price:string;km:number;minutes:number})=>void }) {
  const [from,setFrom]=React.useState(""); const [to,setTo]=React.useState("");
  const [fromPick,setFromPick]=React.useState<any|null>(null); const [toPick,setToPick]=React.useState<any|null>(null);
  const [fromSug,setFromSug]=React.useState<any[]>([]); const [toSug,setToSug]=React.useState<any[]>([]);
  const [loading,setLoading]=React.useState(false); const [error,setError]=React.useState<string|null>(null);
  const fetchGeo = React.useMemo(()=>useDebounce(async(q:string,which:"from"|"to")=>{
    if(!q||q.length<2) return (which==="from"?setFromSug:setToSug)([]);
    const r=await fetch(`/api/geo?q=${encodeURIComponent(q)}`); const data=await r.json();
    (which==="from"?setFromSug:setToSug)(data.features||[]);
  },350),[]);
  React.useEffect(()=>{ fetchGeo(from,"from"); setFromPick(null); },[from]);
  React.useEffect(()=>{ fetchGeo(to,"to"); setToPick(null); },[to]);
  async function estimate(){
    setError(null);
    if(!fromPick||!toPick) return setError("Choisis les adresses dans la liste.");
    setLoading(true);
    const r=await fetch(`/api/route?from=${fromPick.lon},${fromPick.lat}&to=${toPick.lon},${toPick.lat}`); const data=await r.json();
    setLoading(false); if(data.error) return setError("Itinéraire introuvable.");
    const km:number=data.km; const minutes:number=data.minutes;
    const airport=["aéroport","marseille provence","mrs"]; const oneAirport=[fromPick.name,toPick.name].some((n:string)=>airport.some(w=>n?.toLowerCase().includes(w)));
    let price=Math.max(12,5+2.2*km); if(oneAirport) price=39;
    onEstimate({ price:Math.round(price)+"€", km, minutes });
  }
  const Suggest=({items,onPick}:{items:any[];onPick:(it:any)=>void})=>items.length?(
    <div className="border rounded-md bg-white shadow-sm max-h-48 overflow-auto">
      {items.map(it=>(<button key={it.id} className="block w-full text-left px-3 py-2 hover:bg-slate-50" onClick={()=>onPick(it)}>{it.name}</button>))}
    </div>
  ):null;
  return (
    <Card className="shadow-xl">
      <CardHeader><CardTitle>Simulateur express</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        <div><Input value={from} onChange={e=>setFrom(e.target.value)} placeholder="Départ (adresse exacte)"/><Suggest items={fromSug} onPick={(it)=>{setFrom(it.name);setFromPick(it);setFromSug([]);}}/></div>
        <div><Input value={to} onChange={e=>setTo(e.target.value)} placeholder="Arrivée (adresse exacte)"/><Suggest items={toSug} onPick={(it)=>{setTo(it.name);setToPick(it);setToSug([]);}}/></div>
        <Button onClick={estimate} disabled={loading}>{loading?"Calcul...":"Estimer la course"}</Button>
        {error&&<p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

/* --------- Réservation --------- */
function ReservationForm({ lastEstimate }:{ lastEstimate?:{price:string;km:number;minutes:number} }) {
  const [msg,setMsg]=React.useState<string|null>(null);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setMsg(null);
    const fd=new FormData(e.currentTarget);
    const payload={
      from:String(fd.get("from")||""), to:String(fd.get("to")||""), when:String(fd.get("when")||""),
      name:String(fd.get("name")||""), phone:String(fd.get("phone")||""), email:String(fd.get("email")||""),
      notes:String(fd.get("notes")||""), estimate:lastEstimate?{price:lastEstimate.price,km:String(lastEstimate.km),minutes:lastEstimate.minutes}:undefined
    };
    const r=await fetch("/api/reservation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await r.json(); setMsg(r.ok&&data.ok?"✅ Réservation envoyée. Nous vous contactons rapidement !":"❌ Erreur d’envoi, réessayez.");
  }
  return (
    <Card><CardHeader><CardTitle>Réserver maintenant</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={submit}>
          <Input name="from" placeholder="Départ (copiez l’adresse exacte)" required/>
          <Input name="to" placeholder="Arrivée (copiez l’adresse exacte)" required/>
          <Input name="when" placeholder="Date & heure (ex: 21/10 08:30)" required/>
          <Input name="name" placeholder="Nom et prénom" required/>
          <Input name="phone" placeholder="Téléphone" required/>
          <Input type="email" name="email" placeholder="Email" required/>
          <Textarea name="notes" placeholder="Précisions (bagage, lieu exact…)"/>
          {lastEstimate&&<p className="text-xs text-gray-500">Estimation jointe : {lastEstimate.price} • {lastEstimate.km.toFixed(1)} km • ~{lastEstimate.minutes} min (indicatif)</p>}
          <Button type="submit">Envoyer la réservation</Button>
          {msg&&<p className="text-sm mt-2">{msg}</p>}
        </form>
      </CardContent></Card>
  );
}

/* --------- Page --------- */
export default function Home(){
  const [estimate,setEstimate]=React.useState<{price:string;km:number;minutes:number}|undefined>(undefined);
  return (
    <div>
      <nav className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold"><Bike className="w-5 h-5"/> Moto Marse</span>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#pricing" className="hover:opacity-80">Tarifs</a>
            <a href="#reserve" className="hover:opacity-80">Réserver</a>
            <a href="#contact" className="hover:opacity-80">Contact</a>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 w-[40rem] h-[40rem] rounded-full opacity-20" style={{background:"radial-gradient(closest-side, hsl(var(--primary)), transparent)"}}/>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">Le moto-taxi malin à Marseille</h1>
            <p className="mt-4 text-lg text-gray-600">Arrivez à l’heure, sans stress. Simulateur express, réservation directe, chauffeurs pros.</p>
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500"><Star className="w-4 h-4"/> Note 4,9/5 • 10k+ trajets</div>
          </motion.div>
          <div className="space-y-4">
            <Estimator onEstimate={e=>setEstimate(e)}/>
            <div className="text-sm rounded-lg border p-3 bg-slate-50">
              <div className="font-semibold">Résultat :</div>
              {estimate ? (<div>Prix estimé <b>{estimate.price}</b> • {estimate.km.toFixed(1)} km • ~{estimate.minutes} min</div>)
                        : (<div>Utilise le simulateur pour obtenir une estimation.</div>)}
              <div className="text-xs text-gray-500 mt-1">Prix indicatif. Confirmé avant départ.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <Card className="shadow"><CardHeader><CardTitle>Aéroport ⇄ Centre</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">39€</div><p className="text-sm text-gray-600 mt-2">Sans surprise • Bagage inclus</p></CardContent></Card>
          <Card className="shadow"><CardHeader><CardTitle>Intra-muros</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">dès 12€</div><p className="text-sm text-gray-600 mt-2">Selon distance & trafic</p></CardContent></Card>
          <Card className="shadow"><CardHeader><CardTitle>Abonnements</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">Sur devis</div><p className="text-sm text-gray-600 mt-2">Entreprises & pros</p></CardContent></Card>
        </div>
      </section>

      <section id="reserve" className="py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-start">
          <ReservationForm lastEstimate={estimate}/>
          <div className="grid gap-6">
            <div className="flex items-center gap-2"><Clock className="w-5 h-5"/><span>Réponse rapide 7j/7</span></div>
            <div className="flex items-center gap-2"><Shield className="w-5 h-5"/><span>Équipement fourni • Assurance incluse</span></div>
            <div className="flex items-center gap-2"><Smartphone className="w-5 h-5"/><span>Confirmation par SMS</span></div>
            <div className="flex items-center gap-2"><MapPin className="w-5 h-5"/><span>Marseille, Aix & Aéroport (Marignane)</span></div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-3xl font-bold">Contact</h2>
            <p className="mt-2 text-gray-600">On vous répond vite.</p>
            <p className="mt-4 flex items-center gap-2"><Phone className="w-4 h-4"/> +33 4 84 00 00 00</p>
            <p className="mt-2 flex items-center gap-2"><Mail className="w-4 h-4"/> contact@motomarse.fr</p>
          </div>
        </div>
      </section>
    </div>
  );
}
