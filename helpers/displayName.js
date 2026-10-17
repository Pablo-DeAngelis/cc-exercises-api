import { SUPPORTED_LOCALES } from './locale.js'

const clean = (value) => (typeof value === 'string' && value.trim() ? value : null)

// exercise_name es el id canónico en inglés (la app matchea por él): nunca se toca.
// display_name es solo para mostrar: name_i18n[locale] || exercise_name.
export const displayNameFor = (exercise, locale) =>
  clean(exercise?.name_i18n?.[locale]) || exercise?.exercise_name

export const withDisplayName = (exercise, locale) => ({
  ...exercise,
  display_name: displayNameFor(exercise, locale)
})

// Primero coincidencia exacta con exercise_name (inglés, comportamiento previo);
// si no hay, se busca entre los name_i18n de cualquier idioma soportado.
export const findExerciseByName = (cache, name) => {
  const nameLower = name.trim().toLowerCase()
  const english = cache.find((ex) => (ex.exercise_name || '').toLowerCase() === nameLower)
  if (english) return english
  return cache.find((ex) =>
    SUPPORTED_LOCALES.some((loc) => (clean(ex.name_i18n?.[loc]) || '').trim().toLowerCase() === nameLower)
  )
}
