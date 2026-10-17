import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeLocale, parseAcceptLanguage, requestLocale, resolveLocale } from '../helpers/locale.js'
import { clearStoredLanguageCache, resolveRequestLocale } from '../helpers/requestLocale.js'
import { displayNameFor, findExerciseByName, withDisplayName } from '../helpers/displayName.js'

const fakeReq = (headers = {}, user) => ({
  get: (name) => headers[name.toLowerCase()],
  user
})

beforeEach(() => clearStoredLanguageCache())

test('normalizeLocale', () => {
  assert.equal(normalizeLocale('es-AR'), 'es')
  assert.equal(normalizeLocale(' IT '), 'it')
  assert.equal(normalizeLocale('fr'), null)
  assert.equal(normalizeLocale(undefined), null)
})

test('parseAcceptLanguage respects q order and skips unsupported', () => {
  assert.equal(parseAcceptLanguage('it-IT,it;q=0.9,en;q=0.8'), 'it')
  assert.equal(parseAcceptLanguage('fr,en;q=0.5,es;q=0.9'), 'es')
  assert.equal(parseAcceptLanguage('fr,de'), null)
  assert.equal(parseAcceptLanguage(''), null)
})

test('X-App-Locale wins over Accept-Language and stored', () => {
  const req = fakeReq({ 'x-app-locale': 'es', 'accept-language': 'it' })
  assert.equal(requestLocale(req), 'es')
  assert.equal(resolveLocale({ req, stored: 'it' }), 'es')
})

test('resolveRequestLocale: header present skips the users lookup', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return 'it' }
  const locale = await resolveRequestLocale(fakeReq({ 'x-app-locale': 'es' }, { user_id: 'u1' }), fetcher)
  assert.equal(locale, 'es')
  assert.equal(calls, 0)
})

test('resolveRequestLocale: falls back to users.language, cached, then en', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return 'it' }
  const req = fakeReq({}, { user_id: 'u1' })
  assert.equal(await resolveRequestLocale(req, fetcher), 'it')
  assert.equal(await resolveRequestLocale(req, fetcher), 'it')
  assert.equal(calls, 1)

  assert.equal(await resolveRequestLocale(fakeReq({}, { user_id: 'u2' }), async () => null), 'en')
  assert.equal(await resolveRequestLocale(fakeReq({}, { user_id: 'u3' }), async () => 'fr'), 'en')
  assert.equal(await resolveRequestLocale(fakeReq({}), async () => 'it'), 'en')
})

test('resolveRequestLocale: lookup failure falls back to en', async () => {
  const original = console.error
  console.error = () => {}
  try {
    const locale = await resolveRequestLocale(fakeReq({}, { user_id: 'u4' }), async () => { throw new Error('boom') })
    assert.equal(locale, 'en')
  } finally {
    console.error = original
  }
})

const squat = { id: 'a', exercise_name: 'Squat', name_i18n: { es: 'Sentadilla', it: 'Squat con bilanciere' }, target_muscle_group: 'legs' }
const plain = { id: 'b', exercise_name: 'Plank' }

test('displayNameFor falls back to exercise_name', () => {
  assert.equal(displayNameFor(squat, 'es'), 'Sentadilla')
  assert.equal(displayNameFor(squat, 'en'), 'Squat')
  assert.equal(displayNameFor(plain, 'it'), 'Plank')
  assert.equal(displayNameFor({ exercise_name: 'X', name_i18n: { es: '  ' } }, 'es'), 'X')
})

test('withDisplayName keeps every existing field', () => {
  const out = withDisplayName(squat, 'es')
  assert.deepEqual({ ...out, display_name: undefined }, { ...squat, display_name: undefined })
  assert.equal(out.exercise_name, 'Squat')
  assert.equal(out.display_name, 'Sentadilla')
})

test('findExerciseByName: English first, then localized names', () => {
  const clash = { id: 'c', exercise_name: 'Sentadilla' }
  const cache = [squat, plain, clash]
  assert.equal(findExerciseByName(cache, 'plank').id, 'b')
  assert.equal(findExerciseByName(cache, ' sentadilla ').id, 'c')
  assert.equal(findExerciseByName([squat, plain], 'sentadilla').id, 'a')
  assert.equal(findExerciseByName(cache, 'SQUAT CON BILANCIERE').id, 'a')
  assert.equal(findExerciseByName(cache, 'nope'), undefined)
})
