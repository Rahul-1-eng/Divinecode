import { useState } from 'react';

export default function SignInPage() {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');

  function signIn() {
    if (!name.trim()) return alert('Enter your name');
    const user = {
      name: name.trim(),
      handle: handle.trim() || name.trim().toLowerCase().replace(/\s+/g, '_')
    };
    localStorage.setItem('divinecode_user', JSON.stringify(user));
    window.location.href = '/contests';
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f7fb', padding: '3rem', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 480, margin: '0 auto', background: 'white', padding: '2rem', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h1>Sign in to DivineCode</h1>
        <p style={{ color: '#555' }}>This is a local MVP sign-in. Real JWT authentication will be added with the database phase.</p>

        <label>Your Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Kumar" style={{ width: '100%', padding: 12, margin: '8px 0 16px', border: '1px solid #ddd', borderRadius: 8 }} />

        <label>Coding Handle</label>
        <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="rahul_cf" style={{ width: '100%', padding: 12, margin: '8px 0 16px', border: '1px solid #ddd', borderRadius: 8 }} />

        <button onClick={signIn} style={{ width: '100%', padding: 12, border: 0, borderRadius: 8, background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          Continue
        </button>
      </section>
    </main>
  );
}
