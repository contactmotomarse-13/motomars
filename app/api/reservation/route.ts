import { NextResponse } from "next/server";
type Reservation = {
  from:string; to:string; when:string; name:string; phone:string; email:string; notes?:string;
  estimate?: { price?:string; km?:string; minutes?:number };
};
export async function POST(req: Request) {
  const body = (await req.json()) as Reservation;
  if (process.env.RESEND_API_KEY && process.env.RESEND_TO) {
    const res = await fetch("https://api.resend.com/emails", {
      method:"POST",
      headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        from:"Moto Marse <noreply@motomarse.fr>", to:[process.env.RESEND_TO],
        subject:"Nouvelle réservation Moto Marse",
        text:`Trajet: ${body.from} → ${body.to}\nQuand: ${body.when}\nNom: ${body.name}\nTéléphone: ${body.phone}\nEmail: ${body.email}\n${body.estimate ? `Estimation: ${body.estimate.price} • ${body.estimate.km}km • ~${body.estimate.minutes}min\n`:""}${body.notes?`Notes: ${body.notes}\n`:""}`
      }),
    });
    if (!res.ok) return NextResponse.json({ ok:false, error:"email_failed" }, { status:502 });
    return NextResponse.json({ ok:true });
  }
  try {
    const fs = await import("fs/promises");
    await fs.mkdir(".data", { recursive:true });
    const p = ".data/reservations.json";
    let arr:Reservation[]=[]; try{ arr = JSON.parse(await fs.readFile(p,"utf8")); }catch{}
    arr.push(body); await fs.writeFile(p, JSON.stringify(arr,null,2), "utf8");
    return NextResponse.json({ ok:true, stored:true });
  } catch { return NextResponse.json({ ok:false, error:"store_failed" }, { status:500 }); }
}
