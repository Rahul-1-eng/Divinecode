import { CSSProperties, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function PracticeProblem() {
  const router = useRouter();
  const { id } = router.query;
  const [problem, setProblem] = useState<any>(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n    return 0;\n}\n');
  const [verdict, setVerdict] = useState<any>(null);

  useEffect(() => { if (!id) return; fetch(`${API_BASE_URL}/api/problems/${id}`).then((r) => r.json()).then(setProblem); }, [id]);
  async function submit() { const res = await fetch(`${API_BASE_URL}/api/practice/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId: id, code, language }) }); const data = await res.json(); setVerdict(data); }
  const monacoLanguage = language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : language === 'java' ? 'java' : language === 'javascript' ? 'javascript' : 'c';
  if (!problem) return <main style={page}><h1>Loading problem...</h1></main>;
  return <main style={page}><section style={layout}><aside style={panel}><a href="/practice" style={link}>← Practice</a><h1>{problem.title}</h1><p>{problem.description}</p><p style={{ color: '#67e8f9' }}>Difficulty: {problem.difficulty} · {(problem.tags || []).join(', ')}</p><div style={sample}><strong>Sample input</strong><pre>{problem.stdin || 'No sample provided'}</pre><strong>Expected output</strong><pre>{problem.expectedOutput || 'No expected output provided'}</pre></div><label>Language</label><select value={language} onChange={(e) => setLanguage(e.target.value)} style={input}><option value="cpp">C++</option><option value="c">C</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JavaScript</option></select><button onClick={submit} style={submitBtn}>Run Code</button>{verdict && <div style={verdictBox}><h2>{verdict.verdict}</h2><p>{verdict.message}</p><pre>{verdict.stdout || verdict.stderr || verdict.compile_output || ''}</pre></div>}</aside><section style={editorPanel}><div style={editorTop}><strong>Monaco Editor</strong><span>{language.toUpperCase()}</span></div><Editor height="72vh" language={monacoLanguage} theme="vs-dark" value={code} onChange={(value) => setCode(value || '')} options={{ minimap: { enabled: false }, fontSize: 15, automaticLayout: true, scrollBeyondLastLine: false }} /></section></section></main>;
}
const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(99,102,241,.28), transparent 34rem), #070a16' };
const layout: CSSProperties = { display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18 };
const panel: CSSProperties = { padding: 24, borderRadius: 26, background: 'rgba(15,23,42,.86)', border: '1px solid rgba(148,163,184,.22)' };
const editorPanel: CSSProperties = { ...panel, padding: 0, overflow: 'hidden' };
const editorTop: CSSProperties = { padding: 16, display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', background: 'rgba(2,6,23,.65)', borderBottom: '1px solid rgba(148,163,184,.16)' };
const link: CSSProperties = { color: '#67e8f9', textDecoration: 'none', fontWeight: 900 };
const sample: CSSProperties = { margin: '16px 0', padding: 16, borderRadius: 18, background: 'rgba(2,6,23,.55)', border: '1px solid rgba(148,163,184,.18)' };
const input: CSSProperties = { width: '100%', padding: 12, marginTop: 8, borderRadius: 14, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(2,6,23,.55)', color: '#eef2ff' };
const submitBtn: CSSProperties = { width: '100%', marginTop: 18, padding: 14, borderRadius: 16, border: 0, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', fontWeight: 950, cursor: 'pointer' };
const verdictBox: CSSProperties = { marginTop: 18, padding: 16, borderRadius: 18, background: 'rgba(34,211,238,.1)', border: '1px solid rgba(34,211,238,.22)' };
