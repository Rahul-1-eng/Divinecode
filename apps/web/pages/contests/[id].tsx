import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function ContestRoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [contest, setContest] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState('');

  async function loadContest() {
    if (!id) return;
    const res = await fetch(`${API_BASE_URL}/api/contests/${id}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Contest not found'); return; }
    setContest(data);
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000));
    setTimeLeft(Math.max(0, data.durationMinutes * 60 - elapsed));
  }

  useEffect(() => { loadContest(); }, [id]);
  useEffect(() => { const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000); return () => clearInterval(timer); }, []);

  if (status === 'loading') return <main style={page}><h1>Checking account...</h1></main>;
  if (!session) return <main style={page}><section style={gate}><h1>Sign in required</h1><p style={{ color: '#a8b3c7' }}>Contest rooms work like Codeforces Gym: sign in first, then submit solutions from your account so standings update automatically.</p><a href="/signin" style={primaryLink}>Sign in with Google</a></section></main>;
  if (error) return <main style={page}><h1>{error}</h1><a href="/contests" style={link}>Back to contests</a></main>;
  if (!contest) return <main style={page}><h1>Loading contest...</h1></main>;

  return (
    <main style={page}>
      <section style={{ maxWidth: 1240, margin: '0 auto' }}>
        <a href="/" style={link}>← DivineCode</a>
        <div style={hero}>
          <div><p style={eyebrow}>Codeforces Gym style mashup</p><h1 style={{ fontSize: 46, margin: 0 }}>{contest.title}</h1><p style={{ color: '#a8b3c7' }}>Signed in as {session.user?.email}. Submit solutions from your account; accepted submissions update standings automatically.</p></div>
          <div style={timerCard}><strong>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</strong><span>remaining</span></div>
        </div>
        <div style={grid}>
          <section style={panel}>
            <h2>Contest info</h2>
            <p style={{ color: '#94a3b8' }}>Members: {contest.members.length}</p>
            <p style={{ color: '#94a3b8' }}>Problems: {contest.problems.length}</p>
            <h2>Invite</h2><input readOnly value={typeof window !== 'undefined' ? window.location.href : ''} style={input} onFocus={(e) => e.currentTarget.select()} />
            <p style={{ color: '#fbbf24' }}>Manual solved buttons were removed. This room now expects account-based submissions.</p>
          </section>
          <section style={panelWide}>
            <h2>Problems</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {contest.problems.map((p: any, index: number) => (
                <div key={p.id} style={problemRow}>
                  <strong style={{ color: '#67e8f9', fontSize: 22 }}>{String.fromCharCode(65 + index)}</strong>
                  <div><a href={p.url} target="_blank" rel="noreferrer" style={{ color: '#eef2ff', fontWeight: 900 }}>{p.title}</a><p style={{ margin: '6px 0 0', color: '#94a3b8' }}>{p.platform} · {p.difficulty || 'Practice'} · {(p.tags || []).join(', ')}</p></div>
                  <a href={`/submit?contestId=${contest.id}&problemId=${p.id}`} style={primaryLink}>Submit</a>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section style={{ ...panel, marginTop: 18 }}>
          <h2>Standings</h2>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Rank</th><th style={th}>Member</th><th style={th}>Solved</th><th style={th}>Penalty</th><th style={th}>Score</th></tr></thead><tbody>{contest.standings.map((s: any, i: number) => <tr key={s.memberId}><td style={td}>#{i + 1}</td><td style={td}>{s.name}</td><td style={td}>{s.solved}</td><td style={td}>{s.penalty}</td><td style={td}>{s.score}</td></tr>)}</tbody></table></div>
        </section>
      </section>
    </main>
  );
}
const page = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.32), transparent 34rem), #070a16' };
const gate = { maxWidth: 620, margin: '15vh auto', padding: 34, borderRadius: 28, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const link = { color: '#67e8f9', textDecoration: 'none', fontWeight: 800 };
const primaryLink = { display: 'inline-block', padding: '11px 15px', borderRadius: 999, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 900, cursor: 'pointer', textDecoration: 'none' };
const eyebrow = { color: '#67e8f9', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' as const };
const hero = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const, margin: '24px 0' };
const timerCard = { minWidth: 170, padding: 22, borderRadius: 24, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', display: 'grid', gap: 4, textAlign: 'center' as const };
const grid = { display: 'grid', gridTemplateColumns: 'minmax(260px, .8fr) minmax(320px, 1.7fr)', gap: 18 };
const panel = { padding: 24, borderRadius: 26, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const panelWide = { ...panel };
const input = { width: '100%', padding: 13, borderRadius: 14, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(2,6,23,.55)', color: '#eef2ff' };
const problemRow = { display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, background: 'rgba(2,6,23,.5)', border: '1px solid rgba(148,163,184,.16)' };
const th = { textAlign: 'left' as const, padding: 12, color: '#67e8f9', borderBottom: '1px solid rgba(148,163,184,.18)' };
const td = { padding: 12, borderBottom: '1px solid rgba(148,163,184,.12)' };
