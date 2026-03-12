// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { getAllUsers, adminLogin, adminLogout } from '../services/api';
import { adminGetAllUsers, adminGetPending, adminApproveUser, adminRejectUser, adminUpdateUser, adminDeleteUser } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel({ user, setUser }) {
  const [users, setUsers] = useState([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (setUser) setUser(null);
    navigate('/');
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return navigate('/');
    // if the logged-in user is admin, consider admin-authenticated for admin API actions
    if (user && user.role === 'admin') setAdminAuthenticated(true);
  }, []);

  const load = async () => {
    if (!adminAuthenticated) return setUsers([]);
    const list = await adminGetAllUsers();
    setUsers(list || []);
  };

  // Do not auto-load; require admin to enter key and click

  const loadPending = async () => {
    if (!adminAuthenticated) return;
    const list = await adminGetPending();
    setUsers(list || []);
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
    try {
      await adminLogout();
      setAdminAuthenticated(false);
      setUsers([]);
    } catch (err) { console.error(err); }
  };

  const handleAction = async (id, data) => {
    await adminUpdateUser(id, data);
    load();
  };

  const handleApprove = async (id) => {
    await adminApproveUser(id);
    loadPending();
  };

  const handleReject = async (id) => {
    await adminRejectUser(id);
    loadPending();
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/')} style={{ padding: '6px 10px' }}>Home</button>
          <button onClick={() => navigate('/admin/pending')} style={{ padding: '6px 10px', background: '#27ae60', color: '#fff' }}>In Attesa</button>
        </div>
        <div>
          <button onClick={handleLogout} style={{ padding: '6px 10px', background: '#e74c3c', color: '#fff' }}>Logout</button>
        </div>
      </div>

      <h1>Gestione Utenti</h1>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Admin key (opzionale)" value={adminKey} onChange={e => setAdminKey(e.target.value)} style={{ padding: '8px' }} />
          <button onClick={load} style={{ marginLeft: '6px' }}>Carica Tutti</button>
          <button onClick={loadPending} style={{ marginLeft: '6px' }}>Carica In Attesa</button>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Password admin" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={{ padding: '8px' }} />
          <button onClick={handleAdminLogin} style={{ marginLeft: '6px' }}>Login Admin (cookie)</button>
          <button onClick={handleAdminLogout} style={{ marginLeft: '6px' }}>Logout Admin</button>
        </div>
      </div>
      {users.map(u => (
        <div key={u._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '8px', display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
          <div>
            <strong>{u.username}</strong> 
            <div style={{ fontSize: '12px', color: '#666' }}>
              Ruolo: <span style={{ fontWeight: 'bold', color: u.role === 'editor' ? 'blue' : 'black' }}>{u.role}</span> | 
              Stato: <span style={{ fontWeight: 'bold', color: u.status === 'active' ? 'green' : 'red' }}>{u.status}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {/* GESTIONE STATO */}
            {u.status === 'pending' ? (
              <>
                <button onClick={() => handleApprove(u._id)} style={{ cursor: 'pointer', background: '#2ecc71', color:'#fff' }}>Approva</button>
                <button onClick={() => handleReject(u._id)} style={{ cursor: 'pointer', background: '#e74c3c', color:'#fff' }}>Rifiuta</button>
              </>
            ) : (
              <button onClick={() => handleAction(u._id, { status: u.status === 'active' ? 'inactive' : 'active' })} style={{ cursor: 'pointer' }}>{u.status === 'active' ? 'Disattiva' : 'Attiva'}</button>
            )}

            {/* GESTIONE RUOLI (MODIFICA DIRITTI) */}
            {u.role !== 'editor' ? (
              <button onClick={() => handleAction(u._id, { role: 'editor' })} style={{ background: '#e3f2fd', cursor: 'pointer' }}>Promuovi Editor</button>
            ) : (
              <button onClick={() => handleAction(u._id, { role: 'user' })} style={{ background: '#fff3e0', cursor: 'pointer' }}>Revoca Editor</button>
            )}

            {/* ELIMINAZIONE */}
            <button onClick={() => { if(window.confirm("Eliminare l'utente?")) adminDeleteUser(u._id).then(load) }} style={{ color: 'red', cursor: 'pointer' }}>Elimina</button>
          </div>
        </div>
      ))}
    </div>
  );
}
