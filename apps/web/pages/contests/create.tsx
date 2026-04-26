import { useEffect, useState } from 'react';

type ProblemRow = {
  platform: string;
  contestCode: string;
  problemIndex: string;
  title: string;
  url: string;
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
  const [problems, setProblems] = useState<ProblemRow[]>([
    { platform: 'Codeforces', contestCode: '', problemIndex: 'A', title: '', url: '' }
  ]);

  useEffect(() => {
    const raw = localStorage.getItem('divinecode_user');
    if (raw) setCreator(JSON.parse(raw));
  }, []);

  function addMember() {
    setMembers([...members, '']);
  }

  function updateMember(index: number, value: string) {
    const next = [...members];
    next[index] = value;
    setMembers(next);
  }

  function addProblem() {
    const nextIndex = String.fromCharCode(65 + problems.length);
    setProblems([...problems, { platform: 'Codeforces', contestCode: '', problemIndex: nextIndex, title: '', url: '' }]);
  }

  function updateProblem(index: number, field: keyof ProblemRow, value: string) {
    const next = [...problems];
    next[index] = { ...next[index], [field]: value };
    setProblems(next);
  }

  async function createContest() {
    const cleanedMembers = members.map((m) => m.trim()).filter(Boolean);
    if (creator?.name && !cleanedMembers.includes(creator.name)) cleanedMembers.unshift(creator.name);

    const contestProblems = problems
      .map((problem, index) => ({
        title: problem.title.trim() || `${problem.platform} ${problem.contestCode}${problem.problemIndex}`,
        platform: problem.platform,
        url: buildProblemUrl(problem.platform, problem.contestCode, problem.problemIndex, problem.url),
        difficulty: problem.problemIndex,
        tags: `gym,${problem.platform.toLowerCase()}`,
        index: index + 1
      }))
      .filter((problem) => problem.url);

    const res = await fetch('http://localhost:4000/api/contests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        durationMinutes: duration,
        members: cleanedMembers,
        problems: contestProblems
      })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Could not create contest');
    window.location.href = `/contests/${data.id}`;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f7fb', padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Create Gym Contest</h1>
            <p style={{ color: '#555' }}>Add problems using platform + contest/problem code, or paste a direct URL.</p>
          </div>
          <a href="/signin">{creator ? `Signed in as ${creator.handle}` : 'Sign in'}</a>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          <label>Contest Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: 12, margin: '8px 0 16px', border: '1px solid #ddd', borderRadius: 8 }} />

          <label>Duration in minutes</label>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ width: 160, padding: 12, margin: '8px 0 16px', border: '1px solid #ddd', borderRadius: 8 }} />

          <h2>Participants</h2>
          <p style={{ color: '#666' }}>No hard member limit. Add all teammates here; later they can join through invite link.</p>
          {members.map((member, index) => (
            <input key={index} value={member} onChange={(e) => updateMember(index, e.target.value)} placeholder="Participant name / handle" style={{ display: 'block', width: '100%', padding: 10, marginBottom: 8, border: '1px solid #ddd', borderRadius: 8 }} />
          ))}
          <button onClick={addMember} style={{ padding: '8px 12px', marginBottom: 24 }}>+ Add participant</button>

          <h2>Problems</h2>
          <p style={{ color: '#666' }}>Example: Codeforces + 1805 + A creates a Codeforces problem link automatically.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eef2ff' }}>
                  <th style={{ padding: 8 }}>#</th>
                  <th style={{ padding: 8 }}>Platform</th>
                  <th style={{ padding: 8 }}>Contest / Slug</th>
                  <th style={{ padding: 8 }}>Problem Index</th>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Direct URL</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem, index) => (
                  <tr key={index}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{String.fromCharCode(65 + index)}</td>
                    <td style={{ padding: 8 }}><input value={problem.platform} onChange={(e) => updateProblem(index, 'platform', e.target.value)} /></td>
                    <td style={{ padding: 8 }}><input value={problem.contestCode} onChange={(e) => updateProblem(index, 'contestCode', e.target.value)} placeholder="1805 or two-sum" /></td>
                    <td style={{ padding: 8 }}><input value={problem.problemIndex} onChange={(e) => updateProblem(index, 'problemIndex', e.target.value)} placeholder="A" /></td>
                    <td style={{ padding: 8 }}><input value={problem.title} onChange={(e) => updateProblem(index, 'title', e.target.value)} placeholder="Optional" /></td>
                    <td style={{ padding: 8 }}><input value={problem.url} onChange={(e) => updateProblem(index, 'url', e.target.value)} placeholder="Optional direct link" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addProblem} style={{ padding: '8px 12px', marginTop: 12 }}>+ Add problem</button>

          <div style={{ marginTop: 24 }}>
            <button onClick={createContest} style={{ padding: '12px 18px', background: '#2563eb', color: 'white', border: 0, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              Create Gym Contest
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
