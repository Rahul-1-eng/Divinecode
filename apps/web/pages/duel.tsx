import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function DuelPage() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Click Join Duel to start matchmaking.');
  const [question, setQuestion] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setStatus('Connected to duel server. Click Join Duel.');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setStatus('Disconnected from duel server.');
    });

    socket.on('duel:waiting', (data) => {
      setStatus(data.message || 'Waiting for opponent...');
    });

    socket.on('duel:start', (data) => {
      setRoomId(data.roomId);
      setPlayers(data.players);
      setStatus('Duel started!');
    });

    socket.on('duel:state', (state) => {
      setRoomId(state.roomId);
      setPlayers(state.players);
      setQuestion(state.question);
      setFinished(state.finished);
      if (!state.finished && state.question) setStatus('Answer the question.');
      if (state.finished) setStatus('Duel finished.');
    });

    socket.on('duel:feedback', (data) => {
      setStatus(`${data.playerName} answered ${data.correct ? 'correctly' : 'wrong'} — ${data.concept}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function joinDuel() {
    if (!socketRef.current || joined) return;
    const name = `Player-${Math.floor(Math.random() * 1000)}`;
    socketRef.current.emit('duel:join', { name });
    setJoined(true);
    setStatus('Searching for opponent... open this same page in another tab and click Join Duel there too.');
  }

  function answer(index: number) {
    if (!socketRef.current || !roomId || !question) return;
    socketRef.current.emit('duel:answer', {
      roomId,
      questionId: question.id,
      answerIndex: index
    });
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>DivineCode Live Duel</h1>
      <p>Server: {connected ? 'Connected' : 'Not connected'}</p>
      <p>Status: {status}</p>

      {!joined && (
        <button onClick={joinDuel} disabled={!connected} style={{ padding: '10px 16px', cursor: 'pointer' }}>
          Join Duel
        </button>
      )}

      {players.length > 0 && (
        <section style={{ marginTop: '1rem' }}>
          <h2>Scoreboard</h2>
          {players.map((p) => (
            <p key={p.id}>{p.name}: {p.score}</p>
          ))}
        </section>
      )}

      {finished && (
        <section style={{ marginTop: '1rem' }}>
          <h2>Duel Finished</h2>
        </section>
      )}

      {!finished && question && (
        <section style={{ marginTop: '1rem' }}>
          <p>Question {question.number}/{question.total}</p>
          <h2>{question.question}</h2>
          <p>Concept: {question.concept}</p>
          {question.options.map((opt: string, index: number) => (
            <button
              key={opt}
              onClick={() => answer(index)}
              style={{ display: 'block', margin: '10px 0', padding: '10px 16px', cursor: 'pointer' }}
            >
              {opt}
            </button>
          ))}
        </section>
      )}
    </main>
  );
}
