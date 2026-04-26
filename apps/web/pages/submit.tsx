import { CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export async function getServerSideProps() {
  return { props: {} };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const starter = `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // write your solution here\n    return 0;\n}\n`;

export default function SubmitPage() {
  const router = useRouter();
  const { contestId, problemId } = router.query;
  const { data: session, status } = useSession();
  const [contest, setContest] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(starter);
  const [verdict, setVerdict] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!contestId) return;
    fetch(`${API_BASE_URL}/api/contests/${contestId}`).then((r) => r.json()).then((data) => {
      setContest(data);
      setProblem(data.problems?.find((p: any) => p.id === problemId));
    }).catch(() => null);
  }, [contestId, problemId]);

  async function submitCode() {
    if (!session?.user?.email) return alert('Sign in first');
    if (!contest || !problem) return alert('Contest problem not loaded');
    setSubmitting(true);
    setVerdict(null);
    const member = contest.members?.find((m: any) => m.name === session.user?.name || m.name === session.user?.email) || contest.members?.[0];
    const res = await fetch(`${API_BASE_URL}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, contestId, problemId, userId: session.user.email, memberId: member?.id })
    });
    const data = await res.json();
    setSubmitting(false);
    setVerdict(data);
  }

  if (status === 'loading') return <main style={page}>Checking account...</main>;
  if (!session) return <main style={page}><section style={panel}><h1>Sign in required</h1><p style={{ color: '#94a3b8' }}>You need an account before submitting code.</p><a href="/signin" style={primaryLink}>Sign in</a></section></main>;

  return (
    <main style={page}>
      <nav style={nav}><a href={contestId ? `/contests/${contestId}` : '/contests'} style={brand}>← Back to contest</a><div style={userPill}>{session.user?.name || session.user?.email}</div></nav>
      <section style={layout}>
        <aside style={panel}>
          <p style={eyebrow}>Submit solution</p>
          <h1>{problem?.title || 'Loading problem...'}</h1>
          <p style={{ color: '#94a3b8' }}>{problem?.platform} · Rating {problem?.rating || problem?.difficulty || 'Practice'} · {(problem?.tags || []).join(', ')}</p>
          {problem?.url && <a href={problem.url} target="_blank" rel="noreferrer" style={primaryLink}>Open original problem</a>}
          <div style={{ marginTop: 22 }}><label>Language</label><select value={language} onChange={(e) => setLanguage(e.target.value)} style={input}><option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JavaScript</option><option value="c">C</option></select></div>
          <button onClick={submitCode} disabled={submitting} style={submitBtn}>{submitting ? 'Judging...' : 'Submit to DivineCode Judge'}</button>
          {verdict && <div style={verdictBox}><h2>{verdict.verdict}</h2><p>{verdict.message}</p>{verdict.standings && <a href={`/contests/${contestId}`} style={primaryLink}>View updated standings</a>}</div>}
        </aside>
        <section style={editorPanel}>
          <div style={editorTop}><strong>Code editor</strong><span>External mashup + Judge0-ready</span></div>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} style={editor} />
        </section>
      </section>
    </main>
  );
}
const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.35), transparent 34rem), #070a16' };
const nav: CSSProperties = { maxWidth: 1320, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 };
const brand: CSSProperties = { color: '#67e8f9', textDecoration: 'none', fontWeight: 900 };
const userPill: CSSProperties = { padding: '10px 14px', borderRadius: 999, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.22)' };
const layout: CSSProperties = { maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18 };
const panel: CSSProperties = { padding: 24, borderRadius: 26, background: 'rgba(15,23,42,.86)', border: '1px solid rgba(148,163,184,.22)', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const editorPanel: CSSProperties = { ...panel, padding: 0, overflow: 'hidden' };
const editorTop: CSSProperties = { padding: 16, display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', background: 'rgba(2,6,23,.65)', borderBottom: '1px solid rgba(148,163,184,.16)' };
const editor: CSSProperties = { width: '100%', minHeight: '72vh', padding: 20, border: 0, outline: 0, resize: 'vertical', background: '#020617', color: '#e2e8f0', fontSize: 15, lineHeight: 1.65, fontFamily: 'JetBrains Mono, Consolas, monospace' };
const eyebrow: CSSProperties = { color: '#67e8f9', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' };
const input: CSSProperties = { width: '100%', padding: 12, marginTop: 8, borderRadius: 14, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(2,6,23,.55)', color: '#eef2ff' };
const submitBtn: CSSProperties = { width: '100%', marginTop: 18, padding: 14, borderRadius: 16, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 950, cursor: 'pointer' };
const primaryLink: CSSProperties = { display: 'inline-block', padding: '11px 15px', borderRadius: 999, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', textDecoration: 'none', fontWeight: 900 };
const verdictBox: CSSProperties = { marginTop: 18, padding: 16, borderRadius: 18, background: 'rgba(34,211,238,.1)', border: '1px solid rgba(34,211,238,.22)' };
