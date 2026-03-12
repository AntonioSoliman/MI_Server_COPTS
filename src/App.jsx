// src/App.jsx 
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { searchStrofe } from './services/api'; 
import OccasioniList from './components/OccasioniList';
import PreghiereList from './components/PreghiereList';
import CantiList from './components/CantiList';
import StrofeList from './components/StrofeList';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import PendingApprovals from './components/PendingApprovals';
import PrintWizard from './components/PrintWizard'; // <--- Importa il nuovo Wizard

// --- COMPONENTE RICERCA AGGIORNATO ---
function SearchBar() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const q = e.target.value;
    setTerm(q);
    if (q.length > 2) {
      try {
        const res = await searchStrofe(q);
        setResults(res || []);
      } catch (err) { console.error(err); }
    } else {
      setResults([]);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <input 
        type="text" 
        placeholder="🔍 Cerca nei testi (it, copto, arabo)..." 
        value={term}
        onChange={handleSearch}
        style={{ 
          width: '100%', padding: '8px 15px', borderRadius: '20px', 
          border: '2px solid #000', outline: 'none', fontSize: '14px'
        }}
      />
      {results.length > 0 && (
        <div style={{ 
          position: 'absolute', top: '40px', left: 0, right: 0, 
          background: '#fff', border: '2px solid #000', borderRadius: '10px', 
          zIndex: 999, maxHeight: '350px', overflowY: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' 
        }}>
          {results.map(r => (
            <div 
              key={r._id} 
              onClick={() => { 
                navigate(`/canto/${r.cantoId._id || r.cantoId}`); 
                setResults([]); 
                setTerm(''); 
              }}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#000' }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                {r.cantoId?.titoloIt || r.cantoId?.titolo || "Vai al Canto"}
              </div>
              <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                {r.testo?.it?.substring(0, 45) || r.testo?.cpt?.substring(0, 45)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- HOMEPAGE ---
function HomePage({ user, setUser, onOpenPrint }) { // <--- Aggiunta prop per stampa
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1>MI_Server_COPTS</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '800px', margin: '40px auto' }}>
        <div onClick={() => navigate('/archivio')} style={cardStyle}><h2>📁 ARCHIVIO DATI</h2></div>
        {/* Adesso la card funziona e apre il Wizard */}
        <div onClick={onOpenPrint} style={cardStyle}><h2>📄 STAMPA PDF</h2></div>
      </div>
      {user ? (
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          {user.role === 'admin' && <>
            <button onClick={() => navigate('/admin')} style={btnAdmin}>Admin</button>
            <button onClick={() => navigate('/admin/pending')} style={{...btnAdmin, background: '#27ae60'}}>Approva Utenti</button>
          </>}
          <button onClick={() => {
            localStorage.removeItem('user');
            setUser(null);
          }} style={btnLogout}>Logout ({user.username})</button>
        </div>
      ) : (
        <button onClick={() => navigate('/login')} style={btnLogin}>Accedi / Registrati</button>
      )}
    </div>
  );
}

const cardStyle = { padding: '40px', border: '4px solid #000', borderRadius: '25px', cursor: 'pointer', boxShadow: '10px 10px 0px #000', backgroundColor: '#fff' };
const btnLogin = { padding: '12px 25px', background: '#000', color: '#fff', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const btnAdmin = { padding: '12px 25px', background: '#f39c12', color: '#fff', borderRadius: '10px', border:'none', cursor:'pointer' };
const btnLogout = { padding: '12px 25px', background: '#e74c3c', color: '#fff', borderRadius: '10px', border:'none', cursor:'pointer' };

// --- APP ---
export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Stato per mostrare/nascondere il Wizard di stampa
  const [showPrint, setShowPrint] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div style={{ maxWidth: '100%', margin: '0 auto', fontFamily: 'Arial' }}>
       
        {/* Mostriamo il Wizard se lo stato è true */}
        {showPrint && <PrintWizard onClose={() => setShowPrint(false)} />}

        {/* HEADER FISSO */}
        <header style={{ 
          padding: '15px 20px', 
          borderBottom: '2px solid #eee', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          {/* SINISTRA: Navigazione e Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
            <Link to="/" style={{ fontWeight: 'bold', color: '#000', textDecoration: 'none', fontSize: '18px' }}>
              ⛪ HOME
            </Link>
            
            {/* TASTO STAMPA RAPIDA NELL'HEADER */}
            <button 
              onClick={() => setShowPrint(true)}
              style={{
                background: '#000', color: '#fff', border: 'none', padding: '6px 12px',
                borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              📄 PDF
            </button>

            {user ? (
              <button 
                onClick={handleLogout} 
                style={{
                  textDecoration: 'none', color: '#000', background: '#fff',
                  border: '2px solid #000', padding: '5px 15px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                Logout
              </button>
            ) : (
              <Link 
                to="/login" 
                style={{
                  textDecoration: 'none', color: '#000', background: '#fff',
                  border: '2px solid #000', padding: '5px 15px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block'
                }}
              >
                Accedi
              </Link>
            )}
          </div>
          
          {/* CENTRO: Barra di Ricerca */}
          <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
            <SearchBar />
          </div>

          {/* DESTRA: Logo */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <span style={{ fontWeight: '900', color: '#000', fontSize: '16px' }}>
              MI_Server_COPTS
            </span>
          </div>
        </header>

        {/* CONTENUTO PRINCIPALE */}
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<HomePage user={user} setUser={setUser} onOpenPrint={() => setShowPrint(true)} />} />
            <Route path="/login" element={
              <Login setUser={(u) => {
                localStorage.setItem('user', JSON.stringify(u));
                setUser(u);
              }} />
            } />
            <Route path="/admin" element={<AdminPanel user={user} setUser={setUser} />} />
            <Route path="/admin/pending" element={<PendingApprovals user={user} setUser={setUser} />} />
            <Route path="/archivio" element={<OccasioniList user={user} />} />
            <Route path="/occasione/:occasioneId" element={<PreghiereList user={user} />} />
            <Route path="/preghiera/:preghieraId" element={<CantiList user={user} />} />
            <Route path="/canto/:cantoId" element={<StrofeList user={user} />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}
