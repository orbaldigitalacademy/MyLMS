import React, { useEffect, useState } from 'react';
import { alumniManagementApi } from '../../services/alumniManagementApi';

const TYPES = {
  opportunities: 'Career Opportunities',
  events: 'Events & Networking',
  announcements: 'Announcements',
};

export default function AlumniContentFeed({ kind }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    alumniManagementApi.feed(kind)
      .then(result => { if (active) setItems(result.items || []); })
      .catch(err => { if (active) setError(err.response?.data?.detail || err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind]);
  const safeLink = (url) => {
    try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? url : null; }
    catch { return null; }
  };
  return <section className="space-y-4">
    <h2 className="text-2xl font-bold text-slate-900">{TYPES[kind] || 'Alumni Updates'}</h2>
    {loading && <p>Loading updates...</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    {!loading && !error && items.length === 0 && <p className="rounded-lg bg-white p-5 text-slate-600">No published items yet.</p>}
    {items.map(item => <article key={item.id} className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-blue-950">{item.title}</h3>
      {(item.organization || item.location) && <p className="mt-1 text-sm text-slate-500">{[item.organization, item.location].filter(Boolean).join(' · ')}</p>}
      <p className="mt-3 whitespace-pre-wrap text-slate-700">{item.description}</p>
      {kind === 'events' && item.starts_at && <p className="mt-3 text-sm text-slate-600">Starts: {new Date(item.starts_at).toLocaleString()}</p>}
      {kind === 'opportunities' && item.deadline && <p className="mt-3 text-sm text-slate-600">Deadline: {new Date(item.deadline).toLocaleString()}</p>}
      {safeLink(item.external_url) && <a href={safeLink(item.external_url)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-lg bg-blue-950 px-4 py-2 text-white">Open details</a>}
    </article>)}
  </section>;
}
