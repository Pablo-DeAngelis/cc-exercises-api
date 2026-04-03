import admin from 'firebase-admin'

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('Missing required environment variable: FIREBASE_SERVICE_ACCOUNT')
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

const databaseURL =
  process.env.CC_ENVIRONMENT === 'DEV'
    ? 'https://dev-coach-connect.firebaseio.com'
    : 'https://cc-user-core.firebaseio.com'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL
  })
}

export default admin

export const {
  PORT = 3003,
  SECRET_JWT_KEY = 'poner-en-una-variable-de-entorno-esta-key',
} = process.env
