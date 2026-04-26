import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ContestRoomPage() {
  const router = useRouter();
  const { id } = router.query;

  const [contest, setContest] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  async function loadContest() {
    if (!id) return;

    const res = await fetch(`http://localhost:4000/api/contests/${id}`);
    const data = await res.json();

    setContest(data);
    setTimeLeft(data.durationMinutes * 60);
  }

  useEffect(() => {
    loadContest();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!contest) return <p>Loading contest...</p>;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{contest.title}</h1>

      <h2>Invite Link</h2>
      <p>{window.location.href}</p>

      <h2>Timer</h2>
      <p>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>

      <h2>Members</h2>
      {contest.members.map((m: any) => (
        <p key={m.id}>{m.name}</p>
      ))}

      <h2>Problems</h2>
      {contest.problems.map((p: any) => (
        <div key={p.id}>
          <a href={p.url} target="_blank">{p.title} ({p.platform})</a>
        </div>
      ))}

      <h2>Standings</h2>
      {contest.standings.map((s: any) => (
        <p key={s.memberId}>
          {s.name} | Solved: {s.solved} | Penalty: {s.penalty}
        </p>
      ))}
    </main>
  );
}
