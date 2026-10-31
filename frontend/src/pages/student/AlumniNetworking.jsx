import React, { useCallback, useEffect, useState } from 'react';
import { alumniNetworkingApi as api } from '../../services/alumniNetworkingApi';

export default function AlumniNetworking() {
  const [tab, setTab] = useState('discover');
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [settings, setSettings] = useState({is_available:false, expertise:[], mentoring_bio:'', max_mentees:3});
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [p,m,r,s] = await Promise.all([api.discover(query),api.mentors(),api.requests(),api.myMentor()]);
      setPeople(p.items || []); setMentors(m.items || []); setRequests(r.items || []); setSettings(s);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
  }, [query]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, success) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); setNotice(success); await load(); }
    catch(e) { setError(e.response?.data?.detail || e.message); }
    finally { setBusy(false); }
  };

  return <section className="space-y-5">
    <h2 className="text-2xl font-bold text-blue-950">Alumni Networking & Mentorship</h2>
    <div className="flex flex-wrap gap-2">{[['discover','Discover Alumni'],['mentors','Find Mentors'],['requests','My Requests'],['settings','Become a Mentor']].map(([id,label]) =>
      <button key={id} onClick={()=>setTab(id)} className={`rounded-lg px-4 py-2 ${tab===id?'bg-blue-950 text-white':'bg-slate-100 text-slate-700'}`}>{label}</button>)}</div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{notice}</p>}
    {tab==='discover' && <div className="space-y-3">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, title or skill" className="w-full rounded-lg border p-3" />
      {people.length===0 && <p>No visible alumni found.</p>}
      {people.map(p=><article key={p.user_id} className="rounded-xl bg-white p-5 shadow-sm"><h3 className="font-bold">{p.full_name}</h3><p>{p.professional_title}</p><p className="text-sm text-slate-600">{(p.skills||[]).join(', ')}</p>{p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">LinkedIn</a>}</article>)}
    </div>}
    {tab==='mentors' && <div className="space-y-3">{mentors.length===0 && <p>No mentors are currently available.</p>}{mentors.map(m=><article key={m.user_id} className="rounded-xl bg-white p-5 shadow-sm"><h3 className="font-bold">{m.full_name}</h3><p>{m.professional_title}</p><p>{m.mentoring_bio}</p><p className="text-sm text-slate-600">Expertise: {(m.expertise||[]).join(', ')}</p><button className="mt-3 rounded bg-blue-950 px-4 py-2 text-white" onClick={()=>{setSelected(m.user_id);setMessage('');}}>Request Mentorship</button>{selected===m.user_id && <div className="mt-3 space-y-2"><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Explain your mentorship goals (at least 20 characters)" className="w-full rounded border p-3" rows={4}/><button disabled={busy || message.trim().length<20} onClick={()=>run(()=>api.request({mentor_id:m.user_id,message}), 'Mentorship request sent.')} className="rounded bg-blue-950 px-4 py-2 text-white disabled:opacity-50">Send Request</button></div>}</article>)}</div>}
    {tab==='requests' && <div className="space-y-3">{requests.length===0 && <p>No mentorship requests yet.</p>}{requests.map(r=><article key={r.id} className="rounded-xl bg-white p-5 shadow-sm"><p className="font-semibold">Status: {r.status}</p><p className="text-sm">Mentor ID: {r.mentor_id}</p><p className="text-sm">Mentee ID: {r.mentee_id}</p><p className="mt-2 whitespace-pre-wrap">{r.message}</p><div className="mt-3 flex flex-wrap gap-2">{r.status==='pending' && <><button disabled={busy} onClick={()=>run(()=>api.decide(r.id,'accepted'),'Request accepted.')} className="rounded bg-green-700 px-3 py-2 text-white">Accept (mentor only)</button><button disabled={busy} onClick={()=>run(()=>api.decide(r.id,'declined'),'Request declined.')} className="rounded bg-slate-700 px-3 py-2 text-white">Decline (mentor only)</button></>}{['pending','accepted'].includes(r.status) && <button disabled={busy} onClick={()=>run(()=>api.decide(r.id,'cancelled'),'Request cancelled.')} className="rounded border px-3 py-2">Cancel (mentee only)</button>}</div></article>)}</div>}
    {tab==='settings' && <form onSubmit={e=>{e.preventDefault();run(()=>api.saveMentor(settings),'Mentor preferences saved.');}} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <label className="flex items-center gap-2"><input type="checkbox" checked={settings.is_available} onChange={e=>setSettings({...settings,is_available:e.target.checked})}/> Make me available as a mentor</label>
      <p className="text-sm text-slate-600">To appear in the mentor directory, your alumni profile must also be opted into the public directory.</p>
      <label className="block">Expertise (comma-separated)<input className="mt-1 w-full rounded border p-2" value={(settings.expertise||[]).join(', ')} onChange={e=>setSettings({...settings,expertise:e.target.value.split(',').map(s=>s.trim()).slice(0,12)})}/></label>
      <label className="block">Mentoring bio<textarea className="mt-1 w-full rounded border p-2" rows={4} value={settings.mentoring_bio} onChange={e=>setSettings({...settings,mentoring_bio:e.target.value})}/></label>
      <label className="block">Maximum mentees<input type="number" min="1" max="20" className="mt-1 w-full rounded border p-2" value={settings.max_mentees} onChange={e=>setSettings({...settings,max_mentees:Number(e.target.value)})}/></label>
      <button disabled={busy} className="rounded bg-blue-950 px-4 py-2 text-white disabled:opacity-50">Save Preferences</button>
    </form>}
  </section>;
}
