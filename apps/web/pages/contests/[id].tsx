import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export async function getServerSideProps() { return { props: {} }; }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function ContestRoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [contest, setContest] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Not synced yet');
  const syncingRef = useRef(false);

  async function loadContest() {
    if (!id) return;
    const res = await fetch(`${API_BASE_URL}/api/contests/${id}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Contest not found'); return; }
    setContest(data);
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000));
    setTimeLeft(Math.max(0, data.durationMinutes * 60 - elapsed));
  }
  async function loadSubmissions() { if (!id) return; const res = await fetch(`${API_BASE_URL}/api/contests/${id}/submissions`); const data = await res.json(); setSubmissions(Array.isArray(data) ? data : []); }
  async function syncCodeforces(silent = false) {
    if (!id || syncingRef.current) return;
    syncingRef.current = true;
    if (!silent) setSyncing(true);
    const res = await fetch(`${API_BASE_URL}/api/contests/${id}/sync/codeforces`, { method: 'POST' });
    const data = await res.json();
    syncingRef.current = false;
    setSyncing(false);
    if (!res.ok) { if (!silent) alert(data.error || 'Sync failed'); return; }
    await loadContest();
    await loadSubmissions();
    setLastSync(`${new Date().toLocaleTimeString()} · ${data.synced?.length || 0} accepted`);
    if (!silent) alert(`Synced ${data.synced?.length || 0} accepted submission(s).`);
  }
  async function extendTime(minutes: number) { if (!id) return; const res = await fetch(`${API_BASE_URL}/api/contests/${id}/extend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minutes }) }); const data = await res.json(); if (!res.ok) return alert(data.error || 'Could not extend'); setContest(data); }

  useEffect(() => { loadContest(); loadSubmissions(); }, [id]);
  useEffect(() => { const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!id || !session) return; const live = setInterval(() => { loadContest(); loadSubmissions(); syncCodeforces(true); }, 30000); return () => clearInterval(live); }, [id, session]);

  if (status === 'loading') return <main style={page}><h1>Checking account...</h1></main>;
  if (!session) return <main style={page}><section style={gate}><h1>Sign in required</h1><p style={{ color: '#a8b3c7' }}>Sign in first. Codeforces problems update standings only after verified external Accepted submissions.</p><a href="/signin" style={primaryLink}>Sign in with Google</a></section></main>;
  if (error) return <main style={page}><h1>{error}</h1><a href="/contests" style={link}>Back to contests</a></main>;
  if (!contest) return <main style={page}><h1>Loading contest...</h1></main>;

  return <main style={page}><section style={{ maxWidth: 1240, margin: '0 auto' }}><nav style={nav}><a href="/" style={link}>← DivineCode</a><div style={userPill}>{session.user?.name || session.user?.email}</div></nav><div style={hero}><div><p style={eyebrow}>Live verified gym room</p><h1 style={{ fontSize: 46, margin: 0 }}>{contest.title}</h1><p style={{ color: '#a8b3c7' }}>Auto-sync runs every 30 seconds. Codeforces standings update only from real Accepted submissions.</p><p style={{ color: '#67e8f9' }}>Last sync: {lastSync}</p></div><div style={timerCard}><strong>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</strong><span>remaining</span></div></div><div style={grid}><section style={panel}><h2>Owner controls</h2><button onClick={() => syncCodeforces(false)} disabled={syncing} style={primaryButton}>{syncing ? 'Syncing...' : 'Sync Codeforces now'}</button><button onClick={() => extendTime(15)} style={ghostButton}>+15 min</button><button onClick={() => extendTime(30)} style={ghostButton}>+30 min</button><h2>Participants</h2>{contest.members.map((m: any) => <p key={m.id} style={{ color: '#cbd5e1' }}>{m.name}<br/><span style={{ color: '#67e8f9' }}>CF: {m.codeforcesHandle || m.handle || 'missing'}</span></p>)}</section><section style={panelWide}><h2>Problems</h2><div style={{ display: 'grid', gap: 12 }}>{contest.problems.map((p: any, index: number) => <div key={p.id} style={problemRow}><strong style={{ color: '#67e8f9', fontSize: 22 }}>{String.fromCharCode(65 + index)}</strong><div><a href={p.url} target="_blank" rel="noreferrer" style={{ color: '#eef2ff', fontWeight: 900 }}>{p.title}</a><p style={{ margin: '6px 0 0', color: '#94a3b8' }}>{p.platform} · Rating {p.rating || p.difficulty || 'Practice'} · {(p.tags || []).join(', ')}</p></div><a href={`/submit?contestId=${contest.id}&problemId=${p.id}`} style={primaryLink}>{p.platform?.toLowerCase().includes('codeforces') ? 'Submit on CF' : 'Submit'}</a></div>)}</div></section></div><section style={{ ...panel, marginTop: 18 }}><h2>Standings</h2><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Rank</th><th style={th}>Member</th><th style={th}>Solved</th><th style={th}>Penalty</th><th style={th}>Score</th></tr></thead><tbody>{contest.standings.map((s: any, i: number) => <tr key={s.memberId}><td style={td}>#{i + 1}</td><td style={td}>{s.name}</td><td style={td}>{s.solved}</td><td style={td}>{s.penalty}</td><td style={td}>{s.score}</td></tr>)}</tbody></table></div></section><section style={{ ...panel, marginTop: 18 }}><h2>Submission feed</h2>{submissions.length === 0 && <p style={{ color: '#94a3b8' }}>No submissions synced yet.</p>}<div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Time</th><th style={th}>User</th><th style={th}>Problem</th><th style={th}>Verdict</th><th style={th}>Source</th></tr></thead><tbody>{submissions.map((s) => <tr key={s.id}><td style={td}>{new Date(s.createdAt).toLocaleString()}</td><td style={td}>{s.userId}</td><td style={td}>{s.problemId}</td><td style={td}>{s.verdict}</td><td style={td}>{s.source || s.platform || 'DivineCode'}</td></tr>)}</tbody></table></div></section></section></main>;
}
const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.32), transparent 34rem), #070a16' };
const nav: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 };
const userPill: CSSProperties = { padding: '10px 14px', borderRadius: 999, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.22)' };
const gate: CSSProperties = { maxWidth: 620, margin: '15vh auto', padding: 34, borderRadius: 28, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const link: CSSProperties = { color: '#67e8f9', textDecoration: 'none', fontWeight: 800 };
const primaryLink: CSSProperties = { display: 'inline-block', padding: '11px 15px', borderRadius: 999, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 900, cursor: 'pointer', textDecoration: 'none' };
const primaryButton: CSSProperties = { ...primaryLink, width: '100%', marginBottom: 10 };
const ghostButton: CSSProperties = { width: '100%', padding: '11px 15px', borderRadius: 999, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(2,6,23,.55)', color: '#eef2ff', fontWeight: 800, cursor: 'pointer', marginBottom: 10 };
const eyebrow: CSSProperties = { color: '#67e8f9', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' };
const hero: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap', margin: '24px 0' };
const timerCard: CSSProperties = { minWidth: 170, padding: 22, borderRadius: 24, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', display: 'grid', gap: 4, textAlign: 'center' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(260px, .8fr) minmax(320px, 1.7fr)', gap: 18 };
const panel: CSSProperties = { padding: 24, borderRadius: 26, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const panelWide: CSSProperties = { ...panel };
const problemRow: CSSProperties = { display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, background: 'rgba(2,6,23,.5)', border: '1px solid rgba(148,163,184,.16)' };
const th: CSSProperties = { textAlign: 'left', padding: 12, color: '#67e8f9', borderBottom: '1px solid rgba(148,163,184,.18)' };
const td: CSSProperties = { padding: 12, borderBottom: '1px solid rgba(148,163,184,.12)' };
