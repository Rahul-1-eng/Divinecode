import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function ContestRoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const [contest, setContest] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [error, setError] = useState('');

  async function loadContest() {
    if (!id) return;
    const res = await fetch(`${API_BASE_URL}/api/contests/${id}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Contest not found'); return; }
    setContest(data);
    if (!selectedMemberId && data.members?.[0]?.id) setSelectedMemberId(data.members[0].id);
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000));
    setTimeLeft(Math.max(0, data.durationMinutes * 60 - elapsed));
  }

  useEffect(() => { loadContest(); }, [id]);
  useEffect(() => { const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000); return () => clearInterval(timer); }, []);

  const selectedStanding = useMemo(() => contest?.standings?.find((s: any) => s.memberId === selectedMemberId), [contest, selectedMemberId]);
  function isSolved(problemId: string) { return Boolean(selectedStanding?.solvedProblems?.includes(problemId)); }
  async function toggleSolve(problemId: string) {
    if (!id || !selectedMemberId) return alert('Select a member first');
    const solved = isSolved(problemId);
    const res = await fetch(`${API_BASE_URL}/api/contests/${id}/${solved ? 'unsolve' : 'solve'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: selectedMemberId, problemId }) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Could not update solve');
    setContest(data);
  }

  if (error) return <main style={page}><h1>{error}</h1><a href="/contests">Back to contests</a></main>;
  if (!contest) return <main style={page}><h1>Loading contest...</h1></main>;

  return (
    <main style={page}>
      <section style={{ maxWidth: 1200, margin: '0 auto' }}>
        <a href="/" style={link}>← DivineCode</a>
        <div style={hero}>
          <div><p style={eyebrow}>Codeforces Gym style room</p><h1 style={{ fontSize: 46, margin: 0 }}>{contest.title}</h1><p style={{ color: '#a8b3c7' }}>{contest.description || 'Private group contest with live standings.'}</p></div>
          <div style={timerCard}><strong>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</strong><span>remaining</span></div>
        </div>
        <div style={grid}>
          <section style={panel}>
            <h2>Contestant</h2>
            <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} style={input}>
              {contest.members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <p style={{ color: '#94a3b8' }}>Choose a member, then mark problems solved. Standings update immediately.</p>
            <h2>Invite</h2><input readOnly value={typeof window !== 'undefined' ? window.location.href : ''} style={input} onFocus={(e) => e.currentTarget.select()} />
          </section>
          <section style={panelWide}>
            <h2>Problems</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {contest.problems.map((p: any, index: number) => (
                <div key={p.id} style={problemRow}>
                  <strong style={{ color: '#67e8f9' }}>{String.fromCharCode(65 + index)}</strong>
                  <div><a href={p.url} target="_blank" rel="noreferrer" style={{ color: '#eef2ff', fontWeight: 800 }}>{p.title}</a><p style={{ margin: '6px 0 0', color: '#94a3b8' }}>{p.platform} · {p.difficulty || 'Practice'} · {(p.tags || []).join(', ')}</p></div>
                  <button onClick={() => toggleSolve(p.id)} style={isSolved(p.id) ? solvedBtn : primaryBtn}>{isSolved(p.id) ? 'Solved ✓' : 'Mark solved'}</button>
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
const link = { color: '#67e8f9', textDecoration: 'none', fontWeight: 800 };
const eyebrow = { color: '#67e8f9', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' as const };
const hero = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const, margin: '24px 0' };
const timerCard = { minWidth: 170, padding: 22, borderRadius: 24, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', display: 'grid', gap: 4, textAlign: 'center' as const };
const grid = { display: 'grid', gridTemplateColumns: 'minmax(260px, .8fr) minmax(320px, 1.7fr)', gap: 18 };
const panel = { padding: 24, borderRadius: 26, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const panelWide = { ...panel };
const input = { width: '100%', padding: 13, borderRadius: 14, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(2,6,23,.55)', color: '#eef2ff' };
const problemRow = { display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, background: 'rgba(2,6,23,.5)', border: '1px solid rgba(148,163,184,.16)' };
const primaryBtn = { padding: '11px 15px', borderRadius: 999, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 900, cursor: 'pointer' };
const solvedBtn = { ...primaryBtn, background: '#22c55e' };
const th = { textAlign: 'left' as const, padding: 12, color: '#67e8f9', borderBottom: '1px solid rgba(148,163,184,.18)' };
const td = { padding: 12, borderBottom: '1px solid rgba(148,163,184,.12)' };
