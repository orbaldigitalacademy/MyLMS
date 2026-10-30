// Uses the same JWT stored by the existing LMS. No new login flow.
const base = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
async function request(path, options={}){
 const token=localStorage.getItem("token");
 const adminToken=localStorage.getItem("admin_token");
 const res=await fetch(`${base}/api/alumni${path}`,{
   ...options, headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}),
   ...(adminToken?{"X-Admin-Token":adminToken}:{}),...(options.headers||{})}
 });
 let data;try{data=await res.json()}catch{data={}};
 if(!res.ok)throw new Error(typeof data.detail==="string"?data.detail:`Request failed (${res.status})`);
 return data;
}
export const alumniApi={
 directory:()=>request("/public"),
 me:()=>request("/me"),
 updateMe:data=>request("/me",{method:"PATCH",body:JSON.stringify(data)}),
 adminList:()=>request("/admin"),
 resend:userId=>request(`/admin/${encodeURIComponent(userId)}/resend`,{method:"POST"})
};
