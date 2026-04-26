import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

export default function DuelPage() {
  const [question, setQuestion] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    socket.emit('duel:join', { name: 'Player' });

    socket.on('duel:start', (data) => {
      setRoomId(data.roomId);
      setPlayers(data.players);
    });

    socket.on('duel:state', (state) => {
      setPlayers(state.players);
      setQuestion(state.question);
      setFinished(state.finished);
    });

    return () => {
      socket.off('duel:start');
      socket.off('duel:state');
    };
  }, []);

  function answer(index: number) {
    if (!roomId || !question) return;

    socket.emit('duel:answer', {
      roomId,
      questionId: question.id,
      answerIndex: index
    });
  }

  if (finished) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Duel Finished</h2>
        {players.map((p) => (
          <p key={p.id}>{p.name}: {p.score}</p>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Live Duel</h2>

      {question ? (
        <div>
          <p>{question.number}/{question.total}</p>
          <h3>{question.question}</h3>

          {question.options.map((opt: string, i: number) => (
            <button
              key={i}
              onClick={() => answer(i)}
              style={{
                display: 'block',
                margin: '10px',
                padding: '10px'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <p>Waiting for opponent...</p>
      )}
    </div>
  );
}
