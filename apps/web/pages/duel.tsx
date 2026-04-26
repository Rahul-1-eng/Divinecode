import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function DuelPage() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Connect and enter the arena.');
  const [question, setQuestion] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [joined, setJoined] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [time, setTime] = useState(20);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => { setConnected(true); setStatus('Connected. Ready for matchmaking.'); });
    socket.on('disconnect', () => { setConnected(false); setStatus('Disconnected from duel server.'); });
    socket.on('duel:waiting', (data) => setStatus(data.message || 'Waiting for opponent...'));
    socket.on('duel:start', (data) => { setRoomId(data.roomId); setPlayers(data.players); setStatus('Duel started!'); setTime(20); });
    socket.on('duel:state', (state) => { setRoomId(state.roomId); setPlayers(state.players); setQuestion(state.question); setFinished(state.finished); setTime(20); if (!state.finished && state.question) setStatus('Answer before the timer burns out.'); if (state.finished) setStatus('Duel finished.'); });
    socket.on('duel:feedback', (data) => { setFeedback(`${data.playerName} answered ${data.correct ? 'correctly ✅' : 'wrong ❌'} · ${data.concept}`); });
    return () => { socket.disconnect(); };
  }, []);
  useEffect(() => { if (!question || finished) return; const t = setInterval(() => setTime((v) => Math.max(0, v - 1)), 1000); return () => clearInterval(t); }, [question, finished]);
  function joinDuel() { if (!socketRef.current || joined) return; const name = session?.user?.name || session?.user?.email || `Player-${Math.floor(Math.random() * 1000)}`; socketRef.current.emit('duel:join', { name }); setJoined(true); setStatus('Searching for opponent... open another tab/device and join as another player.'); }
  function answer(index: number) { if (!socketRef.current || !roomId || !question) return; socketRef.current.emit('duel:answer', { roomId, questionId: question.id, answerIndex: index }); }
  const leader = [...players].sort((a, b) => b.score - a.score)[0];
  return <main style={page}><nav style={nav}><a href="/" style={brand}>⚔️ DivineCode Duel</a><div style={userPill}>{session?.user?.name || session?.user?.email || 'Guest Player'}</div></nav><section style={arena}><div style={hud}><span style={connected ? online : offline}>{connected ? 'SERVER ONLINE' : 'SERVER OFFLINE'}</span><strong>{status}</strong><span>{roomId || 'Match not started'}</span></div><div style={versus}><div style={scoreGrid}>{players.length ? players.map((p) => <div key={p.id} style={p.id === leader?.id ? leaderCard : playerCard}><span style={{ color: '#94a3b8' }}>{p.id === leader?.id ? 'LEADING' : 'CHALLENGER'}</span><strong style={{ fontSize: 32 }}>{p.name}</strong><b style={{ fontSize: 52 }}>{p.score}</b><small>battle score</small></div>) : [0, 1].map((n) => <div key={n} style={playerCard}><span>Waiting Player {n + 1}</span><strong style={{ fontSize: 52 }}>0</strong><small>battle score</small></div>)}</div><div style={vsBadge}>VS</div></div>{!joined && <button onClick={joinDuel} disabled={!connected} style={joinBtn}>Enter Duel Arena</button>}{feedback && <div style={feedbackBox}>{feedback}</div>}{finished && <section style={questionCard}><h2>Duel Finished</h2><p style={{ color: '#a8b3c7' }}>Winner: <b>{leader?.name || 'No winner'}</b></p><a href="/duel" style={primaryLink}>Start New Duel</a></section>}{!finished && question && <section style={questionCard}><div style={progress}>Question {question.number}/{question.total} · {question.concept}<span style={timer}>{time}s</span></div><div style={bar}><span style={{ ...barFill, width: `${(time / 20) * 100}%` }} /></div><h1>{question.question}</h1><div style={optionGrid}>{question.options.map((opt: string, index: number) => <button key={opt} onClick={() => answer(index)} style={optionBtn}><span style={letter}>{String.fromCharCode(65 + index)}</span>{opt}</button>)}</div></section>}{!question && joined && <section style={questionCard}><h2>Matchmaking...</h2><p style={{ color: '#a8b3c7' }}>Waiting for another player to enter the arena.</p></section>}</section></main>;
}
const page: CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'Inter, Arial, sans-serif', color: '#eef2ff', background: 'radial-gradient(circle at top left, rgba(239,68,68,.22), transparent 32rem), radial-gradient(circle at top right, rgba(34,211,238,.2), transparent 30rem), #070a16' };
const nav: CSSProperties = { maxWidth: 1180, margin: '0 auto 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' };
const brand: CSSProperties = { color: '#fff', textDecoration: 'none', fontWeight: 950, fontSize: 24 };
const userPill: CSSProperties = { padding: '10px 14px', borderRadius: 999, background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.22)' };
const arena: CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: 26, borderRadius: 32, background: 'linear-gradient(180deg,rgba(15,23,42,.9),rgba(2,6,23,.72))', border: '1px solid rgba(148,163,184,.22)', boxShadow: '0 30px 100px rgba(0,0,0,.38)' };
const hud: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: 16, borderRadius: 22, background: 'rgba(2,6,23,.55)' };
const online: CSSProperties = { color: '#22c55e', fontWeight: 900 };
const offline: CSSProperties = { color: '#ef4444', fontWeight: 900 };
const versus: CSSProperties = { position: 'relative', margin: '18px 0' };
const scoreGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 };
const playerCard: CSSProperties = { padding: 24, borderRadius: 26, background: 'rgba(15,23,42,.85)', border: '1px solid rgba(148,163,184,.18)', display: 'grid', gap: 8 };
const leaderCard: CSSProperties = { ...playerCard, border: '1px solid rgba(34,211,238,.8)', background: 'linear-gradient(180deg,rgba(34,211,238,.18),rgba(15,23,42,.86))' };
const vsBadge: CSSProperties = { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 64, height: 64, borderRadius: 999, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#f97316,#22d3ee)', color: '#020617', fontWeight: 950, boxShadow: '0 15px 50px rgba(0,0,0,.4)' };
const joinBtn: CSSProperties = { width: '100%', padding: 16, borderRadius: 18, border: 0, background: 'linear-gradient(135deg,#f97316,#22d3ee)', color: '#020617', fontWeight: 950, cursor: 'pointer', fontSize: 18 };
const feedbackBox: CSSProperties = { marginTop: 16, padding: 15, borderRadius: 18, background: 'rgba(34,211,238,.1)', border: '1px solid rgba(34,211,238,.24)' };
const questionCard: CSSProperties = { marginTop: 18, padding: 26, borderRadius: 28, background: 'rgba(2,6,23,.62)', border: '1px solid rgba(148,163,184,.2)' };
const progress: CSSProperties = { color: '#67e8f9', fontWeight: 900, marginBottom: 12, display: 'flex', justifyContent: 'space-between' };
const timer: CSSProperties = { color: '#fbbf24' };
const bar: CSSProperties = { height: 8, borderRadius: 999, background: 'rgba(148,163,184,.18)', overflow: 'hidden' };
const barFill: CSSProperties = { display: 'block', height: '100%', background: 'linear-gradient(135deg,#f97316,#22d3ee)' };
const optionGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 };
const optionBtn: CSSProperties = { padding: 16, borderRadius: 18, border: '1px solid rgba(148,163,184,.24)', background: 'rgba(15,23,42,.88)', color: '#eef2ff', textAlign: 'left', fontWeight: 800, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' };
const letter: CSSProperties = { width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(34,211,238,.16)', color: '#67e8f9' };
const primaryLink: CSSProperties = { display: 'inline-block', padding: '11px 15px', borderRadius: 999, background: 'linear-gradient(135deg,#a5b4fc,#22d3ee)', color: '#020617', textDecoration: 'none', fontWeight: 900 };
