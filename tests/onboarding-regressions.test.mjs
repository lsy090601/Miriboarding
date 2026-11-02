import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { transformSync } from 'esbuild'
import { randomUUID } from 'node:crypto'

class OnboardingError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code }
}

function load(file, injected, names, jsx = false) {
  let source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8')
    .replace(/^import .*\r?\n/gm, '').replace(/export default /g, '').replace(/export /g, '')
  if (jsx) source = transformSync(source, { loader: 'jsx' }).code
  const context = vm.createContext({ console, Date, Map, Set, randomUUID, OnboardingError, ...injected })
  vm.runInContext(source + '\nglobalThis.result = {' + names.join(',') + '}', context)
  return context.result
}

function database(tables) {
  const writes = []
  return {
    tables, writes,
    from(table) {
      const filters = []; let operation = 'read'; let payload
      const query = {
        select() { return this }, order() { return this }, limit() { return this },
        eq(k, v) { filters.push(r => r[k] === v); return this },
        in(k, values) { filters.push(r => values.includes(r[k])); return this },
        insert(v) { operation = 'insert'; payload = v; return this },
        update(v) { operation = 'update'; payload = v; return this },
        execute(single) {
          const rows = tables[table] ?? []
          let found = rows.filter(r => filters.every(f => f(r)))
          if (operation === 'insert') {
            found = [{ id: randomUUID(), status: 'draft', ...payload }]; rows.push(...found)
          }
          if (operation === 'update') found.forEach(r => Object.assign(r, payload))
          if (operation !== 'read') writes.push({ table, operation, payload })
          return { data: single ? found[0] ?? null : found, error: null }
        },
        async single() { return this.execute(true) }, async maybeSingle() { return this.execute(true) },
        then(resolve, reject) { return Promise.resolve(this.execute(false)).then(resolve, reject) },
      }
      return query
    },
  }
}

test('student assignment keeps its original missions when the company publishes another plan', async () => {
  const assigned = { missions: [{ id: 'old-mission' }], job_title: 'Original role' }
  const db = database({ student_enrollment: [{ company_id: 'company', student_id: 'student', onboarding_snapshot: assigned }], company_onboarding: [{ company_id: 'company', missions: [{ id: 'new-mission' }] }] })
  const { getAssignedOnboarding } = load('server/src/services/onboardingVersions.service.js', { supabaseAdmin: db }, ['getAssignedOnboarding'])
  assert.equal(await getAssignedOnboarding('company', 'student'), assigned)
  await assert.rejects(getAssignedOnboarding('company', 'unregistered'), e => e.status === 404)
})

test('published plans reject edits; editing a draft never writes to the published plan', async () => {
  const db = database({ company_onboarding_versions: [
    { id: 'published', company_id: 'company', status: 'published' },
    { id: 'draft', company_id: 'company', status: 'draft' },
  ] })
  const { saveDraft } = load('server/src/services/onboardingVersions.service.js', { supabaseAdmin: db }, ['saveDraft'])
  await assert.rejects(saveDraft('company', 'published', { missions: [] }), e => e.status === 409)
  await saveDraft('company', 'draft', { job_title: 'Updated draft' })
  assert.equal(db.writes.length, 1)
  assert.equal(db.writes[0].table, 'company_onboarding_versions')
})

test('AI generation inserts a separate draft and converts temporary mission IDs to UUIDs', async () => {
  const db = database({ companies: [{ id: 'company', company_name: 'Stored company' }], company_onboarding_versions: [] })
  const service = load('server/src/services/onboarding.service.js', {
    supabaseAdmin: db, isNonEmptyString: v => typeof v === 'string' && !!v.trim(),
    versionError: e => e,
    generateOnboardingPlan: async () => ({ schedules: { day: [], week: [], month: [] }, missions: [{ id: 'ms-123', title: 'Task' }] }),
  }, ['generateOnboarding'])
  const result = await service.generateOnboarding({ companyId: 'company', jobTitle: 'Engineer', industry: 'Manufacturing', companyDescription: 'Video products', jobDescription: 'Test prototypes' })
  assert.equal(result.status, 'draft')
  assert.match(result.missions[0].id, /^[\da-f-]{36}$/)
  assert.deepEqual(db.writes.map(w => w.table), ['company_onboarding_versions'])
})

test('incomplete drafts and empty choice missions cannot be published', async () => {
  const row = { id: 'draft', company_id: 'company', status: 'draft', missions: [{ id: 'm', title: 'Task', description: 'Description', submissionType: 'choice', options: [] }], schedules: {} }
  const db = database({ company_onboarding_versions: [row] })
  let publishes = 0
  db.rpc = async () => { publishes++; return { data: { id: 'draft' } } }
  const { publishVersion } = load('server/src/services/onboardingVersions.service.js', { supabaseAdmin: db }, ['publishVersion'])
  await assert.rejects(publishVersion('company', 'draft'), e => e.status === 400)
  row.schedules = Object.fromEntries(['day', 'week', 'month'].map(p => [p, [{ time: '1', activity: 'Task' }]]))
  await assert.rejects(publishVersion('company', 'draft'), e => e.status === 400)
  assert.equal(publishes, 0)
  row.missions[0].options = ['A', 'B']
  await publishVersion('company', 'draft')
  assert.equal(publishes, 1)
})

test('submission accepts assigned old missions and rejects new-version and invalid choice content', async () => {
  const db = database({ student_enrollment: [{ id: 'enrollment', company_id: 'company', student_id: 'student' }], mission_submission: [] })
  const { submitMission } = load('server/src/services/onboarding.service.js', {
    supabaseAdmin: db, isNonEmptyString: v => typeof v === 'string' && !!v.trim(),
    getAssignedOnboarding: async () => ({ missions: [{ id: 'old', submissionType: 'choice', options: ['A', 'B'] }] }),
  }, ['submitMission'])
  await assert.rejects(submitMission('enrollment', 'new', 'A'), e => e.status === 404)
  await assert.rejects(submitMission('enrollment', 'old', 'C'), e => e.status === 400)
  await submitMission('enrollment', 'old', 'A')
  assert.equal(db.tables.mission_submission.length, 1)
})

test('real activity is recorded without submissions and throttled to once per minute', async () => {
  let now = 1_800_000_000_000
  class Clock extends Date { static now() { return now } }
  const db = database({ users: [{ id: 'student' }] })
  const { recordActivity } = load('server/src/services/activity.service.js', { Date: Clock, supabaseAdmin: db }, ['recordActivity'])
  await recordActivity('student'); await recordActivity('student')
  assert.equal(db.writes.length, 1)
  now += 61_000; await recordActivity('student')
  assert.equal(db.writes.length, 2)
  assert.equal(db.tables.users[0].last_seen_at, new Date(now).toISOString())
})

function missionHarness(submit) {
  const slots = []; let cursor = 0
  const createElement = (type, props, ...children) => ({ type, props: { ...props, children } })
  const mission = { id: 'mission', title: 'Text task', submissionType: 'text', completed: false }
  const deps = {
    React: { createElement }, useEffect() {},
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], v => { slots[index] = typeof v === 'function' ? v(slots[index]) : v }] },
    useNavigate: () => () => {}, useParams: () => ({ companyId: 'company', missionId: 'mission' }),
    useStudentOnboarding: () => ({ onboarding: { missions: [mission] }, enrollmentId: 'enrollment', isLoading: false }),
    api: { submitMission: submit }, styles: {},
    Banner: 'Banner', Nav: 'Nav', Button: 'Button', Input: 'Input', Radio: 'Radio', Dropzone: 'Dropzone',
  }
  const { MissionDetail } = load('src/pages/student/MissionDetail.jsx', deps, ['MissionDetail'], true)
  const render = () => { cursor = 0; return MissionDetail() }
  return { render }
}

function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined
  if (predicate(node)) return node
  for (const child of [node.props?.children ?? []].flat(Infinity)) {
    const match = find(child, predicate); if (match) return match
  }
}

test('failed submission keeps the form and text, shows an error, and succeeds only after retry', async () => {
  let fail = true
  const { render } = missionHarness(async () => { if (fail) throw new Error('Network unavailable') })
  find(render(), n => n.type === 'Input' && n.props.label).props.onChange({ target: { value: 'Keep this answer' } })
  await find(render(), n => n.type === 'form').props.onSubmit({ preventDefault() {} })
  const failed = render()
  assert.ok(find(failed, n => n.type === 'form'))
  assert.equal(find(failed, n => n.type === 'Input' && n.props.label).props.value, 'Keep this answer')
  assert.ok(find(failed, n => n.props.role === 'alert'))
  fail = false
  await find(render(), n => n.type === 'form').props.onSubmit({ preventDefault() {} })
  assert.equal(find(render(), n => n.type === 'form'), undefined)
  assert.ok(find(render(), n => n.type === 'p' && n.props.children.includes('Keep this answer')))
})

test('student loading queries existing enrollment and never tries company-only enrollment', async () => {
  const calls = []; let state; let effect
  const { useStudentOnboarding } = load('src/hooks/useStudentOnboarding.js', {
    useState: v => [v, value => { state = value }], useEffect: fn => { effect = fn }, getCurrentStudentId: () => 'student',
    api: {
      getEnrollment: async () => { calls.push('getEnrollment'); return { enrollmentId: 'enrollment', targetDate: '2026-11-16' } },
      getOnboarding: async () => ({ missions: [] }), listSubmissions: async () => ({ submissions: [] }),
      normalizeOnboardingResponse: () => ({ missions: [] }),
      enrollStudent: () => { throw Error('Must not call company-only registration') },
    },
  }, ['useStudentOnboarding'])
  useStudentOnboarding('company'); effect()
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(calls, ['getEnrollment'])
  assert.equal(state.isLoading, false)
  assert.equal(state.onboarding.targetDate, '2026-11-16')
})
