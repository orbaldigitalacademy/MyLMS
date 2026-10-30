import React,{useEffect,useState} from "react";
import { alumniApi } from "../services/alumniApi";
export default function AlumniPage(){
 const [profiles,setProfiles]=useState([]),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{alumniApi.directory().then(d=>setProfiles(d.items||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 return <main className="min-h-screen bg-slate-50"><header className="bg-blue-950 px-5 py-16 text-center text-white">
 <p className="tracking-widest text-blue-200">ORBAL DIGITAL ACADEMY</p><h1 className="mt-3 text-4xl font-bold">Our Alumni Network</h1>
 <p className="mx-auto mt-3 max-w-xl text-blue-100">Celebrating graduates building careers, products and opportunities with digital skills.</p>
 <a href="/alumni/dashboard" className="mt-6 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-blue-950">Alumni Dashboard</a>
 </header><section className="mx-auto max-w-6xl px-5 py-12"><h2 className="mb-6 text-2xl font-bold">Meet our graduates</h2>
 {loading?<p>Loading alumni...</p>:error?<p role="alert">{error}</p>:profiles.length===0?<p>Public alumni profiles will appear here when graduates choose to share them.</p>:
 <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{profiles.map(p=><article key={p.user_id} className="rounded-2xl bg-white p-6 shadow-sm">
 <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-900">{(p.full_name||"A").slice(0,1)}</div>
 <h3 className="text-xl font-semibold">{p.full_name}</h3><p className="text-blue-800">{p.professional_title||"ODA Graduate"}</p>
 {p.bio&&<p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{p.bio}</p>}
 <p className="mt-3 text-sm text-slate-500">{(p.skills||[]).join(" · ")}</p>
 <div className="mt-4 flex flex-wrap gap-3 text-sm">{["linkedin_url","github_url","portfolio_url"].filter(k=>p[k]).map(k=><a key={k} className="text-blue-800 underline" href={p[k]} target="_blank" rel="noopener noreferrer">{k.replace("_url","").replace("linkedin","LinkedIn").replace("github","GitHub")}</a>)}</div>
 </article>)}</div>}
 </section></main>;
}
