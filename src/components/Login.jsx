// src/components/Login.jsx
import { useState } from 'react';
import { login, register } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login({ setUser }) {
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isReg) {
        const res = await register(form);
        if (res.ok) setMsg("Richiesta inviata! Se sei AdMiN puoi già loggarti.");
      } else {
        const res = await login(form);
        if (res.ok) {
          setUser(res.user);
          navigate('/');
        } else { setMsg(res.error || "Errore Login"); }
      }
    } catch (err) { setMsg("Errore del server"); }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '3px solid #000', borderRadius: '15px', textAlign: 'center' }}>
      <h2>{isReg ? 'Registrazione' : 'Accesso'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input placeholder="Username" onChange={e => setForm({...form, username: e.target.value})} required style={{ padding: '10px' }} />
        <input type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} required style={{ padding: '10px' }} />
        <button type="submit" style={{ padding: '12px', background: '#000', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            {isReg ? 'REGISTRATI' : 'ENTRA'}
        </button>
      </form>
      {msg && <p style={{ color: 'red' }}>{msg}</p>}
      <p onClick={() => setIsReg(!isReg)} style={{ cursor: 'pointer', textDecoration: 'underline', marginTop: '20px' }}>
        {isReg ? 'Vai al Login' : 'Non hai un account? Registrati'}
      </p>
    </div>
  );
}
