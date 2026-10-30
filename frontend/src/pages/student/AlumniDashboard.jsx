import React,{useEffect,useState} from "react";
import AlumniProfileForm from "../../components/AlumniProfileForm";
import { alumniApi } from "../../services/alumniApi";
export default function AlumniDashboard(){
 const [profile,setProfile]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{alumniApi.me().then(setProfile).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 const save=async data=>{setSaving(true);setError("");setNotice("");try{setProfile(await alumniApi.updateMe(data));setNotice("Profile saved.");}catch(e){setError(e.message)}finally{setSaving(false)}};
 return <main className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-3xl">
 <div className="mb-8 rounded-2xl bg-blue-950 p-8 text-white"><p className="text-blue-200">ORBAL DIGITAL ACADEMY</p><h1 className="mt-2 text-3xl font-bold">Alumni Dashboard</h1><p className="mt-2 text-blue-100">Your achievements. Your network. Your next opportunity.</p></div>
 {loading?<p>Loading alumni profile...</p>:error&&!profile?<div role="alert" className="rounded-lg bg-red-50 p-5 text-red-800">{error} <a href="/login" className="underline">Sign in</a></div>:profile&&<div className="rounded-2xl bg-white p-7 shadow-sm">
 <h2 className="mb-2 text-2xl font-bold text-slate-900">Welcome, {profile.full_name || "Graduate"}</h2>
 <p className="mb-6 text-sm text-slate-600">Verified ODA alumnus · {profile.completed_course_ids?.length||0} completed course(s)</p>
 {notice&&<p role="status" className="mb-4 text-green-800">{notice}</p>}
 {error&&<p role="alert" className="mb-4 text-red-700">{error}</p>}
 <AlumniProfileForm key={profile.user_id} profile={profile} onSave={save} saving={saving}/>
 </div>}
 </div></main>;
}
