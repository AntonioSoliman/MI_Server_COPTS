// src/components/StrofeList.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStrofe, createStrofa, deleteStrofa, getCantoSingolo, updateStrofa, riordinaStrofe } from '../services/api';

export default function StrofeList({ user }) {
  const { cantoId } = useParams();
  const [strofe, setStrofe] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ruolo: '', it: '', cpt: '', cptIt: '', ara: '', cptAra: '' });

  const canEdit = user && (user.role === 'admin' || user.role === 'editor');

  const roleMap = {
    "Prete": { col1: "Il Prete", col2: "Pioúib", col3: "Ⲡⲓⲟⲩⲏⲃ", col4: "بي أوويب", col5: "الكاهن" },
    "Diacono": { col1: "Il Diacono", col2: "Piziakón", col3: "Ⲡⲓⲇⲓⲁⲕⲱⲛ", col4: "بي ذياكون", col5: "الشماس" },
    "Popolo": { col1: "Il Popolo", col2: "Pilaos", col3: "Ⲡⲓⲗⲁⲟⲥ", col4: "بي لاؤس", col5: "الشعب" }
  };

  useEffect(() => { 
    loadData(); 
  }, [cantoId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lista, dettagli] = await Promise.all([
        getStrofe(cantoId),
        getCantoSingolo(cantoId)
      ]);
      setStrofe(lista.sort((a, b) => (a.ordine || 0) - (b.ordine || 0)));
      setInfo(dettagli);
    } catch (error) { 
      console.error("Errore nel caricamento:", error); 
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { 
      cantoId, 
      ruolo: formData.ruolo, 
      testo: { it: formData.it, cpt: formData.cpt, cptIt: formData.cptIt, ara: formData.ara, cptAra: formData.cptAra } 
    };
    
    try {
      if (editingId) {
        await updateStrofa(editingId, payload);
      } else {
        await createStrofa({ ...payload, ordine: strofe.length });
      }
      resetForm();
      loadData();
    } catch (err) { alert("Errore durante il salvataggio"); }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ ruolo: '', it: '', cpt: '', cptIt: '', ara: '', cptAra: '' });
  };

  const handleEdit = (s) => {
    setEditingId(s._id);
    setFormData({ 
      ruolo: s.ruolo || '', 
      it: s.testo?.it || '', 
      cpt: s.testo?.cpt || '', 
      cptIt: s.testo?.cptIt || '', 
      ara: s.testo?.ara || '', 
      cptAra: s.testo?.cptAra || '' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMove = async (index, direction) => {
    const nuove = [...strofe];
    const target = index + direction;
    if (target < 0 || target >= nuove.length) return;
    [nuove[index], nuove[target]] = [nuove[target], nuove[index]];
    await riordinaStrofe(cantoId, nuove.map((s, i) => ({ id: s._id, ordine: i })));
    loadData();
  };

  // Stili
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', width: '100%', minWidth: '1000px' };
  const cellBase = { padding: '15px', borderRight: '1px solid #ddd', fontSize: '19px', lineHeight: '1.5' };
  const headerStyle = { ...cellBase, fontWeight: '900', textAlign: 'center', backgroundColor: '#f2f2f2', borderBottom: '1px solid #000', fontSize: '15px' };
  const bodyStyle = { ...cellBase, whiteSpace: 'pre-wrap', textAlign: 'justify', backgroundColor: '#fff' };

  if (loading) return <div style={{padding:'20px'}}>Caricamento...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '100%', margin: '0 auto' }}>
      
     {/* Briciole di Pane con controllo sicuro */}
<nav style={{ marginBottom: '20px', fontSize: '0.9em', color: '#666' }}>
  <Link to="/archivio" style={{textDecoration:'none', color:'#a4a4a4ff'}}>Archivio</Link>
  
  {/* Occasione */}
  {info?.preghieraId?.occasioneId && (
    <>
      {' > '}
      <Link to={`/occasione/${info.preghieraId.occasioneId._id}`} style={{color: '#6b6b6bff', textDecoration: 'none'}}>
        {info.preghieraId.occasioneId.titolo}
      </Link>
    </>
  )}

  {/* Preghiera (Controlliamo sia titolo che nome) */}
  {info?.preghieraId && (
    <>
      {' > '}
      <Link to={`/preghiera/${info.preghieraId._id}`} style={{color: '#6b6b6bff', fontWeight: 'bold', textDecoration: 'none'}}>
        {info.preghieraId.titolo || info.preghieraId.nome || "Preghiera"}
      </Link>
    </>
  )}

  {' > '}
  <strong style={{ color: '#000' }}>{info?.titoloIt || info?.titolo || "Canto"}</strong>
</nav>

      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        {info?.titoloIt} {info?.titoloAra && `- ${info.titoloAra}`}
      </h1>

      {/* FORM ADMIN */}
      {canEdit && (
        <div style={{ marginBottom: '40px', padding: '20px', border: '3px solid #000', borderRadius: '15px', backgroundColor: '#fdfdfd' }}>
          <h3>{editingId ? "📝 Modifica Strofa" : "➕ Aggiungi Strofa"}</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <select value={formData.ruolo} onChange={(e) => setFormData({...formData, ruolo: e.target.value})} style={{ padding: '10px', width: '250px' }}>
              <option value="">Nessun Ruolo</option>
              <option value="Prete">Prete</option>
              <option value="Diacono">Diacono</option>
              <option value="Popolo">Popolo</option>
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              <textarea placeholder="Italiano" value={formData.it} onChange={(e)=>setFormData({...formData, it: e.target.value})} rows="5" />
              <textarea placeholder="Copto" value={formData.cptIt} onChange={(e)=>setFormData({...formData, cptIt: e.target.value})} rows="5" />
              <textarea placeholder="Ⲕⲟⲡⲧⲟⲥ" value={formData.cpt} onChange={(e)=>setFormData({...formData, cpt: e.target.value})} rows="5" />
              <textarea dir="rtl" placeholder="قبطي معرب" value={formData.cptAra} onChange={(e)=>setFormData({...formData, cptAra: e.target.value})} rows="5" />
              <textarea dir="rtl" placeholder="عربي" value={formData.ara} onChange={(e)=>setFormData({...formData, ara: e.target.value})} rows="5" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', background: '#000', color: '#fff', fontWeight: 'bold', border:'none', borderRadius:'8px', cursor:'pointer' }}>
                {editingId ? "SALVA MODIFICHE" : "AGGIUNGI STROFA"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ padding: '12px', background: '#ff4444', color: '#fff', border:'none', borderRadius:'8px', cursor: 'pointer' }}>
                  ANNULLA
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TABELLA STROFE */}
      <div style={{ border: '2px solid #000', borderRadius: '10px', overflowX: 'auto' }}>
        {strofe.map((s, index) => {
          const r = roleMap[s.ruolo];
          return (
            <div key={s._id} style={{ borderBottom: '4px solid #000' }}>
              {r && (
                <div style={gridStyle}>
                  <div style={headerStyle}>{r.col1}</div>
                  <div style={headerStyle}>{r.col2}</div>
                  <div style={headerStyle}>{r.col3}</div>
                  <div style={{...headerStyle, fontSize: '18px'}} dir="rtl">{r.col4}</div>
                  <div style={{...headerStyle, borderRight: 'none', fontSize: '18px'}} dir="rtl">{r.col5}</div>
                </div>
              )}
              <div style={gridStyle}>
                <div style={bodyStyle}>{s.testo?.it}</div>
                <div style={bodyStyle}>{s.testo?.cptIt}</div>
                <div style={bodyStyle}>{s.testo?.cpt}</div>
                <div style={{...bodyStyle, fontSize: '24px'}} dir="rtl">{s.testo?.cptAra}</div>
                <div style={{...bodyStyle, borderRight: 'none', fontSize: '24px'}} dir="rtl">{s.testo?.ara}</div>
              </div>
              {canEdit && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f9f9f9' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleMove(index, -1)} disabled={index===0}>▲ Su</button>
                    <button onClick={() => handleMove(index, 1)} disabled={index===strofe.length-1}>▼ Giù</button>
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button onClick={() => handleEdit(s)} style={{ color: 'blue', border: 'none', background: 'none', cursor: 'pointer' }}>✏️ MODIFICA</button>
                    <button onClick={() => { if(window.confirm("Eliminare?")) deleteStrofa(s._id).then(loadData) }} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️ ELIMINA</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
