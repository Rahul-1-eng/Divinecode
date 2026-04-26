import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const mcqQuestions = [
  { id: 1, question: 'What is the output of console.log(0.1 + 0.2 === 0.3)?', options: ['true', 'false', 'undefined', 'error'], correctIndex: 1, concept: 'floating point precision' },
  { id: 2, question: 'Which data structure gives O(1) average lookup?', options: ['Array', 'Stack', 'Hash Set', 'Queue'], correctIndex: 2, concept: 'hashing' },
  { id: 3, question: 'Binary search requires the array to be:', options: ['random', 'sorted', 'empty', 'circular'], correctIndex: 1, concept: 'binary search' }
];

type Player = { id: string; name: string; score: number };
type DuelRoom = { id: string; players: Player[]; questionIndex: number; questions: typeof mcqQuestions; finished: boolean };
type JudgeLanguage = 'cpp' | 'c' | 'java' | 'python' | 'javascript';
type Judge0Result = { stdout?: string | null; stderr?: string | null; compile_output?: string | null; time?: string | number | null; memory?: number | null; status?: { id?: number; description?: string } | null };
type ContestProblem = { id: string; title: string; platform: string; url: string; difficulty?: string; tags: string[] };
type ContestMember = { id: string; name: string; handle?: string };
type Contest = { id: string; title: string; description: string; startTime: string; durationMinutes: number; isRated: boolean; createdAt: string; members: ContestMember[]; problems: ContestProblem[]; standings: { memberId: string; name: string; solved: number; penalty: number; score: number }[] };

const languageMap: Record<JudgeLanguage, number> = { cpp: 54, c: 50, java: 62, python: 71, javascript: 63 };
const waitingPlayers: Player[] = [];
const rooms = new Map<string, DuelRoom>();
const contests = new Map<string, Contest>();

const problems = [
  { id: 1, title: 'Two Sum', difficulty: 800, tags: ['array', 'hash-map'], description: 'Find two indices whose values add up to target.', stdin: '4 9\n2 7 11 15\n', expectedOutput: '0 1' },
  { id: 2, title: 'Binary Search', difficulty: 900, tags: ['binary-search'], description: 'Find the target index in a sorted array.', stdin: '5 7\n1 3 5 7 9\n', expectedOutput: '3' },
  { id: 3, title: 'Reverse Linked List', difficulty: 1200, tags: ['linked-list'], description: 'Reverse a singly linked list. This problem is still mock-only until full testcases are added.', stdin: '', expectedOutput: '' }
];

function id(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function normalizeOutput(value: string | null | undefined) { return (value || '').trim().replace(/\s+/g, ' '); }
function buildStandings(members: ContestMember[]) { return members.map((member, index) => ({ memberId: member.id, name: member.name, solved: 0, penalty: 0, score: 0 - index })); }

app.get('/', (_req, res) => res.json({ status: 'ok', app: 'DivineCode API' }));
app.get('/api/problems', (_req, res) => res.json(problems.map(({ stdin, expectedOutput, ...safeProblem }) => safeProblem)));
app.get('/api/problems/:id', (req, res) => {
  const problem = problems.find((item) => item.id === Number(req.params.id));
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  const { stdin, expectedOutput, ...safeProblem } = problem;
  return res.json(safeProblem);
});

app.get('/api/contests', (_req, res) => res.json([...contests.values()].map((contest) => ({ id: contest.id, title: contest.title, description: contest.description, startTime: contest.startTime, durationMinutes: contest.durationMinutes, isRated: contest.isRated, membersCount: contest.members.length, problemsCount: contest.problems.length, createdAt: contest.createdAt }))));

app.post('/api/contests', (req, res) => {
  const { title, description, startTime, durationMinutes, isRated, members, problems: contestProblems } = req.body;
  if (!title) return res.status(400).json({ error: 'Contest title is required' });
  const safeMembers: ContestMember[] = Array.isArray(members) ? members.filter(Boolean).map((name: string) => ({ id: id('member'), name: String(name).trim() })).filter((m) => m.name) : [];
  const safeProblems: ContestProblem[] = Array.isArray(contestProblems) ? contestProblems.map((p: any) => ({ id: id('problem'), title: String(p.title || 'Untitled Problem'), platform: String(p.platform || 'External'), url: String(p.url || ''), difficulty: p.difficulty ? String(p.difficulty) : undefined, tags: String(p.tags || '').split(',').map((t) => t.trim()).filter(Boolean) })).filter((p) => p.title && p.url) : [];
  const contest: Contest = { id: id('contest'), title: String(title), description: String(description || ''), startTime: startTime || new Date().toISOString(), durationMinutes: Number(durationMinutes || 120), isRated: Boolean(isRated), members: safeMembers, problems: safeProblems, standings: buildStandings(safeMembers), createdAt: new Date().toISOString() };
  contests.set(contest.id, contest);
  return res.status(201).json(contest);
});

app.get('/api/contests/:id', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  return res.json(contest);
});

app.post('/api/contests/:id/members', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  const names: string[] = Array.isArray(req.body.members) ? req.body.members : [req.body.name];
  names.filter(Boolean).forEach((name) => contest.members.push({ id: id('member'), name: String(name).trim() }));
  contest.standings = buildStandings(contest.members);
  return res.json(contest);
});

app.post('/api/contests/:id/problems', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  const problem: ContestProblem = { id: id('problem'), title: String(req.body.title || 'Untitled Problem'), platform: String(req.body.platform || 'External'), url: String(req.body.url || ''), difficulty: req.body.difficulty ? String(req.body.difficulty) : undefined, tags: String(req.body.tags || '').split(',').map((t) => t.trim()).filter(Boolean) };
  if (!problem.url) return res.status(400).json({ error: 'Problem URL is required' });
  contest.problems.push(problem);
  return res.json(contest);
});

app.post('/api/contests/:id/standings/mock', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  contest.standings = contest.members.map((member) => {
    const solved = Math.floor(Math.random() * (contest.problems.length + 1));
    const penalty = solved * (20 + Math.floor(Math.random() * 80));
    return { memberId: member.id, name: member.name, solved, penalty, score: solved * 100 - penalty };
  }).sort((a, b) => b.solved - a.solved || a.penalty - b.penalty);
  return res.json(contest.standings);
});

async function runWithJudge0(params: { sourceCode: string; language: JudgeLanguage; stdin: string; expectedOutput: string }) {
  const judgeUrl = process.env.JUDGE0_URL;
  if (!judgeUrl) return { verdict: 'Mock Accepted', message: 'JUDGE0_URL is not configured. Start Judge0 and set JUDGE0_URL for real judging.', stdout: '', stderr: '', compile_output: '' };
  const createResponse = await fetch(`${judgeUrl}/submissions?base64_encoded=false&wait=true`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_code: params.sourceCode, language_id: languageMap[params.language], stdin: params.stdin, expected_output: params.expectedOutput }) });
  if (!createResponse.ok) return { verdict: 'Judge Error', message: `Judge0 request failed with status ${createResponse.status}`, stdout: '', stderr: '', compile_output: '' };
  const result = (await createResponse.json()) as Judge0Result;
  const statusDescription = result.status?.description || 'Unknown';
  let verdict = statusDescription;
  if (statusDescription === 'Accepted') verdict = normalizeOutput(result.stdout) === normalizeOutput(params.expectedOutput) ? 'Accepted' : 'Wrong Answer';
  return { verdict, message: statusDescription, stdout: result.stdout || '', stderr: result.stderr || '', compile_output: result.compile_output || '', time: result.time || null, memory: result.memory || null };
}

app.post('/api/submit', async (req, res) => {
  try {
    const { code, language, problemId } = req.body;
    if (!code || !language || !problemId) return res.status(400).json({ verdict: 'Rejected', message: 'code, language and problemId are required' });
    if (!languageMap[language as JudgeLanguage]) return res.status(400).json({ verdict: 'Rejected', message: 'Unsupported language' });
    const problem = problems.find((item) => item.id === Number(problemId));
    if (!problem) return res.status(404).json({ verdict: 'Rejected', message: 'Problem not found' });
    const result = await runWithJudge0({ sourceCode: code, language: language as JudgeLanguage, stdin: problem.stdin, expectedOutput: problem.expectedOutput });
    return res.json({ ...result, language, problemId });
  } catch (error) {
    return res.status(500).json({ verdict: 'Server Error', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

function publicQuestion(room: DuelRoom) { const q = room.questions[room.questionIndex]; return { id: q.id, question: q.question, options: q.options, concept: q.concept, number: room.questionIndex + 1, total: room.questions.length }; }
function emitRoom(room: DuelRoom) { io.to(room.id).emit('duel:state', { roomId: room.id, players: room.players, question: room.finished ? null : publicQuestion(room), finished: room.finished, winner: room.finished ? [...room.players].sort((a, b) => b.score - a.score)[0] : null }); }

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('duel:join', (payload: { name?: string }) => {
    const player: Player = { id: socket.id, name: payload?.name || `Player-${socket.id.slice(0, 4)}`, score: 0 };
    if (waitingPlayers.length === 0) { waitingPlayers.push(player); socket.emit('duel:waiting', { message: 'Waiting for another player...' }); return; }
    const opponent = waitingPlayers.shift()!;
    const roomId = `room-${Date.now()}`;
    const room: DuelRoom = { id: roomId, players: [opponent, player], questionIndex: 0, questions: mcqQuestions, finished: false };
    rooms.set(roomId, room); socket.join(roomId); io.sockets.sockets.get(opponent.id)?.join(roomId); io.to(roomId).emit('duel:start', { roomId, players: room.players }); emitRoom(room);
  });
  socket.on('duel:answer', (payload: { roomId: string; questionId: number; answerIndex: number }) => {
    const room = rooms.get(payload.roomId); if (!room || room.finished) return;
    const current = room.questions[room.questionIndex]; const player = room.players.find((item) => item.id === socket.id); if (!player || current.id !== payload.questionId) return;
    const correct = current.correctIndex === payload.answerIndex; player.score += correct ? 10 : -3;
    io.to(room.id).emit('duel:feedback', { playerId: socket.id, playerName: player.name, correct, correctIndex: current.correctIndex, concept: current.concept });
    room.questionIndex += 1; if (room.questionIndex >= room.questions.length) room.finished = true; setTimeout(() => emitRoom(room), 700);
  });
  socket.on('disconnect', () => { const waitingIndex = waitingPlayers.findIndex((p) => p.id === socket.id); if (waitingIndex >= 0) waitingPlayers.splice(waitingIndex, 1); console.log('Socket disconnected:', socket.id); });
});

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => console.log(`DivineCode API and duel socket server running on port ${PORT}`));
