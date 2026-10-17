import { requestLocale, resolveLocale } from './locale.js'

const STORED_TTL_MS = 60_000
const STORED_MAX_ENTRIES = 5000

const storedCache = new Map()

// users/{uid}.language, cacheado un minuto para no leer Firestore en cada request.
const fetchStoredLanguage = async (uid) => {
  const { default: connection } = await import('../config/connection.js')
  const doc = await connection().collection('users').doc(uid).get()
  return doc.exists ? doc.data()?.language ?? null : null
}

// Si falla la lectura devolvemos null: el idioma es cosmético y no debe romper el endpoint.
export const getStoredLanguage = async (uid, fetcher = fetchStoredLanguage) => {
  if (!uid || typeof uid !== 'string') return null
  const hit = storedCache.get(uid)
  if (hit && hit.expires > Date.now()) return hit.value
  try {
    const value = await fetcher(uid)
    if (storedCache.size >= STORED_MAX_ENTRIES) storedCache.clear()
    storedCache.set(uid, { value, expires: Date.now() + STORED_TTL_MS })
    return value
  } catch (error) {
    console.error('Error reading users.language:', error)
    return null
  }
}

export const clearStoredLanguageCache = () => storedCache.clear()

// request (headers) → users/{uid}.language → 'en'. Con header presente no se lee users.
export const resolveRequestLocale = async (req, fetcher) => {
  if (requestLocale(req)) return resolveLocale({ req })
  const stored = await getStoredLanguage(req?.user?.user_id, fetcher)
  return resolveLocale({ req, stored })
}
