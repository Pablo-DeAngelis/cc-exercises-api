import { getExerciseCache } from '../data/exerciseCache.js'

// Pesos del algoritmo de similitud (max 100 pts)
const SIMILARITY_WEIGHTS = {
  target_muscle_group: 40,
  movement_patterns: 20,
  primary_equipment: 15,
  difficulty_level: 10,
  exercise_classification: 8,
  laterality: 4,
  planes_of_motion: 3
}

const SIMILARITY_MIN_SCORE = 40

/**
 * Calcula el score de similitud entre dos ejercicios usando Weighted Field Scoring.
 * @param {Object} reference - Ejercicio de referencia
 * @param {Object} candidate - Ejercicio candidato
 * @returns {number} Score de similitud (0-100)
 */
const calculateSimilarityScore = (reference, candidate) => {
  let score = 0
  for (const [field, weight] of Object.entries(SIMILARITY_WEIGHTS)) {
    const refValue = reference[field]
    const candValue = candidate[field]
    if (
      refValue !== undefined &&
      refValue !== null &&
      candValue !== undefined &&
      candValue !== null &&
      refValue === candValue
    ) {
      score += weight
    }
  }
  return score
}

/**
 * Obtener ejercicio por ID desde el cache
 * @route GET /api/exercises/:exerciseId
 */
export const getExerciseById = async (req, res) => {
  const { exerciseId } = req.params

  if (!exerciseId || typeof exerciseId !== 'string' || exerciseId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Invalid parameter',
      details: 'exerciseId must be a non-empty string'
    })
  }

  try {
    const cache = getExerciseCache()
    const exercise = cache.find((ex) => ex.id === exerciseId)

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found',
        details: `No exercise with id '${exerciseId}' found in cache`
      })
    }

    return res.status(200).json({
      success: true,
      data: exercise
    })
  } catch (error) {
    console.error('Error getting exercise by id:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.CC_ENVIRONMENT === 'DEV' ? error.message : 'Please contact support'
    })
  }
}

/**
 * Parsea y valida los query params comunes de los endpoints de similitud
 * Retorna { limit, excludeSelf } o lanza un objeto { status, body } si hay error
 */
const parseSimilarityParams = (query) => {
  let limit = 10
  if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10)
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      return { error: { status: 400, body: { success: false, error: 'Invalid parameter', details: 'limit must be an integer between 1 and 50' } } }
    }
    limit = parsedLimit
  }

  let excludeSelf = true
  if (query.excludeSelf !== undefined) {
    const raw = query.excludeSelf
    if (raw !== 'true' && raw !== 'false') {
      return { error: { status: 400, body: { success: false, error: 'Invalid parameter', details: 'excludeSelf must be a boolean (true or false)' } } }
    }
    excludeSelf = raw === 'true'
  }

  return { limit, excludeSelf }
}

/**
 * Calcula similares dado un ejercicio de referencia ya resuelto
 */
const computeSimilar = (referenceExercise, cache, { limit, excludeSelf }) => {
  return cache
    .filter((ex) => {
      if (excludeSelf && ex.id === referenceExercise.id) return false
      if (excludeSelf && ex.exercise_name === referenceExercise.exercise_name && !referenceExercise.id) return false
      return true
    })
    .map((ex) => ({
      ...ex,
      similarity_score: calculateSimilarityScore(referenceExercise, ex)
    }))
    .filter((ex) => ex.similarity_score >= SIMILARITY_MIN_SCORE)
    .sort((a, b) => {
      if (b.similarity_score !== a.similarity_score) return b.similarity_score - a.similarity_score
      const nameA = (a.exercise_name || '').toLowerCase()
      const nameB = (b.exercise_name || '').toLowerCase()
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return 0
    })
    .slice(0, limit)
}

/**
 * Obtener ejercicios similares por nombre de ejercicio
 * @route GET /api/exercises/similar?name=...&limit=10&excludeSelf=true
 */
export const getSimilarExercisesByName = async (req, res) => {
  const { name } = req.query

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter',
      details: 'name query param is required'
    })
  }

  const params = parseSimilarityParams(req.query)
  if (params.error) return res.status(params.error.status).json(params.error.body)

  try {
    const cache = getExerciseCache()
    const nameLower = name.trim().toLowerCase()
    const referenceExercise = cache.find((ex) => (ex.exercise_name || '').toLowerCase() === nameLower)

    if (!referenceExercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found',
        details: `No exercise with name '${name}' found in cache`
      })
    }

    const candidates = computeSimilar(referenceExercise, cache, params)

    return res.status(200).json({
      success: true,
      referenceExercise,
      count: candidates.length,
      data: candidates
    })
  } catch (error) {
    console.error('Error getting similar exercises by name:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.CC_ENVIRONMENT === 'DEV' ? error.message : 'Please contact support'
    })
  }
}

/**
 * Obtener ejercicios similares a uno dado
 * @route GET /api/exercises/similar/:exerciseId
 * Query params: limit (1-50, default 10), excludeSelf (bool, default true)
 */
export const getSimilarExercises = async (req, res) => {
  const { exerciseId } = req.params

  if (!exerciseId || typeof exerciseId !== 'string' || exerciseId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Invalid parameter',
      details: 'exerciseId must be a non-empty string'
    })
  }

  const params = parseSimilarityParams(req.query)
  if (params.error) return res.status(params.error.status).json(params.error.body)

  try {
    const cache = getExerciseCache()
    const referenceExercise = cache.find((ex) => ex.id === exerciseId)

    if (!referenceExercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found',
        details: `No exercise with id '${exerciseId}' found in cache`
      })
    }

    const candidates = computeSimilar(referenceExercise, cache, params)

    return res.status(200).json({
      success: true,
      referenceExercise,
      count: candidates.length,
      data: candidates
    })
  } catch (error) {
    console.error('Error getting similar exercises:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.CC_ENVIRONMENT === 'DEV' ? error.message : 'Please contact support'
    })
  }
}
