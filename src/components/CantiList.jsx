// src/components/CantiList.jsx (simile a PreghiereList, adattato)
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCanti, createCanto, updateCanto, deleteCanto, getPreghieraSingola, riordinaCanti } from '../services/api';

export default function CantiList({ user }) {
  const { preghieraId } = useParams();
  const [canti, setCanti] = useState([]);
  const [preghiera, setPreghiera] = useState(null);
  const [newIt, setNewIt] = useState('');
  const [newAra, setNewAra] = useState('');
  
  // Stati per la modifica
  const [editId, setEditId] = useState(null);
  const [editIt, setEditIt] = useState('');
  const [editAra, setEditAra] = useState('');

  const canEdit = user && (user.role === 'admin' || user.role === 'editor');

  useEffect(() => { load(); }, [preghieraId]);

  const load = async () => {
    const [lista, info] = await Promise.all([
      getCanti(preghieraId),
      getPreghieraSingola(preghieraId)
    ]);
    const ordinati = (lista || []).sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
    setCanti(ordinati);
    setPreghiera(info);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await createCanto({ preghieraId, titoloIt: newIt, titoloAra: newAra, ordine: canti.length });
    setNewIt(''); setNewAra(''); load();
  };

  // Funzione per salvare la modifica
  const handleSaveEdit = async (id) => {
    await updateCanto(id, { titoloIt: editIt, titoloAra: editAra });
    setEditId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo canto?")) {
      await deleteCanto(id);
      load();
    }
  };

  const moveCanto = async (index, direction) => {
    const nuovaLista = [...canti];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nuovaLista.length) return;
    [nuovaLista[index], nuovaLista[targetIndex]] = [nuovaLista[targetIndex], nuovaLista[index]];
    const listaAggiornata = nuovaLista.map((c, i) => ({ ...c, ordine: i }));
    setCanti(listaAggiornata);
    await riordinaCanti(preghieraId, listaAggiornata.map(c => ({ id: c._id, ordine: c.ordine })));
  };

  return (
    <div style={{ padding: '20px' }}>
      <nav style={{ marginBottom: '20px', color: '#000000ff', fontSize: '0.9em' }}>
  <Link to="/archivio" style={{ color: '#6b6b6bff', fontWeight: 'light', textDecoration: 'none' }}>Archivio</Link>
  {' > '}
  
  {/* Qui usiamo preghiera.occasioneId che ora è un oggetto grazie al populate */}
  {preghiera?.occasioneId ? (
    <Link 
      to={`/occasione/${preghiera.occasioneId._id}`} 
      style={{ color: '#6b6b6bff', fontWeight: 'bold', textDecoration: 'none' }}
    >
      {preghiera.occasioneId.titolo || preghiera.occasioneId.nome || 'Occasione'}
    </Link>
  ) : (
    <span>Caricamento...</span>
  )}
  
  {' > '}
  <strong>{preghiera?.titolo || preghiera?.nome || 'Canti'}</strong>
</nav>


      <h1 style={{ textAlign: 'center' }}>{preghiera?.titolo || preghiera?.nome}</h1>

      {canEdit && (
        <form onSubmit={handleAdd} style={{ maxWidth: '800px', margin: '20px auto', display: 'flex', gap: '10px', padding: '15px', border: '2px solid #000', borderRadius: '10px' }}>
          <input placeholder="Nome del Canto" value={newIt} onChange={e => setNewIt(e.target.value)} style={{ flex: 1 }} />
          <input placeholder="اسم اللحن" value={newAra} onChange={e => setNewAra(e.target.value)} style={{ flex: 1, textAlign: 'right' }} />
          <button type="submit" style={{ background: '#28a745', color: '#fff' }}>AGGIUNGI</button>
        </form>
      )}

      <div style={{ width: '100%', marginTop: '30px', display: 'flex', flexDirection: 'column' }}>
  {canti.map((c, index) => (
    <div key={c._id} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '15px 20px', 
      borderBottom: '1px solid #eee', 
      backgroundColor: '#fff'
    }}>
      
      {/* 1. CONTROLLI SPOSTAMENTO (Frecce evidenti) */}
      {canEdit && (
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => moveCanto(index, -1)} 
            disabled={index === 0} 
            style={{ 
              cursor: index === 0 ? 'default' : 'pointer', 
              border: '1px solid #ccc', 
              background: '#f8f9fa', 
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '12px',
              marginBottom: '2px',
              opacity: index === 0 ? 0.3 : 1 
            }}
          >
            ▲
          </button>
          <button 
            onClick={() => moveCanto(index, 1)} 
            disabled={index === canti.length - 1} 
            style={{ 
              cursor: index === canti.length - 1 ? 'default' : 'pointer', 
              border: '1px solid #ccc', 
              background: '#f8f9fa', 
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '12px',
              opacity: index === canti.length - 1 ? 0.3 : 1 
            }}
          >
            ▼
          </button>
        </div>
      )}

      {/* 2. NUMERO D'ORDINE */}
      <div style={{ 
        minWidth: '35px', 
        fontWeight: 'bold', 
        color: '#000000ff', 
        fontSize: '18px',
        marginRight: '10px'
      }}>
        {index + 1}.
      </div>

      {/* 3. CONTENUTO (Titoli) */}
      <div style={{ flex: 1 }}>
        {editId === c._id ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input value={editIt} onChange={e => setEditIt(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #000' }} />
            <input value={editAra} onChange={e => setEditAra(e.target.value)} style={{ flex: 1, textAlign: 'right', padding: '8px', border: '1px solid #000' }} />
            <button onClick={() => handleSaveEdit(c._id)} style={{ background: '#000', color: '#fff', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>OK</button>
            <button onClick={() => setEditId(null)} style={{ background: '#ccc', border: 'none', padding: '5px 10px', borderRadius: '5px', marginLeft: '5px' }}>X</button>
          </div>
        ) : (
          <Link to={`/canto/${c._id}`} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%', 
            textDecoration: 'none', 
            color: '#000' 
          }}>
            <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{c.titoloIt || c.titolo || "Senza Titolo"}</span>
            <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#000' }}>{c.titoloAra || ""}</span>
          </Link>
        )}
      </div>

      {/* 4. TASTI AZIONE (Modifica ed Elimina) */}
      {canEdit && editId !== c._id && (
        <div style={{ marginLeft: '20px', display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => { setEditId(c._id); setEditIt(c.titoloIt || c.titolo); setEditAra(c.titoloAra); }} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
            title="Modifica"
          >
            ✏️
          </button>
          <button 
            onClick={() => handleDelete(c._id)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#ff4444' }}
            title="Elimina"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  ))}
</div>
    </div>
  );
}
