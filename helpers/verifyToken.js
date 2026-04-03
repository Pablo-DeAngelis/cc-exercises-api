import jwt from 'jsonwebtoken'
import admin from '../config/admin.js'
import { SECRET_JWT_KEY } from '../config/config.js'

export class VerifiToken {
  static appCheckVerification = async (req, res, next) => {
    const authorizationHeader = req.header('Authorization')

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided or invalid format' })
    }

    const token = authorizationHeader.split('Bearer ')[1]

    try {
      const decodedToken = jwt.verify(token, SECRET_JWT_KEY)
      req.user = decodedToken
      return next()
    } catch {
      // JWT custom failed, try Firebase ID token
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token)
      req.user = { ...decodedToken, user_id: decodedToken.uid }
      next()
    } catch (error) {
      console.error('Error verifying token:', error)
      return res.status(401).json({ message: 'Unauthorized: Invalid token' })
    }
  }
}
