import { CSSProperties, useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [contests, setContests] = useState<any[]>([]);
  const [handle, setHandle] = useState('');
  useEffect(() => { fetch(`${API_BASE_URL}/api/contests`).then((r) => r.json()).then((d) => setContests(Array.isArray(d) ? d : [])).catch(() => setContests([])); }, []);
  if (status === 'loading') return <main style={page}><h1>Loading profile...</h1></main>;
  if (!session) return <main style={page}><section style={card}><h1>Sign in required</h1><p style={{ color: '#94a3b8' }}>Your profile shows account, handle, contests, and submissions.</p><a href="/signin" style={primary}>Sign in</a></section></main>;
  const name = session.user?.name || session.user?.email || 'DivineCode user';
  return <main style={page}><section style={{ maxWidth: 1120, margin: '0 auto' }}><nav style={nav}><a href="/" style={brand}>← DivineCode</a><button onClick={() => signOut()} style={ghost}>Sign out</button></nav><section style={hero}><div><p style={eyebrow}>Profile</p><h1 style={{ fontSize: 54, margin: 0 }}>{name}</h1><p style={{ color: '#a8b3c7' }}>{session.user?.email}</p></div>{session.user?.image && <img src={session.user.image} alt="Profile" style={avatar} />}</section><div style={grid}><section style={card}><h2>Codeforces handle</h2><p style={{ color: '#94a3b8' }}>Use this exact handle when creating contests. Your Google name is not used as the Codeforces handle.</p><input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="RKS_Rider" style={input} /><p style={{ color: '#67e8f9' }}>Saved per-contest currently. Global profile saving can be wired next.</p></section><section style={card}><h2>Activity snapshot</h2><p>Visible contests: <b>{contests.length}</b></p><p>Account: <b>{session.user?.email ? 'Google connected' : 'Guest'}</b></p><p>Judge mode: <b>Codeforces sync + Judge0-ready practice</b></p></section></div><section style={{ ...card, marginTop: 18 }}><h2>Your contest rooms</h2>{contests.length === 0 && <p style={{ color: '#94a3b8' }}>No contests visible yet.</p>}<div style={{ display: 'grid', gap: 12 }}>{contests.map((c) => <a key={c.id} href={`/contests/${c.id}`} style={contestRow}><strong>{c.title}</strong><span>{c.membersCount} members · {c.problemsCount} problems · {c.durationMinutes}m</span></a>)}</div></section></section></main>;
}
const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.32), transparent 34rem), #070a16' };
const nav: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 };
const brand: CSSProperties = { color: '#67e8f9', textDecoration: 'none', fontWeight: 900 };
const ghost: CSSProperties = { padding: '11px 16px', borderRadius: 999, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(2,6,23,.55)', color: '#eef2ff', cursor: 'pointer' };
const primary: CSSProperties = { display: 'inline-block', padding: '12px 17px', borderRadius: 999, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', textDecoration: 'none', fontWeight: 900 };
const hero: CSSProperties = { padding: 30, borderRadius: 30, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.22)', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' };
const eyebrow: CSSProperties = { color: '#67e8f9', fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' };
const avatar: CSSProperties = { width: 96, height: 96, borderRadius: 999, border: '2px solid rgba(34,211,238,.5)' };
const grid: CSSProperties = { marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 };
const card: CSSProperties = { padding: 24, borderRadius: 26, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.22)', boxShadow: '0 24px 70px rgba(0,0,0,.28)' };
const input: CSSProperties = { width: '100%', padding: 13, borderRadius: 14, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(2,6,23,.55)', color: '#eef2ff' };
const contestRow: CSSProperties = { color: '#eef2ff', textDecoration: 'none', padding: 16, borderRadius: 18, background: 'rgba(2,6,23,.55)', border: '1px solid rgba(148,163,184,.16)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' };
