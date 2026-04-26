import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const mcqQuestions = [
  {
    id: 1,
    question: 'What is the output of console.log(0.1 + 0.2 === 0.3)?',
    options: ['true', 'false', 'undefined', 'error'],
    correctIndex: 1,
    concept: 'floating point precision'
  },
  {
    id: 2,
    question: 'Which data structure gives O(1) average lookup?',
    options: ['Array', 'Stack', 'Hash Set', 'Queue'],
    correctIndex: 2,
    concept: 'hashing'
  },
  {
    id: 3,
    question: 'Binary search requires the array to be:',
    options: ['random', 'sorted', 'empty', 'circular'],
    correctIndex: 1,
    concept: 'binary search'
  }
];

type Player = {
  id: string;
  name: string;
  score: number;
};

type DuelRoom = {
  id: string;
  players: Player[];
  questionIndex: number;
  questions: typeof mcqQuestions;
  finished: boolean;
};

const waitingPlayers: Player[] = [];
const rooms = new Map<string, DuelRoom>();

const problems = [
  { id: 1, title: 'Two Sum', difficulty: 800, tags: ['array', 'hash-map'], description: 'Find two indices whose values add up to target.' },
  { id: 2, title: 'Binary Search', difficulty: 900, tags: ['binary-search'], description: 'Find the target index in a sorted array.' },
  { id: 3, title: 'Reverse Linked List', difficulty: 1200, tags: ['linked-list'], description: 'Reverse a singly linked list.' }
];

app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'DivineCode API' });
});

app.get('/api/problems', (_req, res) => {
  res.json(problems);
});

app.get('/api/problems/:id', (req, res) => {
  const problem = problems.find((item) => item.id === Number(req.params.id));
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  return res.json(problem);
});

app.post('/api/submit', (req, res) => {
  const { code, language, problemId } = req.body;
  if (!code || !language || !problemId) {
    return res.status(400).json({ verdict: 'Rejected', message: 'code, language and problemId are required' });
  }
  return res.json({ verdict: 'Accepted', message: 'Mock judge verdict. Judge0 will be connected next.', language, problemId });
});

function publicQuestion(room: DuelRoom) {
  const q = room.questions[room.questionIndex];
  return {
    id: q.id,
    question: q.question,
    options: q.options,
    concept: q.concept,
    number: room.questionIndex + 1,
    total: room.questions.length
  };
}

function emitRoom(room: DuelRoom) {
  io.to(room.id).emit('duel:state', {
    roomId: room.id,
    players: room.players,
    question: room.finished ? null : publicQuestion(room),
    finished: room.finished,
    winner: room.finished ? [...room.players].sort((a, b) => b.score - a.score)[0] : null
  });
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('duel:join', (payload: { name?: string }) => {
    const player: Player = {
      id: socket.id,
      name: payload?.name || `Player-${socket.id.slice(0, 4)}`,
      score: 0
    };

    if (waitingPlayers.length === 0) {
      waitingPlayers.push(player);
      socket.emit('duel:waiting', { message: 'Waiting for another player...' });
      return;
    }

    const opponent = waitingPlayers.shift()!;
    const roomId = `room-${Date.now()}`;
    const room: DuelRoom = {
      id: roomId,
      players: [opponent, player],
      questionIndex: 0,
      questions: mcqQuestions,
      finished: false
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    const opponentSocket = io.sockets.sockets.get(opponent.id);
    opponentSocket?.join(roomId);

    io.to(roomId).emit('duel:start', { roomId, players: room.players });
    emitRoom(room);
  });

  socket.on('duel:answer', (payload: { roomId: string; questionId: number; answerIndex: number }) => {
    const room = rooms.get(payload.roomId);
    if (!room || room.finished) return;

    const current = room.questions[room.questionIndex];
    const player = room.players.find((item) => item.id === socket.id);
    if (!player || current.id !== payload.questionId) return;

    const correct = current.correctIndex === payload.answerIndex;
    player.score += correct ? 10 : -3;

    io.to(room.id).emit('duel:feedback', {
      playerId: socket.id,
      playerName: player.name,
      correct,
      correctIndex: current.correctIndex,
      concept: current.concept
    });

    room.questionIndex += 1;
    if (room.questionIndex >= room.questions.length) room.finished = true;

    setTimeout(() => emitRoom(room), 700);
  });

  socket.on('disconnect', () => {
    const waitingIndex = waitingPlayers.findIndex((p) => p.id === socket.id);
    if (waitingIndex >= 0) waitingPlayers.splice(waitingIndex, 1);
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log(`DivineCode API and duel socket server running on port ${PORT}`);
});
