import { useState, useEffect } from 'react';
import { adminGetPending, adminApproveUser, adminRejectUser, adminLogin, adminLogout } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function PendingApprovals({ user, setUser }) {
  const [adminKey, setAdminKey] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [pending, setPending] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    // Try to load pending users on mount - will succeed if admin cookie present
    load();
  }, [user]);

    const handleLogout = async () => {
      await handleAdminLogout();
      localStorage.removeItem('user');
      if (setUser) setUser(null);
      navigate('/');
    };

  const load = async () => {
      if (!adminAuthenticated) {
      setPending([]);
      return;
    }
      try {
        const list = await adminGetPending();
      if (!Array.isArray(list)) {
        console.warn('adminGetPending returned non-array', list);
        setPending([]);
        return;
      }
      setPending(list);
    } catch (err) {
      console.error('Errore caricamento pending:', err);
      if (err && err.status === 401) {
        // not authenticated -> show login
        setAdminAuthenticated(false);
        setPending([]);
        return;
      }
      setPending([]);
    }
  };

  const approve = async (id) => {
    await adminApproveUser(id);
    load();
  };

  const reject = async (id) => {
    await adminRejectUser(id);
    load();
  };

  const handleAdminLogin = async () => {
    try {
      const res = await adminLogin(adminPassword);
      if (res && res.ok) {
        setAdminPassword('');
        setAdminAuthenticated(true);
        load();
      } else alert('Login admin fallito');
    } catch (err) { console.error(err); alert('Errore login admin'); }
  };

  const handleAdminLogout = async () => {
    try { await adminLogout(); setAdminAuthenticated(false); setPending([]); } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => navigate('/admin')} style={{ padding: '6px 10px' }}>← Indietro</button>
          <button onClick={() => navigate('/')} style={{ padding: '6px 10px' }}>Home</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleLogout} style={{ padding: '6px 10px', background: '#e74c3c', color: '#fff', borderRadius: 6 }}>Logout</button>
        </div>
      </div>

      <h1>Utenti in attesa di approvazione</h1>
      <div style={{ marginBottom: 12 }}>
          <input placeholder="Password admin" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={{ padding: '8px', marginRight: '8px' }} />
          <button onClick={handleAdminLogin} style={{ marginRight: 6 }}>Login Admin (cookie)</button>
          <button onClick={handleAdminLogout} style={{ marginRight: 6 }}>Logout Admin</button>
          <button onClick={load} style={{ marginLeft: 8 }}>Carica In Attesa</button>
      </div>
      {pending.length === 0 && <p>Nessun utente in attesa.</p>}
      {pending.map(u => (
        <div key={u._id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{u.username}</strong>
            <div style={{ fontSize: 12, color: '#666' }}>Ruolo: {u.role} — Stato: {u.status}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => approve(u._id)} style={{ background: '#2ecc71', color: '#fff', padding: '6px 10px', borderRadius: 6 }}>Approva</button>
            <button onClick={() => reject(u._id)} style={{ background: '#e74c3c', color: '#fff', padding: '6px 10px', borderRadius: 6 }}>Rifiuta</button>
          </div>
        </div>
      ))}
    </div>
  );
}
