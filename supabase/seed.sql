-- =============================================================================
-- LinguaHe — Seed Data
-- Phase 5.1 — Initial content for development and testing
-- =============================================================================
-- Run AFTER schema.sql.
-- Safe to run multiple times: all inserts use ON CONFLICT DO NOTHING.
-- IDs are hardcoded UUIDs so that:
--   1. They're stable across re-runs (no duplicate rows)
--   2. Frontend mock data can reference the same IDs
--   3. Unit tests can assert on known values
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TOPIC: Food & Restaurants
-- ---------------------------------------------------------------------------
INSERT INTO public.topics (
  id, slug, title_en, title_he, description_he,
  icon_emoji, order_index, min_level
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'food-restaurants',
  'Food & Restaurants',
  'אוכל ומסעדות',
  'למד מילים חיוניות לסיטואציות אוכל ומסעדות',
  '🍽️',
  2,   -- Second in the lesson browser (after Greetings)
  1    -- Available from Level 1
)
ON CONFLICT (id) DO NOTHING;

-- Greetings topic (stub — not fully seeded in Phase 5.1)
INSERT INTO public.topics (
  id, slug, title_en, title_he, description_he,
  icon_emoji, order_index, min_level
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  'greetings',
  'Greetings',
  'ברכות ושיחה יומיומית',
  'מילים ראשונות לשיחה יומיומית',
  '👋',
  1,   -- First in the browser
  1
)
ON CONFLICT (id) DO NOTHING;

-- Travel topic (locked until Level 3)
INSERT INTO public.topics (
  id, slug, title_en, title_he, description_he,
  icon_emoji, order_index, min_level
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  'travel',
  'Travel & Transport',
  'נסיעות ותחבורה',
  'מילים לנסיעות, שדה תעופה ותחבורה ציבורית',
  '✈️',
  3,
  2    -- Requires Level 2 (Explorer)
)
ON CONFLICT (id) DO NOTHING;

-- Work topic (locked until Level 4)
INSERT INTO public.topics (
  id, slug, title_en, title_he, description_he,
  icon_emoji, order_index, min_level
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  'work-business',
  'Work & Business',
  'עבודה ועסקים',
  'אנגלית עסקית ומקצועית',
  '💼',
  4,
  4    -- Requires Level 4 (Speaker)
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- LESSON: At the Restaurant (the core Phase 2/3 lesson)
-- ---------------------------------------------------------------------------
INSERT INTO public.lessons (
  id, topic_id, slug,
  title_en, title_he, description_he,
  difficulty, estimated_minutes, xp_reward, order_index
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',  -- food-restaurants topic
  'at-the-restaurant',
  'At the Restaurant',
  'במסעדה',
  'מילים בסיסיות שתצטרך כשתאכל במסעדה דוברת אנגלית',
  1,   -- Beginner difficulty
  5,   -- Estimated 5 minutes
  15,  -- 15 XP for completion
  1    -- First lesson in the topic
)
ON CONFLICT (id) DO NOTHING;

-- Second lesson in food topic (stub for progression)
INSERT INTO public.lessons (
  id, topic_id, slug,
  title_en, title_he, description_he,
  difficulty, estimated_minutes, xp_reward, order_index
) VALUES (
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'food-and-drinks',
  'Food & Drinks',
  'אוכל ושתייה',
  'סוגי אוכל ושתייה נפוצים באנגלית',
  1,
  5,
  15,
  2
)
ON CONFLICT (id) DO NOTHING;

-- Ordering food (slightly harder)
INSERT INTO public.lessons (
  id, topic_id, slug,
  title_en, title_he, description_he,
  difficulty, estimated_minutes, xp_reward, order_index
) VALUES (
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'ordering-food',
  'Ordering Food',
  'הזמנת אוכל',
  'משפטים שלמים להזמנת אוכל ושתייה',
  2,   -- Intermediate
  7,
  20,
  3
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- LESSON WORDS: At the Restaurant (8 words — matches Phase 2 mock data)
-- IDs are stable so the frontend services.ts can reference them directly.
-- ---------------------------------------------------------------------------

INSERT INTO public.lesson_words (
  id, lesson_id,
  english_word, hebrew_translation, transliteration,
  example_sentence_en, example_sentence_he,
  image_emoji, order_index
) VALUES
  -- 1. Menu
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Menu',
    'תַּפְרִיט',
    'tafrit',
    'Can I see the menu, please?',
    'אפשר לראות את התפריט, בבקשה?',
    '📋',
    1
  ),
  -- 2. Water
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Water',
    'מַיִם',
    'mayim',
    'A glass of water, please.',
    'כוס מים, בבקשה.',
    '💧',
    2
  ),
  -- 3. Bread
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Bread',
    'לֶחֶם',
    'lekhem',
    'The bread here is delicious.',
    'הלחם כאן טעים מאוד.',
    '🍞',
    3
  ),
  -- 4. Table
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000001',
    'Table',
    'שׁוּלְחָן',
    'shulkhan',
    'We have a table for two.',
    'יש לנו שולחן לשניים.',
    '🪑',
    4
  ),
  -- 5. Waiter
  (
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000001',
    'Waiter',
    'מֶלְצַר',
    'meltzar',
    'Excuse me, waiter!',
    'סליחה, מלצר!',
    '🧑‍🍳',
    5
  ),
  -- 6. Bill
  (
    '30000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000001',
    'Bill',
    'חֶשְׁבּוֹן',
    'kheshbon',
    'Can we have the bill, please?',
    'אפשר לקבל את החשבון, בבקשה?',
    '🧾',
    6
  ),
  -- 7. I would like
  (
    '30000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000001',
    'I would like',
    'אֲנִי רוֹצֶה',
    'ani rotze',
    'I would like the pasta, please.',
    'אני רוצה את הפסטה, בבקשה.',
    '🙋',
    7
  ),
  -- 8. Thank you
  (
    '30000000-0000-0000-0000-000000000008',
    '20000000-0000-0000-0000-000000000001',
    'Thank you',
    'תּוֹדָה',
    'toda',
    'Thank you very much!',
    'תודה רבה!',
    '🙏',
    8
  )
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- ACHIEVEMENTS (5 initial definitions)
-- Condition types match the achievement_condition ENUM in schema.sql
-- ---------------------------------------------------------------------------

INSERT INTO public.achievements (
  id, slug,
  title_he, description_he,
  emoji,
  condition_type, condition_value,
  order_index, xp_bonus
) VALUES
  -- 1. First lesson completed
  (
    '40000000-0000-0000-0000-000000000001',
    'first-lesson',
    'שיעור ראשון',
    'השלמת את השיעור הראשון שלך — כל הכבוד!',
    '🎓',
    'lessons_completed',
    1,
    1,
    5   -- 5 XP bonus on unlock
  ),
  -- 2. 7-day streak
  (
    '40000000-0000-0000-0000-000000000002',
    'streak-7',
    'שבוע ברציפות',
    'למדת 7 ימים ברצף — שמור על הקצב!',
    '🔥',
    'streak_days',
    7,
    2,
    50  -- 50 XP bonus on unlock
  ),
  -- 3. 100 words learned
  (
    '40000000-0000-0000-0000-000000000003',
    'words-100',
    '100 מילים',
    'למדת 100 מילים באנגלית — אוצר מילים מרשים!',
    '📚',
    'words_learned',
    100,
    3,
    25
  ),
  -- 4. First perfect quiz
  (
    '40000000-0000-0000-0000-000000000004',
    'perfect-quiz',
    'חידון מושלם',
    'קיבלת 100% בחידון — מושלם!',
    '⭐',
    'perfect_quizzes',
    1,
    4,
    20
  ),
  -- 5. Reach Level 2
  (
    '40000000-0000-0000-0000-000000000005',
    'level-2',
    'עליית רמה',
    'הגעת לרמה 2 — חוקר! הדרך לפסגה ארוכה אבל מתגמלת.',
    '⬆️',
    'level_reached',
    2,
    5,
    15
  )
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- Run these after seeding to confirm the data is correct.
-- Comment out before running in production.
-- ---------------------------------------------------------------------------

/*
-- Check topic count
SELECT COUNT(*) AS topic_count FROM public.topics;  -- Expect: 4

-- Check lesson count
SELECT COUNT(*) AS lesson_count FROM public.lessons;  -- Expect: 3

-- Check word count per lesson
SELECT
  l.title_en,
  COUNT(w.id) AS word_count
FROM public.lessons l
LEFT JOIN public.lesson_words w ON w.lesson_id = l.id
GROUP BY l.id, l.title_en
ORDER BY l.title_en;
-- Expect: At the Restaurant → 8, others → 0

-- Check achievement count
SELECT COUNT(*) AS achievement_count FROM public.achievements;  -- Expect: 5

-- Verify RLS: this query should return results only for the authenticated user
-- (Run as an authenticated user, not service_role)
SELECT COUNT(*) FROM public.profiles;  -- Should return 1 (own row only)

-- Test level calculation function
SELECT
  public.calculate_level(0)    AS level_at_0_xp,    -- Expect: 1
  public.calculate_level(99)   AS level_at_99_xp,   -- Expect: 1
  public.calculate_level(100)  AS level_at_100_xp,  -- Expect: 2
  public.calculate_level(299)  AS level_at_299_xp,  -- Expect: 2
  public.calculate_level(300)  AS level_at_300_xp,  -- Expect: 3
  public.calculate_level(6350) AS level_at_max_xp;  -- Expect: 8
*/

-- =============================================================================
-- END OF SEED
-- =============================================================================
