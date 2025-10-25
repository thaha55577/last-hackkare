/**
 * Local helper to create/update admin users and set custom admin claim.
 * Usage:
 *   node create-admins.js --serviceAccount=./serviceAccountKey.json
 *
 * This script will:
 *  - Create or update the two users with provided emails and passwords.
 *  - Set custom claim { admin: true } for each.
 *  - Write a record to RTDB at /admins/<uid> with email and timestamp.
 *
 * SECURITY: Keep your service account JSON local and do NOT commit it.
 */

const admin = require('firebase-admin');
const fs = require('fs');

const admins = [
  { email: '99230040338@klu.ac.in', password: 'Thaha@555' },
  { email: '99230040469@klu.ac.in', password: 'Thaha123' },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach((a) => {
    const [k, v] = a.split('=');
    const key = k.replace(/^--/, '');
    out[key] = v;
  });
  return out;
}

async function main() {
  const args = parseArgs();
  const serviceAccount = args.serviceAccount || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccount) {
    console.error('Provide --serviceAccount=path/to/sa.json or set GOOGLE_APPLICATION_CREDENTIALS');
    process.exit(1);
  }
  if (!fs.existsSync(serviceAccount)) {
    console.error('Service account file not found:', serviceAccount);
    process.exit(1);
  }

  const sa = require(serviceAccount);
  admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: sa.databaseURL || undefined });

  const db = admin.database();

  for (const a of admins) {
    try {
      let user;
      try {
        user = await admin.auth().getUserByEmail(a.email);
        console.log('User exists, updating password:', a.email);
        await admin.auth().updateUser(user.uid, { password: a.password });
      } catch (err) {
        console.log('Creating user:', a.email);
        user = await admin.auth().createUser({ email: a.email, password: a.password, emailVerified: true });
      }

      // Set custom claim
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log('Set admin claim for', a.email);

      // Save to RTDB
      await db.ref('admins/' + user.uid).set({ email: a.email, createdAt: admin.database.ServerValue.TIMESTAMP });
      console.log('Saved admin record for', a.email);
    } catch (err) {
      console.error('Error handling', a.email, err);
    }
  }

  console.log('Done.');
  process.exit(0);
}

main();
