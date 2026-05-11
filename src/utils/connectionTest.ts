import { supabase } from '../lib/supabase'

interface TestResult {
  name:    string
  passed:  boolean
  message: string
  data?:   unknown
}

async function test(name: string, fn: () => Promise<unknown>): Promise<TestResult> {
  try {
    const data = await fn()
    return { name, passed: true, message: '✅ PASS', data }
  } catch (e) {
    return { name, passed: false, message: `❌ FAIL: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function runConnectionTest(): Promise<void> {
  console.group('[LinguaHe] Supabase Connection Test')
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL)

  const results: TestResult[] = []

  results.push(await test('Basic connectivity', async () => {
    const { error } = await supabase.from('topics').select('count' as '*', { count: 'exact', head: true })
    if (error) throw error
    return true
  }))

  results.push(await test('Fetch topics', async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, slug, title_en')
      .eq('is_active', true)
      .order('order_index')
    if (error) throw error
    if (!data || data.length === 0) throw new Error('No topics found — run seed.sql')
    return data
  }))

  results.push(await test('Fetch lessons', async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('id, slug, title_en')
      .eq('is_active', true)
    if (error) throw error
    if (!data || data.length === 0) throw new Error('No lessons found — run seed.sql')
    return data
  }))

  results.push(await test('Restaurant lesson words (expect 8)', async () => {
    const { data, error } = await supabase
      .from('lesson_words')
      .select('id, english_word, hebrew_translation')
      .eq('lesson_id', '20000000-0000-0000-0000-000000000001')
      .order('order_index')
    if (error) throw error
    if (!data || data.length !== 8) throw new Error(`Expected 8 words, got ${data?.length ?? 0}`)
    return data
  }))

  results.push(await test('Achievements (expect 5+)', async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('id, slug')
      .eq('is_active', true)
    if (error) throw error
    if (!data || data.length < 5) throw new Error(`Expected 5+, got ${data?.length ?? 0}`)
    return data
  }))

  results.push(await test('Auth session check', async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session ? `Logged in as ${session.user.email}` : 'Not logged in (anon — expected)'
  }))

  results.push(await test('calculate_level() RPC', async () => {
    const { data, error } = await supabase.rpc('calculate_level', { p_total_xp: 150 })
    if (error) throw error
    // data is typed as number per our DB functions definition
    const level = data as number
    if (level !== 2) throw new Error(`Expected level 2 for 150 XP, got ${level}`)
    return `calculate_level(150) = ${level}`
  }))

  results.push(await test('RLS: anon cannot read profiles', async () => {
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error) throw error
    if (data && data.length > 0) throw new Error('RLS VIOLATION: anon can read profiles!')
    return 'Anon = 0 rows ✅'
  }))

  console.log('\n📋 Results:')
  results.forEach(r => {
    console.log(`  ${r.message}  ${r.name}`)
    if (r.data && r.passed) console.log('    Data:', r.data)
  })

  const passed = results.filter(r => r.passed).length
  console.log(`\n🏁 ${passed}/${results.length} tests passed`)

  if (passed === results.length) {
    console.log('🎉 All tests passed!')
  } else {
    console.warn('⚠️  Some tests failed.')
    console.log('1. Check .env\n2. Run schema.sql\n3. Run seed.sql\n4. Restart dev server')
  }

  console.groupEnd()
}

export async function quickCheck(): Promise<void> {
  console.log('[LinguaHe] Quick check...')
  const { data, error } = await supabase
    .from('topics')
    .select('slug, title_en')
    .eq('is_active', true)
  if (error) { console.error('❌ Failed:', error.message); return }
  console.log('✅ Connected. Topics:', (data ?? []).map((t: { slug: string }) => t.slug).join(', '))
}
