// src/components/OccasioniList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOccasioni, createOccasione, updateOccasione, deleteOccasione } from '../services/api';

// Funzione helper per convertire URL in Base64 (gestisce il CORS via proxy)
const getBase64FromUrl = async (url) => {
  if (!url || !url.startsWith('http')) return url;
  try {
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
    const response = await fetch(proxyUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Errore conversione Base64:", error);
    return url; // Se fallisce, restituiamo l'URL originale
  }
};

export default function OccasioniList({ user }) {
  const [occasioni, setOccasioni] = useState([]);
  const [newT, setNewT] = useState('');
  const [newU, setNewU] = useState('');
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false); // Stato per il caricamento
  
  const [editId, setEditId] = useState(null);
  const [editT, setEditT] = useState('');
  const [editU, setEditU] = useState('');

  const canEdit = user && (user.role === 'admin' || user.role === 'editor');

  useEffect(() => { load(); }, []);
  const load = async () => setOccasioni(await getOccasioni());

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Conversione automatica prima del salvataggio
    const finalImageUrl = await getBase64FromUrl(newU);
    await createOccasione({ titolo: newT, imageUrl: finalImageUrl });
    setNewT(''); setNewU(''); 
    setLoading(false);
    load();
  };

  const handleUpdate = async (id) => {
    setLoading(true);
    // Conversione automatica prima della modifica
    const finalImageUrl = await getBase64FromUrl(editU);
    await updateOccasione(id, { titolo: editT, imageUrl: finalImageUrl });
    setEditId(null); setMenu(null); 
    setLoading(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm("ATTENZIONE! Eliminando questa occasione cancellerai tutto il suo contenuto. Vuoi procedere?")) {
      await deleteOccasione(id);
      load();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>⛪ ARCHIVIO OCCASIONI</h1>

      {loading && <div style={{textAlign:'center', color:'blue', fontWeight:'bold'}}>Elaborazione immagine...</div>}

      {canEdit && (
        <div style={{ maxWidth: '500px', margin: '0 auto 30px', padding: '15px', border: '3px solid #000', borderRadius: '15px', backgroundColor: '#f9f9f9', boxShadow: '5px 5px 0px #000' }}>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>Nuova Occasione</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input placeholder="Titolo" value={newT} onChange={e => setNewT(e.target.value)} required style={{ padding: '10px' }} />
            <input placeholder="URL Immagine (verrà convertita in automatico)" value={newU} onChange={e => setNewU(e.target.value)} style={{ padding: '10px' }} />
            <button type="submit" disabled={loading} style={{ background: '#000', color: '#fff', padding: '12px', cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'CARICAMENTO...' : 'AGGIUNGI'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {occasioni.map(o => (
          <div key={o._id} style={{ position: 'relative' }}>
            <div style={{
              height: '180px', borderRadius: '20px', border: '3px solid #000', boxShadow: '7px 7px 0px #000',
              backgroundImage: `url(${o.imageUrl || 'https://via.placeholder.com/400x200?text=Senza+Immagine'})`, 
              backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden'
            }}>
              <div style={{ height: '100%', backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                {editId === o._id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
                    <input value={editT} onChange={e => setEditT(e.target.value)} style={{ textAlign: 'center' }} />
                    <input value={editU} onChange={e => setEditU(e.target.value)} placeholder="URL Immagine" style={{ textAlign: 'center' }} />
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleUpdate(o._id)} disabled={loading} style={{ flex: 1, background: '#28a745', color: '#fff' }}>
                         {loading ? '...' : 'Salva'}
                      </button>
                      <button onClick={() => setEditId(null)} style={{ flex: 1, background: '#ff4444', color: '#fff' }}>X</button>
                    </div>
                  </div>
                ) : (
                  <Link to={`/occasione/${o._id}`} style={{ textDecoration: 'none', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <h2 style={{ color: '#fff', textAlign: 'center', textShadow: '2px 2px 8px #000' }}>{o.titolo}</h2>
                  </Link>
                )}
              </div>
            </div>

            {canEdit && (
              <button onClick={() => setMenu(menu === o._id ? null : o._id)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#fff', border: '2px solid #000', borderRadius: '8px', width: '35px', height: '35px', cursor: 'pointer' }}>☰</button>
            )}
            
            {menu === o._id && canEdit && (
              <div style={{ position: 'absolute', top: '55px', right: '15px', zIndex: 10, background: '#fff', border: '2px solid #000', borderRadius: '10px', width: '140px' }}>
                <button onClick={() => { setEditId(o._id); setEditT(o.titolo); setEditU(o.imageUrl); setMenu(null); }} style={{ width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>✏️ Modifica</button>
                <button onClick={() => handleDelete(o._id)} style={{ width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: 'red' }}>🗑️ Elimina</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
