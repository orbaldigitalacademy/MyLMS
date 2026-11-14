import React, { useState } from "react";
const fields = [
  ["professional_title","Professional title"],["bio","About me"],
  ["linkedin_url","LinkedIn URL"],["github_url","GitHub URL"],
  ["portfolio_url","Portfolio URL"]
];
export default function AlumniProfileForm({ profile, onSave, saving }) {
  const [data,setData] = useState({
    professional_title:profile.professional_title || "",bio:profile.bio || "",
    linkedin_url:profile.linkedin_url || "",github_url:profile.github_url || "",
    portfolio_url:profile.portfolio_url || "",
    skills:(profile.skills || []).join(", "),
    is_public: profile.is_public ?? true
  });
  return <form onSubmit={e=>{e.preventDefault();onSave({...data,skills:data.skills.split(",").map(x=>x.trim()).filter(Boolean)});}} className="space-y-4">
    {fields.map(([key,label])=><label key={key} className="block text-sm font-medium">{label}
      {key==="bio" ? <textarea className="mt-1 w-full rounded-lg border p-3 text-slate-900" rows={4} maxLength={1200} value={data[key]} onChange={e=>setData({...data,[key]:e.target.value})}/> :
      <input className="mt-1 w-full rounded-lg border p-3 text-slate-900" value={data[key]} maxLength={300} onChange={e=>setData({...data,[key]:e.target.value})}/>}
    </label>)}
    <label className="block text-sm font-medium">Skills (comma separated)
      <input className="mt-1 w-full rounded-lg border p-3 text-slate-900" value={data.skills} onChange={e=>setData({...data,skills:e.target.value})}/>
    </label>
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={data.is_public}
        onChange={(e) =>
          setData({
            ...data,
            is_public: e.target.checked,
          })
        }
      />
    
      <span>
        Show my profile in the public Alumni Directory
        <span className="block text-xs text-slate-500">
          (Uncheck to hide your profile.)
        </span>
      </span>
    </label>

    <button disabled={saving} className="rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving?"Saving...":"Save alumni profile"}</button>
  </form>;
}
