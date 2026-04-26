import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const fallbackSuggestions = ['Rahul', 'Code Warrior', 'Team Alpha', 'Team Beta', 'Tourist', 'Petr', 'Benq', 'Errichto'];

type ProblemRow = {
  platform: string;
  contestCode: string;
  problemIndex: string;
  title: string;
  url: string;
  tags: string;
};

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
  const [creator, setCreator] = useState<any>(null);
  const [title, setTitle] = useState('DivineCode Gym Round');
  const [duration, setDuration] = useState(120);
  const [members, setMembers] = useState<string[]>(['']);
  const [suggestions, setSuggestions] = useState<string[]>(fallbackSuggestions);
  const [problems, setProblems] = useState<ProblemRow[]>([
    { platform: 'Codeforces', contestCode: '', problemIndex: 'A', title: '', url: '', tags: 'implementation' }
  ]);

  useEffect(() => {
    const raw = localStorage.getItem('divinecode_user');
    if (raw) setCreator(JSON.parse(raw));
    fetch(`${API_BASE_URL}/api/members/suggestions`).then((res) => res.json()).then((data) => Array.isArray(data) && setSuggestions(data)).catch(() => setSuggestions(fallbackSuggestions));
  }, []);

  const cleanMemberCount = useMemo(() => members.map((m) => m.trim()).filter(Boolean).length, [members]);

  function memberSuggestions(value: string) {
    const q = value.trim().toLowerCase();
    return suggestions.filter((name) => !q || name.toLowerCase().includes(q)).slice(0, 6);
  }
  function addMember() { setMembers([...members, '']); }
  function updateMember(index: number, value: string) { const next = [...members]; next[index] = value; setMembers(next); }
  function addProblem() { const nextIndex = String.fromCharCode(65 + problems.length); setProblems([...problems, { platform: 'Codeforces', contestCode: '', problemIndex: nextIndex, title: '', url: '', tags: 'implementation' }]); }
  function updateProblem(index: number, field: keyof ProblemRow, value: string) { const next = [...problems]; next[index] = { ...next[index], [field]: value }; setProblems(next); }

  async function createContest() {
    const cleanedMembers = members.map((m) => m.trim()).filter(Boolean);
    if (creator?.name && !cleanedMembers.includes(creator.name)) cleanedMembers.unshift(creator.name);
    const contestProblems = problems.map((problem, index) => ({
      title: problem.title.trim() || `${problem.platform} ${problem.contestCode}${problem.problemIndex}`,
      platform: problem.platform,
      contestCode: problem.contestCode,
      problemIndex: problem.problemIndex,
      url: buildProblemUrl(problem.platform, problem.contestCode, problem.problemIndex, problem.url),
      difficulty: problem.problemIndex,
      tags: problem.tags || `gym,${problem.platform.toLowerCase()}`,
      index: index + 1
    })).filter((problem) => problem.url);
    const res = await fetch(`${API_BASE_URL}/api/contests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, durationMinutes: duration, members: cleanedMembers, problems: contestProblems }) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Could not create contest');
    window.location.href = `/contests/${data.id}`;
  }

  return (
    <main style={{ minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.35), transparent 36rem), #070a16' }}>
      <section style={{ maxWidth: 1120, margin: '0 auto' }}>
        <a href="/" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 800 }}>← DivineCode Home</a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 18, flexWrap: 'wrap', margin: '24px 0' }}>
          <div><p style={{ color: '#67e8f9', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Group Contest Builder</p><h1 style={{ fontSize: 48, margin: 0, letterSpacing: '-.05em' }}>Create a battle room</h1><p style={{ color: '#a8b3c7' }}>Members get suggestions, problems generate links, and MCQs are created automatically.</p></div>
          <a href="/signin" style={{ color: '#dbeafe' }}>{creator ? `Signed in as ${creator.handle}` : 'Sign in'}</a>
        </div>
        <div style={{ padding: 28, borderRadius: 28, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', boxShadow: '0 28px 90px rgba(0,0,0,.34)' }}>
          <label>Contest Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <label>Duration in minutes</label><input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 180 }} />
          <h2>Participants <span style={{ color: '#67e8f9' }}>({cleanMemberCount})</span></h2>
          {members.map((member, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <input list={`member-suggestions-${index}`} value={member} onChange={(e) => updateMember(index, e.target.value)} placeholder="Participant name / handle" style={inputStyle} />
              <datalist id={`member-suggestions-${index}`}>{memberSuggestions(member).map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>
            </div>
          ))}
          <button onClick={addMember} style={ghostBtn}>+ Add participant</button>
          <h2 style={{ marginTop: 28 }}>Problems</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {problems.map((problem, index) => (
              <div key={index} style={{ padding: 16, borderRadius: 20, background: 'rgba(2,6,23,.5)', border: '1px solid rgba(148,163,184,.16)', display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: 10 }}>
                <strong style={{ color: '#67e8f9' }}>#{String.fromCharCode(65 + index)}</strong>
                <input value={problem.platform} onChange={(e) => updateProblem(index, 'platform', e.target.value)} placeholder="Codeforces" style={smallInput} />
                <input value={problem.contestCode} onChange={(e) => updateProblem(index, 'contestCode', e.target.value)} placeholder="1805 / two-sum" style={smallInput} />
                <input value={problem.problemIndex} onChange={(e) => updateProblem(index, 'problemIndex', e.target.value)} placeholder="A" style={smallInput} />
                <input value={problem.title} onChange={(e) => updateProblem(index, 'title', e.target.value)} placeholder="Title" style={smallInput} />
                <input value={problem.tags} onChange={(e) => updateProblem(index, 'tags', e.target.value)} placeholder="tags" style={smallInput} />
                <input value={problem.url} onChange={(e) => updateProblem(index, 'url', e.target.value)} placeholder="Optional direct URL" style={{ ...smallInput, gridColumn: '2 / -1' }} />
              </div>
            ))}
          </div>
          <button onClick={addProblem} style={{ ...ghostBtn, marginTop: 14 }}>+ Add problem</button>
          <div style={{ marginTop: 28 }}><button onClick={createContest} style={primaryBtn}>Create Group Contest</button></div>
        </div>
      </section>
    </main>
  );
}
const inputStyle = { width: '100%', padding: 13, margin: '8px 0 16px', border: '1px solid rgba(148,163,184,.25)', borderRadius: 14, background: 'rgba(2,6,23,.55)', color: '#eef2ff', outline: 'none' };
const smallInput = { width: '100%', padding: 11, border: '1px solid rgba(148,163,184,.25)', borderRadius: 12, background: 'rgba(15,23,42,.8)', color: '#eef2ff', outline: 'none' };
const ghostBtn = { padding: '11px 15px', borderRadius: 999, border: '1px solid rgba(148,163,184,.28)', background: 'rgba(15,23,42,.72)', color: '#dbeafe', cursor: 'pointer' };
const primaryBtn = { padding: '14px 20px', borderRadius: 999, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 900, cursor: 'pointer' };
