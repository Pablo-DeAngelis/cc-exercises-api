// Idioma del usuario para el contenido que devuelve el backend.
// Contrato compartido con el resto de los servicios (docs/features/backend-i18n
// en coachconnect): users/{uid}.language ∈ SUPPORTED_LOCALES, y por request
// X-App-Locale / Accept-Language tienen prioridad sobre lo guardado.

export const SUPPORTED_LOCALES = Object.freeze(['en', 'es', 'it'])
export const DEFAULT_LOCALE = 'en'

// 'es-AR' → 'es', 'IT' → 'it'. Lo que no soportamos → null (el caller decide
// el fallback, así no se pisa una preferencia guardada con 'en').
export const normalizeLocale = (value) => {
  if (typeof value !== 'string') return null
  const code = value.trim().toLowerCase().split(/[-_]/)[0]
  return SUPPORTED_LOCALES.includes(code) ? code : null
}

// Primer idioma soportado de un Accept-Language ("it-IT,it;q=0.9,en;q=0.8"),
// respetando el orden de q.
export const parseAcceptLanguage = (header) => {
  if (typeof header !== 'string' || !header.trim()) return null
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const weight = q ? Number(q.slice(2)) : 1
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index }
    })
    .filter((entry) => entry.tag && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
  for (const { tag } of ranked) {
    const locale = normalizeLocale(tag)
    if (locale) return locale
  }
  return null
}

// Idioma pedido explícitamente en el request (header de la app), o null.
export const requestLocale = (req) =>
  normalizeLocale(req?.get?.('x-app-locale')) || parseAcceptLanguage(req?.get?.('accept-language'))

// Orden: request → guardado en users → fallback.
export const resolveLocale = ({ req, stored } = {}) =>
  requestLocale(req) || normalizeLocale(stored) || DEFAULT_LOCALE
