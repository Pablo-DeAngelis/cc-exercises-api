import admin from './admin.js'

// Firestore via firebase-admin (service account). Bypasses security rules, so
// the backend no longer depends on the shared rules being open.
const db = admin.firestore()

const connection = () => db

export default connection
