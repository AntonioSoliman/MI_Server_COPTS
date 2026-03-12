// BACKEND
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();

// CORS: allow credentials from the frontend origin (avoid wildcard when using credentials)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
// If FRONTEND_ORIGIN is set, only allow that origin; otherwise echo the request origin
// (this avoids forcing `localhost` and lets same-origin or proxied requests work).
if (FRONTEND_ORIGIN) {
  app.use(cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    methods: ['GET','POST','PUT','DELETE','OPTIONS']
  }));
} else {
  app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'], methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
}
app.use(cookieParser());

// Middleware di autenticazione admin basata su chiave (x-admin-key o Authorization: Bearer <key>)
const ADMIN_KEY = process.env.ADMIN_KEY || process.env.ADMIN_SECRET || 'dev_admin_key';
const JWT_SECRET = process.env.JWT_SECRET || ADMIN_KEY;
if (!process.env.ADMIN_KEY) console.warn('Warning: ADMIN_KEY not set, using default dev key');

function adminAuth(req, res, next) {
  // 1) header key
  const headerKey = req.headers['x-admin-key'] || (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ') ? req.headers['authorization'].split(' ')[1] : null);
  if (headerKey && headerKey === ADMIN_KEY) return next();
  // 2) jwt cookie
  const token = req.cookies && req.cookies.admin_token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload && payload.admin) return next();
    } catch (err) {
      // invalid token
    }
  }
  return res.status(401).json({ error: 'Admin authentication required' });
  next();
}

// MODIFICA CRITICA: Aumentiamo il limite del body parser per accettare immagini Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connessione al DB: se MONGO_URI non è impostato, usiamo un MongoDB in-memory per sviluppo
async function connectDB() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('DB connesso con successo (MONGO_URI)');
    } else {
      // fallback in-memory (sviluppo)
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('DB connesso con successo (in-memory)');
    }
  } catch (err) {
    console.error('Errore connessione DB:', err);
    process.exit(1);
  }
}

connectDB();

// --- SCHEMI ---
const Occasione = mongoose.model('Occasione', new mongoose.Schema({ titolo: String, imageUrl: String }));
const Preghiera = mongoose.model('Preghiera', new mongoose.Schema({ occasioneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Occasione' }, titolo: String, ordine: Number }));
const Canto = mongoose.model('Canto', new mongoose.Schema({ 
  preghieraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Preghiera' }, 
  titoloIt: String, 
  titoloAra: String, 
  ordine: Number 
}));

const Strofa = mongoose.model('Strofa', new mongoose.Schema({
  cantoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canto' },
  ruolo: String,
  ordine: Number,
  testo: {
    it: String,
    cptIt: String,
    cpt: String,
    cptAra: String,
    ara: String
  }
}));

const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'ospite' }, 
  status: { type: String, default: 'pending' } 
}));

// --- ROTTE AUTENTICAZIONE ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const isSpecialAdmin = req.body.username === 'AdMiN'; 
    const user = new User({ ...req.body, role: isSpecialAdmin ? 'admin' : 'ospite', status: isSpecialAdmin ? 'active' : 'pending' });
    await user.save();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: "Username già esistente" }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    if (user.status !== 'active') return res.status(403).json({ error: "Account in attesa di approvazione" });
    res.json({ ok: true, user });
  } else { res.status(401).json({ error: "Credenziali errate" }); }
});

// ROTTE ADMIN (protette da adminAuth)
app.get('/api/admin/users', adminAuth, async (req, res) => res.json(await User.find({ username: { $ne: 'AdMiN' } })));
app.put('/api/admin/users/:id', adminAuth, async (req, res) => res.json(await User.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/admin/users/:id', adminAuth, async (req, res) => { await User.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

// Endpoint dedicati per approvazione/rifiuto utenti
app.get('/api/admin/pending', adminAuth, async (req, res) => {
  res.json(await User.find({ status: 'pending', username: { $ne: 'AdMiN' } }));
});

app.put('/api/admin/users/:id/approve', adminAuth, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
  res.json({ ok: true, user });
});

app.put('/api/admin/users/:id/reject', adminAuth, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Admin login using ADMIN_KEY -> sets HttpOnly cookie with JWT
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_KEY) return res.status(401).json({ error: 'Invalid admin credentials' });
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '2h' });
  // set HttpOnly cookie
  res.cookie('admin_token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

// --- ROTTE OCCASIONI ---
app.get('/api/occasioni', async (req, res) => res.json(await Occasione.find()));
app.get('/api/occasioni/:id', async (req, res) => res.json(await Occasione.findById(req.params.id)));
app.post('/api/occasioni', async (req, res) => res.json(await new Occasione(req.body).save()));
app.put('/api/occasioni/:id', async (req, res) => res.json(await Occasione.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/occasioni/:id', async (req, res) => { await Occasione.findByIdAndDelete(req.params.id); res.json({ok:true}); });

// --- ROTTE PREGHIERE ---
app.get('/api/preghiere', async (req, res) => {
  const filter = req.query.occasioneId ? { occasioneId: req.query.occasioneId } : {};
  res.json(await Preghiera.find(filter).sort('ordine'));
});

app.get('/api/preghiere/:id', async (req, res) => {
  try {
    const preghiera = await Preghiera.findById(req.params.id).populate('occasioneId');
    res.json(preghiera);
  } catch (err) { res.status(404).json({ error: "Preghiera non trovata" }); }
});

app.post('/api/preghiere', async (req, res) => {
    const count = await Preghiera.countDocuments({ occasioneId: req.body.occasioneId });
    res.json(await new Preghiera({...req.body, ordine: count + 1}).save());
});

app.put('/api/preghiere/:id', async (req, res) => {
  res.json(await Preghiera.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

app.delete('/api/preghiere/:id', async (req, res) => { await Preghiera.findByIdAndDelete(req.params.id); res.json({ok:true}); });

// --- ROTTE CANTI ---
app.get('/api/canti', async (req, res) => {
  const filter = req.query.preghieraId ? { preghieraId: req.query.preghieraId } : {};
  res.json(await Canto.find(filter).sort('ordine'));
});

app.get('/api/canti/:id', async (req, res) => {
  try {
    const canto = await Canto.findById(req.params.id).populate({
      path: 'preghieraId',
      populate: { path: 'occasioneId' }
    });
    res.json(canto);
  } catch (err) { res.status(404).json({ error: "Canto non trovato" }); }
});

app.post('/api/canti', async (req, res) => {
  const count = await Canto.countDocuments({ preghieraId: req.body.preghieraId });
  res.json(await new Canto({...req.body, ordine: count + 1}).save());
});

app.put('/api/canti/:id', async (req, res) => {
  res.json(await Canto.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

app.put('/api/canti/riordina', async (req, res) => {
  const { nuovoOrdine } = req.body;
  const promises = nuovoOrdine.map(item => Canto.findByIdAndUpdate(item.id, { ordine: item.ordine }));
  await Promise.all(promises);
  res.json({ ok: true });
});

app.delete('/api/canti/:id', async (req, res) => { await Canto.findByIdAndDelete(req.params.id); res.json({ok:true}); });

// --- ROTTE STROFE ---
app.get('/api/strofe', async (req, res) => {
  const filter = req.query.cantoId ? { cantoId: req.query.cantoId } : {};
  res.json(await Strofa.find(filter).sort('ordine'));
});

app.post('/api/strofe', async (req, res) => {
    const count = await Strofa.countDocuments({ cantoId: req.body.cantoId });
    res.json(await new Strofa({...req.body, ordine: count + 1}).save());
});

app.put('/api/strofe/:id', async (req, res) => {
  res.json(await Strofa.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

app.put('/api/strofe/riordina', async (req, res) => {
    const { nuovoOrdine } = req.body;
    const promises = nuovoOrdine.map((id, index) => Strofa.findByIdAndUpdate(id, { ordine: index + 1 }));
    await Promise.all(promises);
    res.json({ok:true});
});

app.delete('/api/strofe/:id', async (req, res) => { await Strofa.findByIdAndDelete(req.params.id); res.json({ok:true}); });

// --- RICERCA AVANZATA CON POPULATE ---
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  try {
    const risultati = await Strofa.find({
      $or: [
        { "testo.it": { $regex: q, $options: 'i' } },
        { "testo.cpt": { $regex: q, $options: 'i' } },
        { "testo.cptIt": { $regex: q, $options: 'i' } },
        { "testo.ara": { $regex: q, $options: 'i' } }
      ]
    })
    .populate('cantoId') 
    .limit(15)
    .lean();
    res.json(risultati);
  } catch (err) { res.status(500).json({ error: "Errore ricerca" }); }
});

app.listen(3000, () => console.log('Server in esecuzione sulla porta 3000'));
