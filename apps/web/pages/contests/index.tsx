import { useEffect, useState } from 'react';

export default function ContestsPage() {
  const [contests, setContests] = useState<any[]>([]);

  async function loadContests() {
    const res = await fetch('http://localhost:4000/api/contests');
    const data = await res.json();
    setContests(data);
  }

  useEffect(() => {
    loadContests();
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>DivineCode Gym Contests</h1>
      <p>Create Codeforces Gym-style group contests using problems from any platform.</p>
      <a href="/contests/create">
        <button style={{ padding: '10px 16px', cursor: 'pointer' }}>Create Gym Contest</button>
      </a>

      <section style={{ marginTop: '2rem' }}>
        <h2>Available Contests</h2>
        {contests.length === 0 && <p>No contests yet. Create your first one.</p>}
        {contests.map((contest) => (
          <div key={contest.id} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem' }}>
            <h3>{contest.title}</h3>
            <p>{contest.description}</p>
            <p>Members: {contest.membersCount} | Problems: {contest.problemsCount} | Duration: {contest.durationMinutes} min</p>
            <a href={`/contests/${contest.id}`}>Open Contest Room</a>
          </div>
        ))}
      </section>
    </main>
  );
}
