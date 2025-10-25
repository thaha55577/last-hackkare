This folder contains local helper scripts for admin and server tasks.

Scripts:
- create-admins.js : Creates/updates admin users and writes an entry to RTDB.

Usage:
1. Obtain a Firebase service account JSON from the Firebase Console (Project Settings -> Service Accounts).
2. Place the JSON locally (do not commit it).
3. Run:
   node create-admins.js --serviceAccount=./serviceAccountKey.json

Security:
- Do not commit your service account JSON to the repository.
- These scripts are meant to be run locally by the project owner.
