import React, { useCallback, useEffect, useState } from 'react';
import { alumniManagementApi as service } from '../../services/alumniManagementApi';

const KINDS = [
  { key: 'opportunities', label: 'Careers' },
  { key: 'events', label: 'Events' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'directory', label: 'Directory visibility' },
];
const EMPTY = { title: '', description: '', status: 'draft', organization: '', location: '', opportunity_type: 'other', external_url: '', starts_at: '', ends_at: '', deadline: '' };
const toLocalInput = (value) => value ? value.slice(0, 16) : '';
const toIso = (value) => value ? new Date(value).toISOString() : '';

export default function AdminAlumniManagement() {
  const [kind, setKind] = useState('opportunities');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = kind === 'directory' ? await service.directory() : await service.adminList(kind);
      setItems(result.items || []);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { load(); }, [load]);

  const changeKind = (next) => { setKind(next); setEditingId(null); setForm(EMPTY); setNotice(''); };
  const edit = (item) => {
    setEditingId(item.id);
    setForm(Object.fromEntries(Object.keys(EMPTY).map(key => [key, ['starts_at', 'ends_at', 'deadline'].includes(key) ? toLocalInput(item[key]) : (item[key] ?? EMPTY[key])])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const payload = { ...form, starts_at: toIso(form.starts_at), ends_at: toIso(form.ends_at), deadline: toIso(form.deadline) };
      if (editingId) await service.update(kind, editingId, payload);
      else await service.create(kind, payload);
      setNotice(editingId ? 'Content updated.' : 'Content created.');
      setEditingId(null); setForm(EMPTY); await load();
    } catch (e) { setError(e.response?.data?.detail?.[0]?.msg || e.response?.data?.detail || e.message); }
    finally { setBusy(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}" permanently?`)) return;
    setBusy(true); setError('');
    try { await service.remove(kind, item.id); setNotice('Deleted.'); await load(); }
    catch (e) { setError(e.response?.data?.detail || e.message); }
    finally { setBusy(false); }
  };
  const toggleHidden = async (person) => {
    setBusy(true); setError('');
    try { await service.setHidden(person.user_id, !person.hidden_by_admin); await load(); }
    catch (e) { setError(e.response?.data?.detail || e.message); }
    finally { setBusy(false); }
  };
  const field = (key, label, type = 'text') => (
    <label className="block text-sm font-medium text-slate-700" key={key}>{label}
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
    </label>
  );
  return <main className="min-h-screen bg-slate-50 p-4 md:p-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-2xl bg-blue-950 p-6 text-white"><h1 className="text-2xl font-bold">ODA Alumni Management</h1><p className="mt-1 text-blue-100">Manage graduate visibility, careers, events and announcements.</p></header>
      <nav className="flex flex-wrap gap-2" aria-label="Alumni management sections">{KINDS.map(k => <button key={k.key} type="button" onClick={() => changeKind(k.key)} className={`rounded-lg px-4 py-2 text-sm ${kind === k.key ? 'bg-blue-950 text-white' : 'bg-white text-slate-700 border'}`}>{k.label}</button>)}</nav>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{typeof error === 'string' ? error : JSON.stringify(error)}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{notice}</p>}
      {kind !== 'directory' && <form onSubmit={save} className="rounded-xl bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Create'} {kind.slice(0, -1)}</h2>
        <div className="grid gap-4 md:grid-cols-2">{field('title', 'Title')}{field('organization', 'Organization')}{field('location', 'Location')}{field('external_url', 'External URL')}
          {kind === 'opportunities' && <><label className="text-sm">Opportunity type<select value={form.opportunity_type} onChange={e => setForm(p => ({ ...p, opportunity_type: e.target.value }))} className="mt-1 block w-full rounded-lg border p-3">{['job','internship','freelance','scholarship','other'].map(t => <option key={t}>{t}</option>)}</select></label>{field('deadline','Deadline','datetime-local')}</>}
          {kind === 'events' && <>{field('starts_at','Starts at','datetime-local')}{field('ends_at','Ends at','datetime-local')}</>}
          <label className="text-sm">Publication status<select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="mt-1 block w-full rounded-lg border p-3">{['draft','published','archived'].map(t => <option key={t}>{t}</option>)}</select></label>
        </div>
        <label className="block text-sm">Description<textarea required minLength={5} rows={5} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 w-full rounded-lg border p-3" /></label>
        <div className="flex gap-3"><button disabled={busy || form.title.trim().length < 3} className="rounded-lg bg-blue-950 px-5 py-3 text-white disabled:opacity-50">{editingId ? 'Save changes' : 'Create content'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="rounded-lg border px-5 py-3">Cancel</button>}</div>
      </form>}
      <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-semibold">{kind === 'directory' ? 'Verified alumni directory controls' : `Existing ${kind}`}</h2>
        {loading ? <p>Loading...</p> : !items.length ? <p className="text-slate-500">No records yet.</p> : <div className="space-y-3">{items.map(item => <div key={item.id || item.user_id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 md:flex-row md:items-center">
          <div><h3 className="font-semibold">{item.title || item.full_name || item.user_id}</h3><p className="text-sm text-slate-500">{kind === 'directory' ? `Opted in: ${item.is_public ? 'Yes' : 'No'} · Admin hidden: ${item.hidden_by_admin ? 'Yes' : 'No'}` : `${item.status} · ${item.organization || item.location || ''}`}</p></div>
          {kind === 'directory' ? <button type="button" disabled={busy} onClick={() => toggleHidden(item)} className="rounded-lg border px-4 py-2">{item.hidden_by_admin ? 'Remove admin hide' : 'Hide from directory'}</button> : <div className="flex gap-2"><button type="button" onClick={() => edit(item)} className="rounded-lg border px-4 py-2">Edit</button><button type="button" disabled={busy} onClick={() => remove(item)} className="rounded-lg bg-red-50 px-4 py-2 text-red-700">Delete</button></div>}
        </div>)}</div>}
      </section>
    </div>
  </main>;
}
