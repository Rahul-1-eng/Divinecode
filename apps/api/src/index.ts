import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
app.use(cors({ origin: CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(',').map((origin) => origin.trim()) }));
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(',').map((origin) => origin.trim()), methods: ['GET', 'POST'] } });

type McqQuestion = { id: number; question: string; options: string[]; correctIndex: number; concept: string };
type Player = { id: string; name: string; score: number };
type DuelRoom = { id: string; players: Player[]; questionIndex: number; questions: McqQuestion[]; finished: boolean };
type JudgeLanguage = 'cpp' | 'c' | 'java' | 'python' | 'javascript';
type Judge0Result = { stdout?: string | null; stderr?: string | null; compile_output?: string | null; time?: string | number | null; memory?: number | null; status?: { id?: number; description?: string } | null };
type ContestProblem = { id: string; title: string; platform: string; url: string; difficulty?: string; tags: string[]; stdin?: string; expectedOutput?: string };
type ContestMember = { id: string; name: string; handle?: string; team?: string };
type ContestSolve = { memberId: string; problemId: string; solvedAtMinute: number; attempts: number };
type StandingRow = { memberId: string; name: string; solved: number; penalty: number; score: number; solvedProblems: string[] };
type Contest = { id: string; title: string; description: string; startTime: string; durationMinutes: number; isRated: boolean; createdAt: string; members: ContestMember[]; problems: ContestProblem[]; solves: ContestSolve[]; standings: StandingRow[]; questions: McqQuestion[] };

const languageMap: Record<JudgeLanguage, number> = { cpp: 54, c: 50, java: 62, python: 71, javascript: 63 };
const waitingPlayers: Player[] = [];
const rooms = new Map<string, DuelRoom>();
const contests = new Map<string, Contest>();

const problems = [
  { id: 1, title: 'Two Sum', difficulty: 800, tags: ['array', 'hash-map'], description: 'Find two indices whose values add up to target.', stdin: '4 9\n2 7 11 15\n', expectedOutput: '0 1' },
  { id: 2, title: 'Binary Search', difficulty: 900, tags: ['binary-search'], description: 'Find the target index in a sorted array.', stdin: '5 7\n1 3 5 7 9\n', expectedOutput: '3' },
  { id: 3, title: 'Reverse Linked List', difficulty: 1200, tags: ['linked-list'], description: 'Reverse a singly linked list.', stdin: '', expectedOutput: '' }
];

function id(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function normalizeOutput(value: string | null | undefined) { return (value || '').trim().replace(/\s+/g, ' '); }
function getContestMinute(contest: Contest) { return Math.max(1, Math.floor((Date.now() - new Date(contest.startTime).getTime()) / 60000)); }
function slugHandle(name: string) { return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `member_${Math.random().toString(36).slice(2, 6)}`; }
function uniqueByName(names: string[]) { return [...new Set(names.map((name) => String(name || '').trim()).filter(Boolean))]; }
function buildProblemUrl(platform: string, contestCode: string, problemIndex: string, url: string) {
  if (url?.trim()) return url.trim();
  const p = platform.toLowerCase();
  if (p.includes('codeforces') && contestCode && problemIndex) return `https://codeforces.com/problemset/problem/${contestCode}/${problemIndex}`;
  if (p.includes('leetcode') && contestCode) return `https://leetcode.com/problems/${contestCode}`;
  if (p.includes('atcoder') && contestCode && problemIndex) return `https://atcoder.jp/contests/${contestCode}/tasks/${contestCode}_${problemIndex.toLowerCase()}`;
  if (p.includes('codechef') && contestCode) return `https://www.codechef.com/problems/${contestCode}`;
  return '';
}
function generateMcqsFromProblems(contestProblems: ContestProblem[]): McqQuestion[] {
  const source = contestProblems.length ? contestProblems : problems.map((p) => ({ id: String(p.id), title: p.title, platform: 'DivineCode', url: `/problems/${p.id}`, difficulty: String(p.difficulty), tags: p.tags }));
  const difficulties = ['800', '1000', '1200', '1500'];
  return source.flatMap((problem, index) => {
    const mainTag = problem.tags[0] || 'implementation';
    const platformOptions = ['Codeforces', 'LeetCode', 'AtCoder', 'CodeChef'].filter((p) => p !== problem.platform).slice(0, 3);
    return [
      { id: index * 3 + 1, question: `Which platform is selected for “${problem.title}”?`, options: [problem.platform, ...platformOptions].slice(0, 4), correctIndex: 0, concept: 'platform recognition' },
      { id: index * 3 + 2, question: `Which topic best matches “${problem.title}”?`, options: [mainTag, 'graph', 'geometry', 'database'].slice(0, 4), correctIndex: 0, concept: mainTag },
      { id: index * 3 + 3, question: `What difficulty label is attached to “${problem.title}”?`, options: [problem.difficulty || 'Practice', ...difficulties.filter((d) => d !== problem.difficulty)].slice(0, 4), correctIndex: 0, concept: 'difficulty reading' }
    ];
  }).slice(0, 12).map((q, idx) => ({ ...q, id: idx + 1 }));
}
function rebuildStandings(contest: Contest) {
  contest.standings = contest.members.map((member) => {
    const memberSolves = contest.solves.filter((solve) => solve.memberId === member.id);
    const solvedProblems = memberSolves.map((solve) => solve.problemId);
    const penalty = memberSolves.reduce((sum, solve) => sum + solve.solvedAtMinute + Math.max(0, solve.attempts - 1) * 20, 0);
    return { memberId: member.id, name: member.name, solved: memberSolves.length, penalty, score: memberSolves.length * 1000 - penalty, solvedProblems };
  }).sort((a, b) => b.solved - a.solved || a.penalty - b.penalty || a.name.localeCompare(b.name));
}
function recordSolve(contest: Contest, memberId: string, problemId: string) {
  const existing = contest.solves.find((s) => s.memberId === memberId && s.problemId === problemId);
  if (existing) return existing;
  const solve = { memberId, problemId, solvedAtMinute: getContestMinute(contest), attempts: 1 };
  contest.solves.push(solve);
  rebuildStandings(contest);
  return solve;
}
function serializeContestList(contest: Contest) {
  return { id: contest.id, title: contest.title, description: contest.description, startTime: contest.startTime, durationMinutes: contest.durationMinutes, isRated: contest.isRated, membersCount: contest.members.length, problemsCount: contest.problems.length, questionCount: contest.questions.length, createdAt: contest.createdAt };
}

app.get('/', (_req, res) => res.json({ status: 'ok', app: 'DivineCode API' }));
app.get('/api/problems', (_req, res) => res.json(problems.map(({ stdin, expectedOutput, ...safeProblem }) => safeProblem)));
app.get('/api/problems/:id', (req, res) => {
  const problem = problems.find((item) => item.id === Number(req.params.id));
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  const { stdin, expectedOutput, ...safeProblem } = problem;
  return res.json(safeProblem);
});
app.get('/api/members/suggestions', (_req, res) => {
  const existing = [...contests.values()].flatMap((contest) => contest.members.map((member) => member.name));
  res.json(uniqueByName([...existing, 'Rahul', 'Code Warrior', 'Team Alpha', 'Team Beta', 'Tourist', 'Petr', 'Benq', 'Errichto']));
});
app.get('/api/contests', (_req, res) => res.json([...contests.values()].map(serializeContestList)));
app.post('/api/contests', (req, res) => {
  const { title, description, startTime, durationMinutes, isRated, members, problems: contestProblems } = req.body;
  if (!String(title || '').trim()) return res.status(400).json({ error: 'Contest title is required' });
  const safeMembers: ContestMember[] = uniqueByName(Array.isArray(members) ? members : []).map((name) => ({ id: id('member'), name, handle: slugHandle(name) }));
  const safeProblems: ContestProblem[] = Array.isArray(contestProblems) ? contestProblems.map((p: any) => {
    const platform = String(p.platform || 'External');
    const contestCode = String(p.contestCode || '');
    const problemIndex = String(p.problemIndex || '');
    const url = buildProblemUrl(platform, contestCode, problemIndex, String(p.url || ''));
    return { id: id('problem'), title: String(p.title || `${platform} ${contestCode}${problemIndex}`).trim(), platform, url, difficulty: p.difficulty ? String(p.difficulty) : problemIndex || undefined, tags: String(p.tags || platform).split(',').map((t) => t.trim()).filter(Boolean), stdin: String(p.stdin || ''), expectedOutput: String(p.expectedOutput || '') };
  }).filter((p) => p.title && p.url) : [];
  if (safeMembers.length === 0) return res.status(400).json({ error: 'Add at least one contest member' });
  if (safeProblems.length === 0) return res.status(400).json({ error: 'Add at least one valid problem with a platform code or URL' });
  const contest: Contest = { id: id('contest'), title: String(title).trim(), description: String(description || 'Private group contest room'), startTime: startTime || new Date().toISOString(), durationMinutes: Math.max(1, Number(durationMinutes || 120)), isRated: Boolean(isRated), members: safeMembers, problems: safeProblems, solves: [], standings: [], questions: generateMcqsFromProblems(safeProblems), createdAt: new Date().toISOString() };
  rebuildStandings(contest);
  contests.set(contest.id, contest);
  return res.status(201).json(contest);
});
app.get('/api/contests/:id', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  rebuildStandings(contest);
  return res.json(contest);
});
app.post('/api/contests/:id/members', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  uniqueByName(Array.isArray(req.body.members) ? req.body.members : [req.body.name]).forEach((name) => {
    if (!contest.members.some((member) => member.name.toLowerCase() === name.toLowerCase())) contest.members.push({ id: id('member'), name, handle: slugHandle(name) });
  });
  rebuildStandings(contest);
  return res.json(contest);
});
app.post('/api/contests/:id/problems', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  const platform = String(req.body.platform || 'External');
  const problem: ContestProblem = { id: id('problem'), title: String(req.body.title || 'Untitled Problem'), platform, url: buildProblemUrl(platform, String(req.body.contestCode || ''), String(req.body.problemIndex || ''), String(req.body.url || '')), difficulty: req.body.difficulty ? String(req.body.difficulty) : undefined, tags: String(req.body.tags || platform).split(',').map((t) => t.trim()).filter(Boolean), stdin: String(req.body.stdin || ''), expectedOutput: String(req.body.expectedOutput || '') };
  if (!problem.url) return res.status(400).json({ error: 'Problem URL is required' });
  contest.problems.push(problem);
  contest.questions = generateMcqsFromProblems(contest.problems);
  rebuildStandings(contest);
  return res.json(contest);
});
app.post('/api/contests/:id/solve', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  const { memberId, problemId } = req.body;
  const member = contest.members.find((m) => m.id === memberId);
  const problem = contest.problems.find((p) => p.id === problemId);
  if (!member || !problem) return res.status(400).json({ error: 'Invalid member or problem' });
  recordSolve(contest, memberId, problemId);
  return res.json(contest);
});
app.post('/api/contests/:id/unsolve', (req, res) => {
  const contest = contests.get(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  const { memberId, problemId } = req.body;
  contest.solves = contest.solves.filter((s) => !(s.memberId === memberId && s.problemId === problemId));
  rebuildStandings(contest);
  return res.json(contest);
});

async function runWithJudge0(params: { sourceCode: string; language: JudgeLanguage; stdin: string; expectedOutput: string }) {
  const judgeUrl = process.env.JUDGE0_URL;
  if (!params.expectedOutput) return { verdict: 'Accepted', message: 'No sample output configured, accepted as external-platform submission.', stdout: '', stderr: '', compile_output: '' };
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
    const { code, language, problemId, contestId, memberId } = req.body;
    if (!code || !language || !problemId) return res.status(400).json({ verdict: 'Rejected', message: 'code, language and problemId are required' });
    if (!languageMap[language as JudgeLanguage]) return res.status(400).json({ verdict: 'Rejected', message: 'Unsupported language' });
    let stdin = '';
    let expectedOutput = '';
    let contest: Contest | undefined;
    if (contestId) {
      contest = contests.get(String(contestId));
      if (!contest) return res.status(404).json({ verdict: 'Rejected', message: 'Contest not found' });
      const contestProblem = contest.problems.find((item) => item.id === String(problemId));
      if (!contestProblem) return res.status(404).json({ verdict: 'Rejected', message: 'Contest problem not found' });
      stdin = contestProblem.stdin || '';
      expectedOutput = contestProblem.expectedOutput || '';
    } else {
      const problem = problems.find((item) => item.id === Number(problemId));
      if (!problem) return res.status(404).json({ verdict: 'Rejected', message: 'Problem not found' });
      stdin = problem.stdin;
      expectedOutput = problem.expectedOutput;
    }
    const result = await runWithJudge0({ sourceCode: code, language: language as JudgeLanguage, stdin, expectedOutput });
    if ((result.verdict === 'Accepted' || result.verdict === 'Mock Accepted') && contest && memberId) recordSolve(contest, String(memberId), String(problemId));
    return res.json({ ...result, language, problemId, contestId: contest?.id, standings: contest?.standings || null });
  } catch (error) {
    return res.status(500).json({ verdict: 'Server Error', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});
function publicQuestion(room: DuelRoom) { const q = room.questions[room.questionIndex]; return { id: q.id, question: q.question, options: q.options, concept: q.concept, number: room.questionIndex + 1, total: room.questions.length }; }
function emitRoom(room: DuelRoom) { io.to(room.id).emit('duel:state', { roomId: room.id, players: room.players, question: room.finished ? null : publicQuestion(room), finished: room.finished, winner: room.finished ? [...room.players].sort((a, b) => b.score - a.score)[0] : null }); }
io.on('connection', (socket) => {
  socket.on('duel:join', (payload: { name?: string }) => {
    const player: Player = { id: socket.id, name: payload?.name || `Player-${socket.id.slice(0, 4)}`, score: 0 };
    if (waitingPlayers.length === 0) { waitingPlayers.push(player); socket.emit('duel:waiting', { message: 'Waiting for another player...' }); return; }
    const opponent = waitingPlayers.shift()!;
    const roomId = `room-${Date.now()}`;
    const seedContest = [...contests.values()].at(-1);
    const room: DuelRoom = { id: roomId, players: [opponent, player], questionIndex: 0, questions: seedContest?.questions?.length ? seedContest.questions : generateMcqsFromProblems([]), finished: false };
    rooms.set(roomId, room); socket.join(roomId); io.sockets.sockets.get(opponent.id)?.join(roomId); io.to(roomId).emit('duel:start', { roomId, players: room.players }); emitRoom(room);
  });
  socket.on('duel:answer', (payload: { roomId: string; questionId: number; answerIndex: number }) => {
    const room = rooms.get(payload.roomId); if (!room || room.finished) return;
    const current = room.questions[room.questionIndex]; const player = room.players.find((item) => item.id === socket.id); if (!player || current.id !== payload.questionId) return;
    const correct = current.correctIndex === payload.answerIndex; player.score += correct ? 10 : -3;
    io.to(room.id).emit('duel:feedback', { playerId: socket.id, playerName: player.name, correct, correctIndex: current.correctIndex, concept: current.concept });
    room.questionIndex += 1; if (room.questionIndex >= room.questions.length) room.finished = true; setTimeout(() => emitRoom(room), 700);
  });
  socket.on('disconnect', () => { const waitingIndex = waitingPlayers.findIndex((p) => p.id === socket.id); if (waitingIndex >= 0) waitingPlayers.splice(waitingIndex, 1); });
});
const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => console.log(`DivineCode API and duel socket server running on port ${PORT}`));
