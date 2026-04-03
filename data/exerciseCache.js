import { collection, getDocs } from 'firebase/firestore'
import connection from '../config/connection.js'

const EXERCISE_CACHE_TTL_MS = parseInt(process.env.EXERCISE_CACHE_TTL_MS || '300000', 10)

let _cache = []
let _lastLoaded = 0

/**
 * Carga todos los ejercicios de la coleccion 'exercises' de Firestore
 * y los almacena en el cache en memoria.
 * @returns {Promise<number>} Cantidad de ejercicios cargados
 */
export const loadExerciseCache = async () => {
  try {
    const db = connection()
    const snapshot = await getDocs(collection(db, 'exercises'))
    const exercises = []
    snapshot.forEach((doc) => {
      exercises.push({ id: doc.id, ...doc.data() })
    })
    _cache = exercises
    _lastLoaded = Date.now()
    return exercises.length
  } catch (error) {
    console.error('Error loading exercise cache:', error)
    throw error
  }
}

/**
 * Retorna el cache actual de ejercicios.
 * Si el cache expiró, dispara una recarga en background (stale-while-revalidate)
 * y retorna los datos actuales sin esperar la recarga.
 * @returns {Array} Array de ejercicios del cache
 */
export const getExerciseCache = () => {
  const now = Date.now()
  const isExpired = _lastLoaded === 0 || (now - _lastLoaded) > EXERCISE_CACHE_TTL_MS

  if (isExpired) {
    // Dispara la recarga en background sin bloquear
    loadExerciseCache().catch((error) => {
      console.error('Background cache reload failed:', error)
    })
  }

  return _cache
}
