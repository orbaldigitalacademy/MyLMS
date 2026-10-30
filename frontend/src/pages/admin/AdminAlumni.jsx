import React,{useEffect,useState} from "react";
import { alumniApi } from "../../services/alumniApi";
export default function AdminAlumni(){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[message,setMessage]=useState("");
 const refresh=()=>alumniApi.adminList().then(d=>setItems(d.items||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));
 useEffect(()=>{refresh();},[]);
 const resend=async id=>{setError("");setMessage("");if(!window.confirm("Queue another alumni welcome email for this graduate?"))return;
 try{await alumniApi.resend(id);setMessage("Welcome email queued.");refresh();}catch(e){setError(e.message)}};
 return <main className="p-6"><h1 className="mb-6 text-3xl font-bold">Alumni Management</h1>
 {error&&<p role="alert" className="mb-3 text-red-700">{error}</p>}{message&&<p role="status" className="mb-3 text-green-700">{message}</p>}
 {loading?<p>Loading alumni...</p>:<div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Courses</th><th className="p-3">Public</th><th className="p-3">Email status</th><th className="p-3">Action</th></tr></thead>
 <tbody>{items.map(p=><tr key={p.user_id} className="border-t"><td className="p-3">{p.full_name}</td><td className="p-3">{p.email||"—"}</td><td className="p-3">{p.completed_course_ids?.length||0}</td><td className="p-3">{p.is_public?"Yes":"No"}</td><td className="p-3">{p.email_status||"No job"}</td><td className="p-3"><button onClick={()=>resend(p.user_id)} className="rounded bg-blue-900 px-3 py-2 text-white">Queue email</button></td></tr>)}</tbody></table>
 {!items.length&&<p className="p-5">No alumni found.</p>}</div>}</main>;
}
