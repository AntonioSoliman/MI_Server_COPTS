// src/components/SearchBar.jsx
import { useState } from 'react';
import { searchStrofe } from '../services/api';
import { Link } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      alert("Inserisci almeno 3 caratteri per la ricerca");
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchStrofe(query);
      setResults(data);
    } catch (err) {
      console.error("Errore durante la ricerca:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setResults([]);
    setQuery('');
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto 20px auto' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '5px' }}>
        <input 
          type="text" 
          placeholder="Cerca parole nelle preghiere o canti..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '25px', 
            border: '1px solid #ccc',
            fontSize: '16px',
            outline: 'none'
          }}
        />
        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px', 
            borderRadius: '25px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {isSearching ? '...' : 'Cerca'}
        </button>
      </form>

      {/* Pannello Risultati (appare solo se ci sono risultati) */}
      {results.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '55px', 
          left: 0, 
          right: 0, 
          backgroundColor: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
          zIndex: 1000, 
          maxHeight: '400px', 
          overflowY: 'auto',
          padding: '15px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Trovate {results.length} strofe:</span>
            <button onClick={clearSearch} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>Chiudi X</button>
          </div>

          {results.map(s => (
            <div key={s._id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '12px', color: '#007bff', fontWeight: 'bold' }}>
                Canto: {s.cantoId?.nome || 'Titolo non disponibile'}
              </div>
              
              {/* Mostriamo un'anteprima del testo trovato (Italiano e Copto) */}
              <div style={{ fontSize: '14px', margin: '5px 0', color: '#333' }}>
                <strong>IT:</strong> {s.testo?.it?.substring(0, 100)}...
              </div>
              
              <Link 
                to={`/canto/${s.cantoId?._id}`} 
                onClick={clearSearch}
                style={{ fontSize: '13px', color: '#28a745', textDecoration: 'none', fontWeight: 'bold' }}
              >
                Vai alla strofa completa →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Messaggio se non trova nulla dopo aver cercato */}
      {query.length > 2 && results.length === 0 && !isSearching && (
        <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '12px', color: '#999' }}>
          Premi invio per cercare
        </div>
      )}
    </div>
  );
}
