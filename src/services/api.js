// src/services/api.js 
const API_BASE = 'https://mi-server-copts.vercel.app/api';

// --- AUTENTICAZIONE E UTENTI ---
export const login = (data) => 
  fetch(`${API_BASE}/auth/login`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => res.json());

export const register = (data) => 
  fetch(`${API_BASE}/auth/register`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => res.json());

export const getAllUsers = () => 
  fetch(`${API_BASE}/admin/users`).then(res => res.json());

export const updateUser = (id, data) => 
  fetch(`${API_BASE}/admin/users/${id}`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => res.json());

export const deleteUser = (id) => 
  fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' }).then(res => res.json());

// --- OCCASIONI ---
export const getOccasioni = () => 
  fetch(`${API_BASE}/occasioni`).then(res => res.json());

export const getOccasioneSingola = (id) => 
  fetch(`${API_BASE}/occasioni/${id}`).then(res => res.json());

export const createOccasione = (data) => 
  fetch(`${API_BASE}/occasioni`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => {
    if (!res.ok) throw new Error('Errore nel salvataggio dell’occasione');
    return res.json();
  });

export const updateOccasione = (id, data) => 
  fetch(`${API_BASE}/occasioni/${id}`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => {
    if (!res.ok) throw new Error('Errore nell’aggiornamento dell’occasione');
    return res.json();
  });

export const deleteOccasione = (id) => 
  fetch(`${API_BASE}/occasioni/${id}`, { method: 'DELETE' }).then(res => res.json());

// --- PREGHIERE ---
export const getPreghiere = (occasioneId) => 
  fetch(`${API_BASE}/preghiere?occasioneId=${occasioneId}`).then(res => res.json());

export const getPreghieraSingola = (id) => 
  fetch(`${API_BASE}/preghiere/${id}`).then(res => res.json());

export const createPreghiera = (data) => 
  fetch(`${API_BASE}/preghiere`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => res.json());

export const deletePreghiera = (id) => 
  fetch(`${API_BASE}/preghiere/${id}`, { method: 'DELETE' }).then(res => res.json());

export const updatePreghiera = (id, data) => 
  fetch(`${API_BASE}/preghiere/${id}`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => res.json());

// --- CANTI ---
export const getCanti = (preghieraId) => 
  fetch(`${API_BASE}/canti?preghieraId=${preghieraId}`).then(res => res.json());

export const getCantoSingolo = (id) => 
  fetch(`${API_BASE}/canti/${id}`).then(res => res.json());

export const createCanto = (data) => 
  fetch(`${API_BASE}/canti`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => res.json());

export const updateCanto = (id, data) => 
  fetch(`${API_BASE}/canti/${id}`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => res.json());

export const deleteCanto = (id) => 
  fetch(`${API_BASE}/canti/${id}`, { method: 'DELETE' }).then(res => res.json());

export const riordinaCanti = (preghieraId, nuovoOrdine) => 
  fetch(`${API_BASE}/canti/riordina`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ preghieraId, nuovoOrdine }) 
  }).then(res => res.json());

// --- STROFE ---
export const getStrofe = (cantoId) => 
  fetch(`${API_BASE}/strofe?cantoId=${cantoId}`).then(res => res.json());

export const createStrofa = (data) => 
  fetch(`${API_BASE}/strofe`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => res.json());

export const updateStrofa = (id, data) => 
  fetch(`${API_BASE}/strofe/${id}`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  }).then(res => {
    if (!res.ok) throw new Error('Errore server durante l’aggiornamento della strofa');
    return res.json();
  });

export const deleteStrofa = (id) => 
  fetch(`${API_BASE}/strofe/${id}`, { method: 'DELETE' }).then(res => res.json());

export const riordinaStrofe = (cantoId, nuovoOrdine) => 
  fetch(`${API_BASE}/strofe/riordina`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ cantoId, nuovoOrdine }) 
  }).then(res => res.json());

// --- RICERCA ---
export const searchStrofe = (query) => 
  fetch(`${API_BASE}/search?q=${query}`).then(res => res.json());
