import { CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function PracticeProblem() {
  const router = useRouter();
  const { id } = router.query;
  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [verdict, setVerdict] = useState<any>(null);

  useEffect(() => { if (!id) return; fetch(`${API_BASE_URL}/api/problems/${id}`).then((r) => r.json()).then(setProblem); }, [id]);

  async function submit() {
    const res = await fetch(`${API_BASE_URL}/api/practice/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId: id, code })
    });
    const data = await res.json();
    setVerdict(data);
  }

  if (!problem) return <main style={page}><h1>Loading problem...</h1></main>;

  return <main style={page}><section style={layout}><aside style={panel}><h1>{problem.title}</h1><p>{problem.description}</p><p style={{ color: '#67e8f9' }}>Difficulty: {problem.difficulty}</p><button onClick={submit} style={submitBtn}>Run Code</button>{verdict && <div style={verdictBox}><h2>{verdict.verdict}</h2><p>{verdict.message}</p></div>}</aside><section style={editorPanel}><textarea value={code} onChange={(e) => setCode(e.target.value)} style={editor} placeholder="Write your solution here..." /></section></section></main>;
}

const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: '#070a16' };
const layout: CSSProperties = { display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18 };
const panel: CSSProperties = { padding: 24, borderRadius: 26, background: 'rgba(15,23,42,.86)', border: '1px solid rgba(148,163,184,.22)' };
const editorPanel: CSSProperties = { ...panel };
const editor: CSSProperties = { width: '100%', minHeight: '70vh', background: '#020617', color: '#e2e8f0', fontFamily: 'JetBrains Mono' };
const submitBtn: CSSProperties = { marginTop: 18, padding: 14, borderRadius: 16, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 950 };
const verdictBox: CSSProperties = { marginTop: 18, padding: 16, borderRadius: 18, background: 'rgba(34,211,238,.1)' };
