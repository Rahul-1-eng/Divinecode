import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const fallbackSuggestions = ['Code Warrior', 'Team Alpha', 'Team Beta', 'Tourist', 'Petr', 'Benq', 'Errichto'];

type Mode = 'single' | 'group';
type ProblemRow = { platform: string; contestCode: string; problemIndex: string; title: string; url: string; tags: string };

function buildProblemUrl(platform: string, contestCode: string, problemIndex: string, url: string) {
  if (url.trim()) return url.trim();
  const p = platform.toLowerCase();
  if (p.includes('codeforces') && contestCode && problemIndex) return `https://codeforces.com/problemset/problem/${contestCode}/${problemIndex}`;
  if (p.includes('leetcode') && contestCode) return `https://leetcode.com/problems/${contestCode}`;
  if (p.includes('atcoder') && contestCode && problemIndex) return `https://atcoder.jp/contests/${contestCode}/tasks/${contestCode}_${problemIndex.toLowerCase()}`;
  if (p.includes('codechef') && contestCode) return `https://www.codechef.com/problems/${contestCode}`;
  return url.trim();
}

export default function CreateContestPage() {
  const { data: session, status } = useSession();
  const ownerName = session?.user?.name || session?.user?.email || '';
  const [mode, setMode] = useState<Mode>('group');
  const [title, setTitle] = useState('DivineCode Mashup Round');
  const [duration, setDuration] = useState(120);
  const [members, setMembers] = useState<string[]>(['']);
  const [suggestions, setSuggestions] = useState<string[]>(fallbackSuggestions);
  const [problems, setProblems] = useState<ProblemRow[]>([{ platform: 'Codeforces', contestCode: '', problemIndex: 'A', title: '', url: '', tags: 'implementation' }]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/members/suggestions`).then((res) => res.json()).then((data) => Array.isArray(data) && setSuggestions(data)).catch(() => setSuggestions(fallbackSuggestions));
  }, []);

  const cleanMemberCount = useMemo(() => (mode === 'single' ? 1 : members.map((m) => m.trim()).filter(Boolean).length + (ownerName ? 1 : 0)), [members, mode, ownerName]);
  function memberSuggestions(value: string) { const q = value.trim().toLowerCase(); return suggestions.filter((name) => !q || name.toLowerCase().includes(q)).slice(0, 6); }
  function addMember() { setMembers([...members, '']); }
  function updateMember(index: number, value: string) { const next = [...members]; next[index] = value; setMembers(next); }
  function addProblem() { const nextIndex = String.fromCharCode(65 + problems.length); setProblems([...problems, { platform: 'Codeforces', contestCode: '', problemIndex: nextIndex, title: '', url: '', tags: 'implementation' }]); }
  function updateProblem(index: number, field: keyof ProblemRow, value: string) { const next = [...problems]; next[index] = { ...next[index], [field]: value }; setProblems(next); }

  async function createContest() {
    if (!ownerName) return alert('Sign in first. Mashups must be created from your account.');
    const cleanedMembers = mode === 'single' ? [ownerName] : [ownerName, ...members.map((m) => m.trim()).filter(Boolean)];
    const contestProblems = problems.map((problem, index) => ({ title: problem.title.trim() || `${problem.platform} ${problem.contestCode}${problem.problemIndex}`, platform: problem.platform, contestCode: problem.contestCode, problemIndex: problem.problemIndex, url: buildProblemUrl(problem.platform, problem.contestCode, problem.problemIndex, problem.url), difficulty: problem.problemIndex, tags: problem.tags || `gym,${problem.platform.toLowerCase()}`, index: index + 1 })).filter((problem) => problem.url);
    const res = await fetch(`${API_BASE_URL}/api/contests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description: `${mode === 'single' ? 'Single-player' : 'Group'} mashup created by ${ownerName}`, durationMinutes: duration, members: cleanedMembers, problems: contestProblems }) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Could not create contest');
    window.location.href = `/contests/${data.id}`;
  }

  if (status === 'loading') return <main style={page}><h1>Checking account...</h1></main>;
  if (!session) return <main style={page}><section style={gate}><h1>Sign in required</h1><p style={{ color: '#a8b3c7' }}>Create mashups from your account. Group and single participation both need a logged-in owner.</p><a href="/signin" style={primaryLink}>Sign in with Google</a></section></main>;

  return (
    <main style={page}>
      <section style={{ maxWidth: 1160, margin: '0 auto' }}>
        <a href="/" style={topLink}>← DivineCode Home</a>
        <div style={hero}><div><p style={eyebrow}>Mashup builder</p><h1 style={{ fontSize: 52, margin: 0, letterSpacing: '-.06em' }}>Create a real contest room.</h1><p style={{ color: '#a8b3c7' }}>Choose single or group mode. Your logged-in account is the owner; standings update from submissions.</p></div><div style={ownerCard}><span>Owner</span><strong>{ownerName}</strong></div></div>
        <div style={shell}>
          <div style={modeGrid}>
            <button onClick={() => setMode('single')} style={mode === 'single' ? activeMode : modeBtn}><strong>Solo Practice</strong><span>Only your logged-in account participates.</span></button>
            <button onClick={() => setMode('group')} style={mode === 'group' ? activeMode : modeBtn}><strong>Group Mashup</strong><span>Your account owns the room; invite handles separately.</span></button>
          </div>
          <label>Contest Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <label>Duration in minutes</label><input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 180 }} />
          <h2>Participants <span style={{ color: '#67e8f9' }}>({cleanMemberCount})</span></h2>
          <div style={lockedOwner}>Logged-in owner: <strong>{ownerName}</strong></div>
          {mode === 'group' && <>{members.map((member, index) => <div key={index}><input list={`member-suggestions-${index}`} value={member} onChange={(e) => updateMember(index, e.target.value)} placeholder="Invite teammate handle / name" style={inputStyle} /><datalist id={`member-suggestions-${index}`}>{memberSuggestions(member).map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist></div>)}<button onClick={addMember} style={ghostBtn}>+ Invite participant</button></>}
          {mode === 'single' && <p style={{ color: '#94a3b8' }}>Single mode uses only your logged-in account. No extra participant inputs are shown.</p>}
          <h2 style={{ marginTop: 28 }}>Problems</h2>
          <div style={{ display: 'grid', gap: 14 }}>{problems.map((problem, index) => <div key={index} style={problemCard}><strong style={{ color: '#67e8f9' }}>#{String.fromCharCode(65 + index)}</strong><input value={problem.platform} onChange={(e) => updateProblem(index, 'platform', e.target.value)} placeholder="Codeforces" style={smallInput} /><input value={problem.contestCode} onChange={(e) => updateProblem(index, 'contestCode', e.target.value)} placeholder="1805 / two-sum" style={smallInput} /><input value={problem.problemIndex} onChange={(e) => updateProblem(index, 'problemIndex', e.target.value)} placeholder="A" style={smallInput} /><input value={problem.title} onChange={(e) => updateProblem(index, 'title', e.target.value)} placeholder="Title" style={smallInput} /><input value={problem.tags} onChange={(e) => updateProblem(index, 'tags', e.target.value)} placeholder="tags" style={smallInput} /><input value={problem.url} onChange={(e) => updateProblem(index, 'url', e.target.value)} placeholder="Optional direct URL" style={{ ...smallInput, gridColumn: '2 / -1' }} /></div>)}</div>
          <button onClick={addProblem} style={{ ...ghostBtn, marginTop: 14 }}>+ Add problem</button>
          <div style={{ marginTop: 28 }}><button onClick={createContest} style={primaryBtn}>Create {mode === 'single' ? 'Solo Practice' : 'Group Mashup'}</button></div>
        </div>
      </section>
    </main>
  );
}
const page = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.35), transparent 36rem), radial-gradient(circle at bottom right, rgba(34,211,238,.18), transparent 30rem), #070a16' };
const gate = { maxWidth: 620, margin: '15vh auto', padding: 34, borderRadius: 28, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const topLink = { color: '#67e8f9', textDecoration: 'none', fontWeight: 900 };
const primaryLink = { display: 'inline-block', padding: '12px 17px', borderRadius: 999, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', textDecoration: 'none', fontWeight: 900 };
const hero = { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 18, flexWrap: 'wrap' as const, margin: '24px 0' };
const eyebrow = { color: '#67e8f9', fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' as const };
const ownerCard = { padding: 18, borderRadius: 22, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.22)', display: 'grid', gap: 6 };
const shell = { padding: 28, borderRadius: 30, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 28px 90px rgba(0,0,0,.34)' };
const modeGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 22 };
const modeBtn = { padding: 18, borderRadius: 22, border: '1px solid rgba(148,163,184,.24)', background: 'rgba(2,6,23,.45)', color: '#e2e8f0', textAlign: 'left' as const, display: 'grid', gap: 8, cursor: 'pointer' };
const activeMode = { ...modeBtn, border: '1px solid rgba(34,211,238,.75)', background: 'rgba(34,211,238,.12)' };
const lockedOwner = { padding: 14, borderRadius: 16, background: 'rgba(34,211,238,.1)', border: '1px solid rgba(34,211,238,.25)', marginBottom: 14 };
const inputStyle = { width: '100%', padding: 13, margin: '8px 0 16px', border: '1px solid rgba(148,163,184,.25)', borderRadius: 14, background: 'rgba(2,6,23,.55)', color: '#eef2ff', outline: 'none' };
const smallInput = { width: '100%', padding: 11, border: '1px solid rgba(148,163,184,.25)', borderRadius: 12, background: 'rgba(15,23,42,.8)', color: '#eef2ff', outline: 'none' };
const problemCard = { padding: 16, borderRadius: 20, background: 'rgba(2,6,23,.5)', border: '1px solid rgba(148,163,184,.16)', display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: 10 };
const ghostBtn = { padding: '11px 15px', borderRadius: 999, border: '1px solid rgba(148,163,184,.28)', background: 'rgba(15,23,42,.72)', color: '#dbeafe', cursor: 'pointer' };
const primaryBtn = { padding: '14px 20px', borderRadius: 999, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 900, cursor: 'pointer' };
