import { CSSProperties, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function PracticePage() {
  const [problems, setProblems] = useState<any[]>([]);
  useEffect(() => { fetch(`${API_BASE_URL}/api/problems`).then((r) => r.json()).then((d) => setProblems(Array.isArray(d) ? d : [])).catch(() => setProblems([])); }, []);
  return <main style={page}><section style={{ maxWidth: 1180, margin: '0 auto' }}><nav style={nav}><a href="/" style={brand}>DivineCode Practice</a><a href="/contests" style={pill}>Contests</a></nav><div style={hero}><p style={eyebrow}>Local judge workspace</p><h1 style={{ fontSize: 58, margin: 0 }}>Practice with real verdicts.</h1><p style={{ color: '#a8b3c7' }}>Built-in practice problems run through the local judge path. External Codeforces problems are verified through Codeforces sync.</p></div><div style={grid}>{problems.map((p) => <a key={p.id} href={`/practice/${p.id}`} style={card}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={tag}>{p.difficulty}</span><span style={{ color: '#67e8f9' }}>{(p.tags || []).join(', ')}</span></div><h2>{p.title}</h2><p style={{ color: '#94a3b8' }}>{p.description}</p></a>)}</div></section></main>;
}
const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.3), transparent 34rem), #070a16' };
const nav: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 };
const brand: CSSProperties = { color: '#fff', textDecoration: 'none', fontWeight: 950, fontSize: 24 };
const pill: CSSProperties = { color: '#dbeafe', textDecoration: 'none', padding: '11px 16px', borderRadius: 999, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(15,23,42,.72)' };
const hero: CSSProperties = { padding: 30, borderRadius: 30, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.22)', marginBottom: 18 };
const eyebrow: CSSProperties = { color: '#67e8f9', fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 };
const card: CSSProperties = { color: '#eef2ff', textDecoration: 'none', padding: 22, borderRadius: 24, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)' };
const tag: CSSProperties = { color: '#020617', background: '#67e8f9', padding: '6px 10px', borderRadius: 999, fontWeight: 900 };
