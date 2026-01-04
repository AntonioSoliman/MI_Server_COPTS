// src/components/PreghiereList.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// Aggiunto updatePreghiera all'import
import { getPreghiere, createPreghiera, updatePreghiera, deletePreghiera, getOccasioneSingola } from '../services/api';

export default function PreghiereList({ user }) {
  const { occasioneId } = useParams();
  const [preghiere, setPreghiere] = useState([]);
  const [occasione, setOccasione] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newNome, setNewNome] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState('');

  // Controllo permessi
  const canEdit = user && (user.role === 'admin' || user.role === 'editor');

  useEffect(() => {
    loadData();
  }, [occasioneId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lista, info] = await Promise.all([
        getPreghiere(occasioneId),
        getOccasioneSingola(occasioneId)
      ]);
      setPreghiere(lista || []);
      setOccasione(info);
    } catch (err) {
      console.error('Errore caricamento preghiere:', err);
      setError('Impossibile caricare le preghiere. Controlla il backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newNome.trim()) return alert('Inserisci un nome per la preghiera/inno');
    try {
      // Usiamo 'titolo' o 'nome' in base a come risponde il tuo backend, 
      // qui tengo 'nome' come da tuo schema
      await createPreghiera({ occasioneId, nome: newNome, titolo: newNome });
      setNewNome('');
      loadData();
    } catch (err) {
      alert('Errore aggiunta: ' + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editNome.trim()) return alert('Inserisci un nome valido');
    try {
      await updatePreghiera(editingId, { nome: editNome, titolo: editNome });
      setEditingId(null);
      loadData();
    } catch (err) {
      alert('Errore modifica: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa preghiera/inno?")) return;
    try {
      await deletePreghiera(id);
      loadData();
    } catch (err) {
      alert('Errore eliminazione: ' + err.message);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', color: '#666', fontSize: '1.2em' }}>Caricamento preghiere...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center', fontSize: '1.2em' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      {/* Briciole sicure */}
      <nav style={{ marginBottom: '20px', color: '#000000ff', fontSize: '0.9em' }}>
        <Link to="/archivio" style={{ color: '#666', fontWeight: 'regular', textDecoration: 'none' }}>Archivio</Link>
        {' > '}
        <strong>{occasione?.titolo || occasione?.nome || 'Occasione'}</strong>
      </nav>

      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>
        {occasione?.titolo || occasione?.nome || 'Preghiere/Inni'}
      </h1>

      {/* Form aggiunta - Protetto */}
      {canEdit && (
        <div style={{ maxWidth: '500px', margin: '0 auto 40px', textAlign: 'center' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px' }}>
            <input 
              placeholder="Nome Preghiera / Inno (es. Trisagion)" 
              value={newNome} 
              onChange={e => setNewNome(e.target.value)} 
              required 
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #000' }}
            />
            <button type="submit" style={{ background: '#28a745', color: '#fff', border: '2px solid #000', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              + AGGIUNGI
            </button>
          </form>
        </div>
      )}

      {/* Griglia rettangoli */}
      {preghiere.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
          Nessuna preghiera/inno ancora aggiunta.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {preghiere.map(p => (
            <div key={p._id} style={{ position: 'relative' }}>
              <Link 
                to={`/preghiera/${p._id}`} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '120px',
                  backgroundColor: '#fff',
                  border: '3px solid #000',
                  borderRadius: '15px',
                  boxShadow: '6px 6px 0px #000',
                  textDecoration: 'none',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  textAlign: 'center',
                  padding: '15px',
                  transition: 'transform 0.1s'
                }}
              >
                {p.titolo || p.nome}
              </Link>

              {/* Pulsanti modifica/elimina - Protetti */}
              {canEdit && (
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={() => { setEditingId(p._id); setEditNome(p.titolo || p.nome); }} 
                    style={{ background: '#ffc107', color: '#000', border: '2px solid #000', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(p._id)} 
                    style={{ background: '#ff4444', color: '#fff', border: '2px solid #000', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Form modifica inline */}
              {editingId === p._id && canEdit && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #000', borderRadius: '8px', padding: '10px', marginTop: '10px', zIndex: 10 }}>
                  <form onSubmit={handleUpdate}>
                    <input 
                      value={editNome} 
                      onChange={e => setEditNome(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" style={{ flex: 1, background: '#007bff', color: 'white', border: 'none', padding: '8px' }}>Salva</button>
                      <button type="button" onClick={() => setEditingId(null)} style={{ flex: 1, background: '#6c757d', color: 'white', border: 'none', padding: '8px' }}>Annulla</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
