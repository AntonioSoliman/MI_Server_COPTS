// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { getAllUsers, updateUser, deleteUser } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel({ user }) {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') return navigate('/');
    load();
  }, []);

  const load = async () => setUsers(await getAllUsers());

  const handleAction = async (id, data) => {
    await updateUser(id, data);
    load();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestione Utenti</h1>
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
            {u.status === 'pending' || u.status === 'inactive' ? (
              <button onClick={() => handleAction(u._id, { status: 'active' })} style={{ cursor: 'pointer' }}>Attiva</button>
            ) : (
              <button onClick={() => handleAction(u._id, { status: 'inactive' })} style={{ cursor: 'pointer' }}>Disattiva</button>
            )}

            {/* GESTIONE RUOLI (MODIFICA DIRITTI) */}
            {u.role !== 'editor' ? (
              <button onClick={() => handleAction(u._id, { role: 'editor' })} style={{ background: '#e3f2fd', cursor: 'pointer' }}>Promuovi Editor</button>
            ) : (
              <button onClick={() => handleAction(u._id, { role: 'user' })} style={{ background: '#fff3e0', cursor: 'pointer' }}>Revoca Editor</button>
            )}

            {/* ELIMINAZIONE */}
            <button onClick={() => { if(window.confirm("Eliminare l'utente?")) deleteUser(u._id).then(load) }} style={{ color: 'red', cursor: 'pointer' }}>Elimina</button>
          </div>
        </div>
      ))}
    </div>
  );
}
