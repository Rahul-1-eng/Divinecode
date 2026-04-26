import { useState } from 'react';

export default function CreateContestPage() {
  const [title, setTitle] = useState('');
  const [members, setMembers] = useState('');
  const [problems, setProblems] = useState('');
  const [duration, setDuration] = useState(120);

  async function createContest() {
    const memberList = members.split(',').map((m) => m.trim());

    const problemList = problems.split('\n').map((line) => {
      const [title, url, platform] = line.split('|');
      return {
        title: title?.trim(),
        url: url?.trim(),
        platform: platform?.trim() || 'External'
      };
    });

    const res = await fetch('http://localhost:4000/api/contests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        durationMinutes: duration,
        members: memberList,
        problems: problemList
      })
    });

    const data = await res.json();

    window.location.href = `/contests/${data.id}`;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Create Gym Contest</h1>

      <div>
        <p>Contest Title</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <p>Members (comma separated)</p>
        <input value={members} onChange={(e) => setMembers(e.target.value)} />
      </div>

      <div>
        <p>Problems (one per line)</p>
        <p>Format: title | url | platform</p>
        <textarea rows={6} value={problems} onChange={(e) => setProblems(e.target.value)} />
      </div>

      <div>
        <p>Duration (minutes)</p>
        <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
      </div>

      <button onClick={createContest} style={{ marginTop: '1rem' }}>
        Create Contest
      </button>
    </main>
  );
}
