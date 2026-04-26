export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>DivineCode Platform</h1>
      <p>Welcome to DivineCode, your competitive programming and live duel arena.</p>
      <a href="/duel">
        <button style={{ padding: '10px 16px', cursor: 'pointer' }}>Go to Duel Arena</button>
      </a>
    </main>
  );
}
