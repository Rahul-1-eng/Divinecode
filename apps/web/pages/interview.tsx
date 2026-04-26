import { CSSProperties, useMemo, useState } from 'react';

const questions = [
  { id: 1, rating: 800, topic: 'DBMS', question: 'Which normal form removes partial dependency?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctIndex: 1 },
  { id: 2, rating: 900, topic: 'Networks', question: 'TCP mainly provides what?', options: ['Reliable ordered byte stream', 'Broadcast only', 'No congestion control', 'Unreliable packets'], correctIndex: 0 },
  { id: 3, rating: 1200, topic: 'OS', question: 'Which is a deadlock condition?', options: ['No circular wait', 'Circular wait', 'Always preemption', 'No mutual exclusion'], correctIndex: 1 },
  { id: 4, rating: 1300, topic: 'Algorithms', question: 'Dijkstra fails with:', options: ['Positive edges', 'Zero edges', 'Negative edges', 'Undirected graphs'], correctIndex: 2 },
  { id: 5, rating: 1700, topic: 'System Design', question: 'Consistent hashing helps mostly with:', options: ['Reducing remapping', 'Password hashing only', 'Sorting logs', 'SQL joins'], correctIndex: 0 },
  { id: 6, rating: 2000, topic: 'Concurrency', question: 'CAS is mostly used for:', options: ['Lock-free algorithms', 'CSS styling', 'DNS routing', 'SQL normalization'], correctIndex: 0 }
];

export default function InterviewPage() {
  const [topic, setTopic] = useState('All');
  const [maxRating, setMaxRating] = useState(2200);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const filtered = useMemo(() => questions.filter((q) => (topic === 'All' || q.topic === topic) && q.rating <= maxRating), [topic, maxRating]);
  const score = filtered.filter((q) => answers[q.id] === q.correctIndex).length;
  const topics = ['All', ...Array.from(new Set(questions.map((q) => q.topic)))];
  return <main style={page}><section style={{ maxWidth: 1160, margin: '0 auto' }}><nav style={nav}><a href="/" style={brand}>DivineCode Interview Arena</a><a href="/contests" style={pill}>Contests</a></nav><div style={hero}><p style={eyebrow}>Rated CSE MCQs</p><h1 style={{ fontSize: 58, margin: 0 }}>Interview practice by rating.</h1><p style={{ color: '#a8b3c7' }}>Core CS, DSA, DBMS, OS, CN, System Design and concurrency questions mapped like competitive ratings.</p></div><div style={filters}><select value={topic} onChange={(e) => setTopic(e.target.value)} style={input}>{topics.map((t) => <option key={t}>{t}</option>)}</select><input type="range" min={800} max={2200} step={100} value={maxRating} onChange={(e) => setMaxRating(Number(e.target.value))} /><strong>≤ {maxRating}</strong><span>Score {score}/{filtered.length}</span></div><div style={{ display: 'grid', gap: 16 }}>{filtered.map((q) => <section key={q.id} style={card}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={tag}>{q.topic}</span><span style={rating}>{q.rating}</span></div><h2>{q.question}</h2><div style={optionGrid}>{q.options.map((opt, i) => <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: i })} style={answers[q.id] === i ? selected : option}>{String.fromCharCode(65 + i)}. {opt}</button>)}</div>{answers[q.id] !== undefined && <p style={{ color: answers[q.id] === q.correctIndex ? '#22c55e' : '#f87171' }}>{answers[q.id] === q.correctIndex ? 'Correct' : `Wrong. Correct answer: ${q.options[q.correctIndex]}`}</p>}</section>)}</div></section></main>;
}
const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(34,211,238,.2), transparent 34rem), #070a16' };
const nav: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 };
const brand: CSSProperties = { color: '#eef2ff', textDecoration: 'none', fontWeight: 950, fontSize: 24 };
const pill: CSSProperties = { color: '#dbeafe', textDecoration: 'none', padding: '11px 16px', borderRadius: 999, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(15,23,42,.72)' };
const hero: CSSProperties = { padding: 30, borderRadius: 30, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.82)', marginBottom: 18 };
const eyebrow: CSSProperties = { color: '#67e8f9', fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' };
const filters: CSSProperties = { display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', padding: 18, borderRadius: 22, background: 'rgba(15,23,42,.82)', marginBottom: 18 };
const input: CSSProperties = { padding: 12, borderRadius: 14, background: 'rgba(2,6,23,.55)', color: '#eef2ff', border: '1px solid rgba(148,163,184,.25)' };
const card: CSSProperties = { padding: 22, borderRadius: 24, border: '1px solid rgba(148,163,184,.2)', background: 'rgba(15,23,42,.82)' };
const tag: CSSProperties = { color: '#020617', background: '#67e8f9', padding: '6px 10px', borderRadius: 999, fontWeight: 900 };
const rating: CSSProperties = { color: '#fbbf24', fontWeight: 900 };
const optionGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 };
const option: CSSProperties = { padding: 14, borderRadius: 16, background: 'rgba(2,6,23,.55)', color: '#eef2ff', border: '1px solid rgba(148,163,184,.24)', cursor: 'pointer', textAlign: 'left' };
const selected: CSSProperties = { ...option, border: '1px solid rgba(34,211,238,.8)', background: 'rgba(34,211,238,.12)' };
