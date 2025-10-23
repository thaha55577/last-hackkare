const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.database();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Simple in-memory rate limiter per IP (for prototype only)
const rateMap = new Map();
const MAX_PER_MINUTE = 100; // tune as needed

app.post('/registerTeam', async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - 60_000;
    const info = rateMap.get(ip) || [];
    const recent = info.filter((t) => t > windowStart);
    if (recent.length >= MAX_PER_MINUTE) {
      return res.status(429).send('Too many requests, try later');
    }
    recent.push(now);
    rateMap.set(ip, recent);

    // Validate Authorization header (Bearer <token>) if present
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

    // Basic duplicate check: prevent overwrite if team exists
    const teamRef = db.ref('teams/' + teamName);
    const snap = await teamRef.once('value');
    if (snap.exists()) {
      return res.status(409).send('Team name already exists');
    }

    // Write to RTDB
    await teamRef.set({ members, createdBy: uid || 'anonymous', createdAt: admin.database.ServerValue.TIMESTAMP });

    return res.status(201).send('Registered');
  } catch (err) {
    console.error('registerTeam error', err);
    return res.status(500).send('Server error');
  }
});

exports.api = functions.https.onRequest(app);
