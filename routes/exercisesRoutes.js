import express from 'express'
import * as exercisesController from '../controllers/exercisesController.js'
import { VerifiToken } from '../helpers/verifyToken.js'

const router = express.Router()

// IMPORTANTE: la ruta /similar/:exerciseId debe definirse ANTES de /:exerciseId
// para evitar que Express interprete 'similar' como un exerciseId

// Obtener ejercicios similares por nombre (para uso desde workout, donde no hay Firestore ID)
router.get('/exercises/similar', VerifiToken.appCheckVerification, exercisesController.getSimilarExercisesByName)

// Obtener ejercicios similares por Firestore ID
router.get('/exercises/similar/:exerciseId', VerifiToken.appCheckVerification, exercisesController.getSimilarExercises)

// Obtener ejercicio por ID
router.get('/exercises/:exerciseId', VerifiToken.appCheckVerification, exercisesController.getExerciseById)

export default router
