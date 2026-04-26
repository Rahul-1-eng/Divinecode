import { CSSProperties, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

export async function getServerSideProps() { return { props: {} }; }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type Mode = 'single' | 'group';
type MemberRow = { name: string; codeforcesHandle: string };
type ProblemRow = { platform: string; code: string; contestCode: string; problemIndex: string; title: string; url: string; tags: string; rating?: number; difficulty?: string };

function cleanHandle(value: string) { return value.trim().replace(/^@/, ''); }

export default function CreateContestPage() {
  const { data: session, status } = useSession();
  const ownerName = session?.user?.name || session?.user?.email || '';
  const [ownerCfHandle, setOwnerCfHandle] = useState('');
  const [mode, setMode] = useState<Mode>('group');
  const [title, setTitle] = useState('DivineCode Mashup Round');
  const [duration, setDuration] = useState(120);
  const [members, setMembers] = useState<MemberRow[]>([{ name: '', codeforcesHandle: '' }]);
  const [problems, setProblems] = useState<ProblemRow[]>([{ platform: 'Codeforces', code: '', contestCode: '', problemIndex: '', title: '', url: '', tags: 'implementation' }]);
  const [lookupState, setLookupState] = useState<Record<number, string>>({});

  const cleanMemberCount = useMemo(() => mode === 'single' ? 1 : members.filter((m) => m.name.trim() || m.codeforcesHandle.trim()).length + 1, [members, mode]);
  function addMember() { setMembers([...members, { name: '', codeforcesHandle: '' }]); }
  function updateMember(index: number, field: keyof MemberRow, value: string) { const next = [...members]; next[index] = { ...next[index], [field]: value }; setMembers(next); }
  function addProblem() { setProblems([...problems, { platform: 'Codeforces', code: '', contestCode: '', problemIndex: '', title: '', url: '', tags: 'implementation' }]); }
  function updateProblem(index: number, field: keyof ProblemRow, value: string) { const next = [...problems]; next[index] = { ...next[index], [field]: value }; setProblems(next); }
  async function lookupProblem(index: number) {
    const p = problems[index];
    if (!p.code.trim()) return alert('Enter problem code like 1805A or two-sum');
    setLookupState({ ...lookupState, [index]: 'Loading...' });
    const res = await fetch(`${API_BASE_URL}/api/problems/lookup?platform=${encodeURIComponent(p.platform)}&code=${encodeURIComponent(p.code)}`);
    const data = await res.json();
    if (!res.ok) { setLookupState({ ...lookupState, [index]: data.error || 'Lookup failed' }); return; }
    const next = [...problems];
    next[index] = { ...next[index], contestCode: data.contestCode || '', problemIndex: data.problemIndex || '', title: data.title, url: data.url, rating: data.rating, difficulty: data.difficulty, tags: (data.tags || []).join(',') || next[index].tags };
    setProblems(next);
    setLookupState({ ...lookupState, [index]: `Loaded ${data.title}` });
  }

  async function createContest() {
    if (!ownerName) return alert('Sign in first.');
    const ownerHandle = cleanHandle(ownerCfHandle);
    const hasCfProblems = problems.some((p) => p.platform.toLowerCase().includes('codeforces'));
    if (hasCfProblems && !ownerHandle) return alert('Enter your Codeforces handle for the owner. Your Google name is not a Codeforces handle.');
    const owner = { name: ownerName, codeforcesHandle: ownerHandle || ownerName };
    const cleanedMembers = mode === 'single' ? [owner] : [owner, ...members.filter((m) => m.name.trim() || m.codeforcesHandle.trim()).map((m) => ({ name: m.name.trim() || cleanHandle(m.codeforcesHandle), codeforcesHandle: cleanHandle(m.codeforcesHandle) || m.name.trim() }))];
    const invalid = hasCfProblems ? cleanedMembers.find((m) => !m.codeforcesHandle || m.codeforcesHandle.includes(' ')) : null;
    if (invalid) return alert(`Invalid Codeforces handle for ${invalid.name}. Use the exact CF handle, without spaces.`);
    const contestProblems = problems.map((p) => ({ title: p.title, platform: p.platform, contestCode: p.contestCode, problemIndex: p.problemIndex, url: p.url, rating: p.rating, difficulty: p.difficulty, tags: p.tags })).filter((p) => p.url);
    const res = await fetch(`${API_BASE_URL}/api/contests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description: `${mode === 'single' ? 'Single-player' : 'Group'} mashup created by ${ownerName}`, durationMinutes: duration, members: cleanedMembers, problems: contestProblems }) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Could not create contest');
    window.location.href = `/contests/${data.id}`;
  }

  if (status === 'loading') return <main style={page}><h1>Checking account...</h1></main>;
  if (!session) return <main style={page}><section style={gate}><h1>Sign in required</h1><p style={{ color: '#a8b3c7' }}>Create mashups from your account.</p><a href="/signin" style={primaryLink}>Sign in with Google</a></section></main>;

  return <main style={page}><section style={{ maxWidth: 1180, margin: '0 auto' }}><a href="/" style={topLink}>← DivineCode Home</a><div style={hero}><div><p style={eyebrow}>Smart mashup builder</p><h1 style={{ fontSize: 52, margin: 0, letterSpacing: '-.06em' }}>Create a verified contest room.</h1><p style={{ color: '#a8b3c7' }}>Type Codeforces codes like 1805A. Enter exact Codeforces handles; your Google name is only your display name.</p></div><div style={ownerCard}><span>Signed in as</span><strong>{ownerName}</strong></div></div><div style={shell}><div style={modeGrid}><button onClick={() => setMode('single')} style={mode === 'single' ? activeMode : modeBtn}><strong>Solo Practice</strong><span>Only your logged-in account participates.</span></button><button onClick={() => setMode('group')} style={mode === 'group' ? activeMode : modeBtn}><strong>Group Mashup</strong><span>Add participant handles for Codeforces sync.</span></button></div><label>Contest Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} /><label>Duration in minutes</label><input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 180 }} /><h2>Participants <span style={{ color: '#67e8f9' }}>({cleanMemberCount})</span></h2><div style={lockedOwner}><strong>Owner display:</strong> {ownerName}<input value={ownerCfHandle} onChange={(e) => setOwnerCfHandle(e.target.value)} placeholder="Your exact Codeforces handle, e.g. RKS_Rider" style={{ ...smallInput, marginTop: 10 }} /></div>{mode === 'group' && <>{members.map((m, i) => <div key={i} style={memberRow}><input value={m.name} onChange={(e) => updateMember(i, 'name', e.target.value)} placeholder="Display name" style={smallInput} /><input value={m.codeforcesHandle} onChange={(e) => updateMember(i, 'codeforcesHandle', e.target.value)} placeholder="Exact Codeforces handle" style={smallInput} /></div>)}<button onClick={addMember} style={ghostBtn}>+ Invite participant</button></>}<h2 style={{ marginTop: 28 }}>Problems</h2><div style={{ display: 'grid', gap: 14 }}>{problems.map((p, i) => <div key={i} style={problemCard}><strong style={{ color: '#67e8f9' }}>#{String.fromCharCode(65 + i)}</strong><select value={p.platform} onChange={(e) => updateProblem(i, 'platform', e.target.value)} style={smallInput}><option>Codeforces</option><option>LeetCode</option><option>AtCoder</option><option>CodeChef</option></select><input value={p.code} onChange={(e) => updateProblem(i, 'code', e.target.value)} placeholder="1805A / two-sum" style={smallInput} /><button onClick={() => lookupProblem(i)} style={ghostBtn}>Lookup</button><input value={p.title} onChange={(e) => updateProblem(i, 'title', e.target.value)} placeholder="Title" style={smallInput} /><input value={p.rating || ''} readOnly placeholder="Rating" style={smallInput} /><input value={p.url} onChange={(e) => updateProblem(i, 'url', e.target.value)} placeholder="URL" style={{ ...smallInput, gridColumn: '2 / -1' }} /><small style={{ color: '#94a3b8', gridColumn: '2 / -1' }}>{lookupState[i] || 'Lookup fills title, URL, rating, contest/index.'}</small></div>)}</div><button onClick={addProblem} style={{ ...ghostBtn, marginTop: 14 }}>+ Add problem</button><div style={{ marginTop: 28 }}><button onClick={createContest} style={primaryBtn}>Create {mode === 'single' ? 'Solo Practice' : 'Group Mashup'}</button></div></div></section></main>;
}
const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.35), transparent 36rem), radial-gradient(circle at bottom right, rgba(34,211,238,.18), transparent 30rem), #070a16' };
const gate: CSSProperties = { maxWidth: 620, margin: '15vh auto', padding: 34, borderRadius: 28, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const topLink: CSSProperties = { color: '#67e8f9', textDecoration: 'none', fontWeight: 900 };
const primaryLink: CSSProperties = { display: 'inline-block', padding: '12px 17px', borderRadius: 999, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', textDecoration: 'none', fontWeight: 900 };
const hero: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 18, flexWrap: 'wrap', margin: '24px 0' };
const eyebrow: CSSProperties = { color: '#67e8f9', fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' };
const ownerCard: CSSProperties = { padding: 18, borderRadius: 22, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.22)', display: 'grid', gap: 6 };
const shell: CSSProperties = { padding: 28, borderRadius: 30, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 28px 90px rgba(0,0,0,.34)' };
const modeGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 22 };
const modeBtn: CSSProperties = { padding: 18, borderRadius: 22, border: '1px solid rgba(148,163,184,.24)', background: 'rgba(2,6,23,.45)', color: '#e2e8f0', textAlign: 'left', display: 'grid', gap: 8, cursor: 'pointer' };
const activeMode: CSSProperties = { ...modeBtn, border: '1px solid rgba(34,211,238,.75)', background: 'rgba(34,211,238,.12)' };
const lockedOwner: CSSProperties = { padding: 14, borderRadius: 16, background: 'rgba(34,211,238,.1)', border: '1px solid rgba(34,211,238,.25)', marginBottom: 14 };
const inputStyle: CSSProperties = { width: '100%', padding: 13, margin: '8px 0 16px', border: '1px solid rgba(148,163,184,.25)', borderRadius: 14, background: 'rgba(2,6,23,.55)', color: '#eef2ff', outline: 'none' };
const smallInput: CSSProperties = { width: '100%', padding: 11, border: '1px solid rgba(148,163,184,.25)', borderRadius: 12, background: 'rgba(15,23,42,.8)', color: '#eef2ff', outline: 'none' };
const memberRow: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 };
const problemCard: CSSProperties = { padding: 16, borderRadius: 20, background: 'rgba(2,6,23,.5)', border: '1px solid rgba(148,163,184,.16)', display: 'grid', gridTemplateColumns: '60px 140px 1fr 110px 1fr 110px', gap: 10, alignItems: 'center' };
const ghostBtn: CSSProperties = { padding: '11px 15px', borderRadius: 999, border: '1px solid rgba(148,163,184,.28)', background: 'rgba(15,23,42,.72)', color: '#dbeafe', cursor: 'pointer' };
const primaryBtn: CSSProperties = { padding: '14px 20px', borderRadius: 999, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 900, cursor: 'pointer' };
