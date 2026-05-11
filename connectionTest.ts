import { supabase } from '../lib/supabase'

interface TestResult {
  name: string
  passed: boolean
  message: string
  data?: unknown
}

async function test(name: string, fn: () => Promise<unknown>): Promise<TestResult> {
  try {
    const data = await fn()
    return { name, passed: true, message: '✅ PASS', data }
  } catch (err) {
    return { name, passed: false, message: `❌ FAIL: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function runConnectionTest(): Promise<void> {
  console.group('[LinguaHe] Supabase Connection Test')
  console.log('Testing connection to:', import.meta.env.VITE_SUPABASE_URL)

  const results: TestResult[] = []

  results.push(await test('Basic connectivity', async () => {
    const { error } = await supabase.from('topics').select('count', { count: 'exact', head: true })
    if (error) throw error
    return true
  }))

  results.push(await test('Fetch topics', async () => {
    const { data, error } = await supabase.from('topics').select('id,slug,title_en').eq('is_active', true).order('order_index')
    if (error) throw error
    if (!data || data.length === 0) throw new Error('No topics found — run seed.sql')
    return data
  }))

  results.push(await test('Fetch lessons', async () => {
    const { data, error } = await supabase.from('lessons').select('id,slug,title_en').eq('is_active', true)
    if (error) throw error
    if (!data || data.length === 0) throw new Error('No lessons found — run seed.sql')
    return data
  }))

  results.push(await test('Fetch restaurant lesson words (expect 8)', async () => {
    const { data, error } = await supabase.from('lesson_words').select('id,english_word,hebrew_translation').eq('lesson_id', '20000000-0000-0000-0000-000000000001').order('order_index')
    if (error) throw error
    if (!data || data.length !== 8) throw new Error(`Expected 8 words, got ${data?.length ?? 0}`)
    return data
  }))

  results.push(await test('Fetch achievements (expect 5)', async () => {
    const { data, error } = await supabase.from('achievements').select('id,slug,title_he').eq('is_active', true)
    if (error) throw error
    if (!data || data.length < 5) throw new Error(`Expected 5+ achievements, got ${data?.length ?? 0}`)
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
    if (data !== 2) throw new Error(`Expected level 2 for 150 XP, got ${data}`)
    return `calculate_level(150) = ${data}`
  }))

  results.push(await test('RLS: anon cannot read profiles', async () => {
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error) throw error
    if (data && data.length > 0) throw new Error('RLS VIOLATION: anon can read profiles!')
    return 'Anon returns 0 rows ✅'
  }))

  console.log('\n📋 Test Results:')
  results.forEach(r => {
    console.log(`  ${r.message}  ${r.name}`)
    if (r.data && r.passed) console.log('    Data:', r.data)
  })

  const passed = results.filter(r => r.passed).length
  console.log(`\n🏁 ${passed}/${results.length} tests passed`)
  if (passed === results.length) {
    console.log('🎉 All tests passed! Supabase is connected and data is seeded correctly.')
  } else {
    console.warn('⚠️  Some tests failed. Check errors above.')
    console.log('Troubleshooting:')
    console.log('  1. Verify .env has correct values')
    console.log('  2. Run schema.sql in Supabase SQL Editor')
    console.log('  3. Run seed.sql in Supabase SQL Editor')
    console.log('  4. Restart dev server after changing .env')
  }

  console.groupEnd()
}

export async function quickCheck(): Promise<void> {
  console.log('[LinguaHe] Quick connection check...')
  const { data, error } = await supabase.from('topics').select('slug,title_en').eq('is_active', true)
  if (error) { console.error('❌ Connection failed:', error.message); return }
  console.log('✅ Connected. Topics:', data?.map(t => t.slug).join(', '))
}
