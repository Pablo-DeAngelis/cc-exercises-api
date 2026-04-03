import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfigPrd = {
  apiKey: 'AIzaSyC9yJHMQNS5FsGKZSVH7finMHeKBF2BIbY',
  authDomain: 'cc-user-core.firebaseapp.com',
  projectId: 'cc-user-core',
  storageBucket: 'cc-user-core.appspot.com',
  messagingSenderId: '904566495715',
  appId: '1:904566495715:web:32b2a471a1f2d896b2e8d6',
  measurementId: 'G-PSGW9R9S9V'
}

const firebaseConfigDev = {
  apiKey: 'AIzaSyCrfrVo1hkkcF8B6XSuJQCVGX9ox47k9lg',
  authDomain: 'dev-coach-connect.firebaseapp.com',
  projectId: 'dev-coach-connect',
  storageBucket: 'dev-coach-connect.firebasestorage.app',
  messagingSenderId: '232021121736',
  appId: '1:232021121736:web:75ad3b7642fb0212b863fd',
  measurementId: 'G-5BHQ5N8W4T'
}

const firebaseConfig = process.env.CC_ENVIRONMENT === 'DEV' ? firebaseConfigDev : firebaseConfigPrd

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const connection = () => db

export default connection
