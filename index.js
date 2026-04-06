import 'dotenv/config'
import * as Sentry from '@sentry/node'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import exercisesRoutes from './routes/exercisesRoutes.js'
import { loadExerciseCache } from './data/exerciseCache.js'

const app = express()
const port = process.env.PORT || 3003
const host = process.env.HOST || '0.0.0.0'

// Middlewares de seguridad
app.use(helmet())

// Rate limiting - 100 requests por IP cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    details: 'Please try again later'
  }
})
app.use('/api', limiter)

// Middlewares
app.use(express.json())

// Health check endpoint (sin auth)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'cc-exercises-api',
    timestamp: new Date().toISOString()
  })
})

// Rutas
app.use('/api', exercisesRoutes)

// Cargar cache de ejercicios al inicio
loadExerciseCache()
  .then((count) => {
    console.log(`Exercise cache loaded: ${count} exercises`)
  })
  .catch((error) => {
    console.error('Failed to load exercise cache on startup:', error)
  })

Sentry.setupExpressErrorHandler(app)

app.listen(port, host, () => {
  console.log(`cc-exercises-api is running on ${host}:${port}`)
  console.log(`Environment: ${process.env.CC_ENVIRONMENT || 'PRODUCTION'}`)
})
