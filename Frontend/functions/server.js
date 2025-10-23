const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin (in Cloud Run use default credentials)
try {
  admin.initializeApp();
} catch (e) {
  // already initialized
}

const db = admin.database();
const app = express();
app.use(cors());
app.use(express.json());

// Simple per-instance rate limiter (prototype)
const rateMap = new Map();
const MAX_PER_MINUTE = 500; // tune per instance

app.post('/registerTeam', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - 60_000;
    const info = rateMap.get(ip) || [];
    const recent = info.filter((t) => t > windowStart);
    if (recent.length >= MAX_PER_MINUTE) {
      return res.status(429).send('Too many requests, try later');
    }
    recent.push(now);
    rateMap.set(ip, recent);

    // Optional token validation
    const authHeader = req.get('Authorization') || '';
    let uid = null;
    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        uid = decoded.uid;
      } catch (err) {
        console.error('Invalid token', err);
        return res.status(401).send('Invalid auth token');
      }
    }

    const { teamName, members } = req.body || {};
    if (!teamName || !Array.isArray(members) || members.length === 0) {
      return res.status(400).send('Invalid payload');
    }

    // Basic uniqueness check
    const teamRef = db.ref('teams/' + teamName);
    const snap = await teamRef.once('value');
    if (snap.exists()) {
      return res.status(409).send('Team name already exists');
    }

    await teamRef.set({ members, createdBy: uid || 'anonymous', createdAt: admin.database.ServerValue.TIMESTAMP });
    return res.status(201).send('Registered');
  } catch (err) {
    console.error('registerTeam error', err);
    return res.status(500).send('Server error');
  }
});

app.get('/healthz', (req, res) => res.send('ok'));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
