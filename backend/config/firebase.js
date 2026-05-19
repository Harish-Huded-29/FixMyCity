// ============================================
// FixMyCity - Firebase Admin SDK Setup
// Used ONLY for verifying Google login tokens on the backend
// ============================================

const admin = require('firebase-admin');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return admin;

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        // The private key comes from env with literal \n - we need to replace those
        privateKey:  process.env.FIREBASE_PRIVATE_KEY
                       ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                       : undefined,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId:    process.env.FIREBASE_CLIENT_ID,
        authUri:     'https://accounts.google.com/o/oauth2/auth',
        tokenUri:    'https://oauth2.googleapis.com/token',
        clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
      }),
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Firebase Admin SDK error:', error.message);
  }

  return admin;
};

module.exports = initializeFirebase;
