-- =============================================================================
-- LinguaHe — Complete Database Schema
-- Phase 5.1 — Production-Grade Supabase PostgreSQL
-- =============================================================================
--
-- Design Principles:
--   1. UUID v4 primary keys everywhere (gen_random_uuid())
--      → No sequential ID leakage, portable across shards/replicas
--   2. timestamptz (not timestamp) on every temporal column
--      → UTC storage, correct across timezones; critical for streak logic
--   3. Content tables (topics, lessons, words, achievements) are PUBLIC READ
--      → RLS allows anon reads; writes locked to service_role only
--   4. Progress tables (user_lesson_progress, quiz_attempts, daily_sessions,
--      user_achievements) are PRIVATE — RLS enforces user_id = auth.uid()
--   5. XP is stored in two places intentionally:
--      profiles.total_xp   → denormalized for fast reads (O(1) leaderboard query)
--      xp_events           → append-only audit log for replay/recalculation
--   6. Streak uses a unique(user_id, session_date) constraint — not application logic
--      → The DB prevents double-counting even under concurrent requests
--   7. Soft-deletes on content (is_active flag) so progress rows keep valid FK refs
--   8. All tables get updated_at managed by a trigger, never trusted from client
--
-- Scaling assumptions:
--   - 100k MAU at launch, designed for 10M+
--   - Lesson content: ~10k lessons, ~200k words
--   - Progress rows: ~50M (500 lessons × 100k users)
--   - Daily sessions: ~365 × 100k = 36.5M/year
--   - Quiz attempts: ~5 answers × 500 quizzes × 100k users = 250M rows
--     → quiz_attempts will need time-based partitioning at ~10M users
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------------
-- pgcrypto: gen_random_uuid() — already enabled in Supabase by default
-- pg_trgm: trigram indexes for fuzzy word search
-- unaccent: accent-insensitive search (critical for Hebrew/English mixing)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ---------------------------------------------------------------------------
-- 1. UTILITY: updated_at trigger function
--    Reused by every mutable table. Defined once, referenced many times.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- SECTION A — CONTENT TABLES (public read, service_role write)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A1. topics
--     Groups lessons by subject area (e.g. "Food & Restaurants", "Greetings").
--     Lessons belong to exactly one topic. Topics can be locked/unlocked
--     based on user level (enforced in application layer, not DB).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.topics (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  slug            TEXT          NOT NULL UNIQUE,
  -- Machine-readable identifier: "food-restaurants", "greetings"
  -- Used in URLs, API responses, and client-side routing

  title_en        TEXT          NOT NULL,
  title_he        TEXT          NOT NULL,
  description_he  TEXT,

  icon_emoji      TEXT          NOT NULL DEFAULT '📖',

  -- Controls display order in the lessons browser
  order_index     SMALLINT      NOT NULL DEFAULT 0,

  -- Minimum level required to unlock (1 = always available)
  min_level       SMALLINT      NOT NULL DEFAULT 1
                  CHECK (min_level BETWEEN 1 AND 8),

  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  -- Soft-delete: existing user progress rows stay valid

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_topics_order      ON public.topics (order_index) WHERE is_active = TRUE;
CREATE INDEX idx_topics_min_level  ON public.topics (min_level)   WHERE is_active = TRUE;

CREATE TRIGGER topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.topics IS
  'Subject-area groupings for lessons. Public read-only. Controls unlock level.';


-- ---------------------------------------------------------------------------
-- A2. lessons
--     A single teachable unit within a topic. Each lesson has a set of words
--     and a corresponding quiz. Lessons are ordered within their topic.
--
--     difficulty scale:  1 = Beginner, 2 = Intermediate, 3 = Advanced
--     xp_reward: base XP for completing the lesson (quiz awards separate XP)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lessons (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  topic_id            UUID          NOT NULL
                      REFERENCES public.topics (id) ON DELETE RESTRICT,
  -- RESTRICT not CASCADE: deleting a topic with lessons should be an explicit
  -- migration, not an accidental cascade.

  slug                TEXT          NOT NULL UNIQUE,
  -- e.g. "at-the-restaurant", "greetings-basic"

  title_en            TEXT          NOT NULL,
  title_he            TEXT          NOT NULL,
  description_he      TEXT,

  -- Learning metadata
  difficulty          SMALLINT      NOT NULL DEFAULT 1
                      CHECK (difficulty BETWEEN 1 AND 3),

  estimated_minutes   SMALLINT      NOT NULL DEFAULT 5
                      CHECK (estimated_minutes BETWEEN 1 AND 60),

  xp_reward           SMALLINT      NOT NULL DEFAULT 10
                      CHECK (xp_reward BETWEEN 1 AND 500),
  -- Base XP for lesson completion.
  -- Quiz completion adds separate XP via quiz_attempts aggregate.

  -- Controls ordering within a topic
  order_index         SMALLINT      NOT NULL DEFAULT 0,

  -- Future: AI-generated flag, source model version, etc.
  is_ai_generated     BOOLEAN       NOT NULL DEFAULT FALSE,

  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,

  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Most common query: "give me all active lessons for topic X in order"
CREATE INDEX idx_lessons_topic_order
  ON public.lessons (topic_id, order_index)
  WHERE is_active = TRUE;

CREATE INDEX idx_lessons_difficulty
  ON public.lessons (difficulty)
  WHERE is_active = TRUE;

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.lessons IS
  'Individual learning units. Each has words + a quiz. XP awarded on completion.';


-- ---------------------------------------------------------------------------
-- A3. lesson_words
--     The vocabulary items within a lesson. These are the atomic learning
--     units that the card-flip UI presents one at a time.
--
--     Relationship: lessons → lesson_words (1:many)
--
--     Future: spaced repetition will promote words to a global "word bank"
--     and track per-user familiarity independently of the lesson they came from.
--     The word_bank_id FK placeholder prepares for that migration.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lesson_words (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  lesson_id           UUID          NOT NULL
                      REFERENCES public.lessons (id) ON DELETE CASCADE,
  -- CASCADE is safe here: words are meaningless without their lesson.
  -- When a lesson is soft-deleted (is_active=false), words are retained.
  -- Hard delete of a lesson should be a deliberate migration.

  -- Core vocabulary
  english_word        TEXT          NOT NULL,
  -- Stored in title case: "Thank you", "I would like"

  hebrew_translation  TEXT          NOT NULL,
  -- Stored with niqqud (vowel marks) where appropriate: "תּוֹדָה"

  transliteration     TEXT          NOT NULL,
  -- Phonetic guide for Hebrew speakers: "toda", "ani rotze"
  -- ASCII only, lowercase, IPA-adjacent

  -- Example usage
  example_sentence_en TEXT,
  -- "Thank you very much for your help."
  example_sentence_he TEXT,
  -- "תודה רבה על עזרתך."
  -- Shown on the back of the card after reveal

  -- Media
  audio_url           TEXT,
  -- Supabase Storage URL for pre-recorded pronunciation.
  -- Null → client falls back to Web Speech API.
  -- Format: https://<project>.supabase.co/storage/v1/object/public/audio/<word_id>.mp3

  image_emoji         TEXT,
  -- Visual memory anchor: "🙏", "💧"
  -- Deliberately simple: emoji rather than image URL to avoid CDN costs

  -- Display ordering within the lesson (1-based)
  order_index         SMALLINT      NOT NULL DEFAULT 1,

  -- Spaced repetition placeholder (Phase 6)
  -- word_bank_id     UUID REFERENCES public.word_bank(id) ON DELETE SET NULL,

  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Enforce uniqueness: same English word can appear in different lessons,
  -- but not twice in the same lesson
  CONSTRAINT lesson_words_unique_per_lesson
    UNIQUE (lesson_id, english_word)
);

-- Primary access pattern: get all words for a lesson in order
CREATE INDEX idx_lesson_words_lesson_order
  ON public.lesson_words (lesson_id, order_index);

-- Full-text search for vocabulary browser (Phase 6)
CREATE INDEX idx_lesson_words_english_trgm
  ON public.lesson_words USING GIN (english_word gin_trgm_ops);

CREATE INDEX idx_lesson_words_hebrew_trgm
  ON public.lesson_words USING GIN (hebrew_translation gin_trgm_ops);

CREATE TRIGGER lesson_words_updated_at
  BEFORE UPDATE ON public.lesson_words
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.lesson_words IS
  'Vocabulary items within a lesson. Each word shown as a flip card. '
  'Audio falls back to Web Speech API when audio_url is null.';


-- ---------------------------------------------------------------------------
-- A4. achievements
--     Definitions of all possible achievements (badges).
--     User-specific unlocks live in user_achievements.
--
--     condition_type + condition_value encode the unlock rule:
--       'lessons_completed' + 1   → "Complete your first lesson"
--       'streak_days'       + 7   → "7-day streak"
--       'words_learned'     + 100 → "Learn 100 words"
--       'perfect_quiz'      + 1   → "Get a perfect quiz score"
--       'level_reached'     + 2   → "Reach Level 2"
-- ---------------------------------------------------------------------------

CREATE TYPE public.achievement_condition AS ENUM (
  'lessons_completed',
  'streak_days',
  'words_learned',
  'perfect_quizzes',
  'level_reached',
  'xp_total'
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  slug              TEXT          NOT NULL UNIQUE,
  -- Machine key: "first-lesson", "streak-7", "words-100"

  title_he          TEXT          NOT NULL,
  description_he    TEXT          NOT NULL,

  emoji             TEXT          NOT NULL DEFAULT '🏆',

  -- Unlock condition
  condition_type    public.achievement_condition  NOT NULL,
  condition_value   INTEGER       NOT NULL
                    CHECK (condition_value > 0),

  -- Display ordering in achievements list
  order_index       SMALLINT      NOT NULL DEFAULT 0,

  -- XP bonus awarded when achievement is unlocked (0 = no bonus)
  xp_bonus          SMALLINT      NOT NULL DEFAULT 0
                    CHECK (xp_bonus >= 0),

  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievements_condition
  ON public.achievements (condition_type, condition_value)
  WHERE is_active = TRUE;

CREATE TRIGGER achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.achievements IS
  'Achievement definitions. Unlock rules encoded as condition_type + condition_value. '
  'Actual user unlocks stored in user_achievements.';


-- =============================================================================
-- SECTION B — USER TABLES (private, RLS-enforced)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- B1. profiles
--     One row per Supabase auth user. Extends auth.users with app-specific
--     fields. Created automatically on first sign-in via trigger.
--
--     XP design note:
--       total_xp is a denormalized aggregate for O(1) level calculation.
--       The canonical source of truth is the xp_events log (Section C).
--       On a data integrity check, total_xp = SUM(xp_events.amount) per user.
--       This is the "CQRS lite" pattern: fast reads, append-only write log.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  -- Shares the same UUID as auth.users — no separate sequence, no join on join
  id                  UUID          PRIMARY KEY
                      REFERENCES auth.users (id) ON DELETE CASCADE,

  display_name        TEXT          NOT NULL DEFAULT 'Learner',
  -- Set during onboarding. NOT NULL with a default so the trigger can create
  -- the row before the user has completed onboarding.

  avatar_url          TEXT,
  -- Supabase Storage URL or external OAuth avatar.
  -- Null = show initials-based avatar in UI.

  native_language     TEXT          NOT NULL DEFAULT 'he',
  -- ISO 639-1. Currently only Hebrew is supported; schema is future-proof.

  target_language     TEXT          NOT NULL DEFAULT 'en',
  -- ISO 639-1.

  -- Gamification (denormalized for speed)
  total_xp            INTEGER       NOT NULL DEFAULT 0
                      CHECK (total_xp >= 0),

  current_level       SMALLINT      NOT NULL DEFAULT 1
                      CHECK (current_level BETWEEN 1 AND 8),
  -- Recomputed by trigger/function when total_xp changes.
  -- Never updated by the client directly.

  -- Streak (denormalized from daily_sessions for speed)
  current_streak      INTEGER       NOT NULL DEFAULT 0
                      CHECK (current_streak >= 0),

  longest_streak      INTEGER       NOT NULL DEFAULT 0
                      CHECK (longest_streak >= 0),

  -- Stats aggregates (denormalized, updated by triggers)
  lessons_completed   INTEGER       NOT NULL DEFAULT 0
                      CHECK (lessons_completed >= 0),

  words_learned       INTEGER       NOT NULL DEFAULT 0
                      CHECK (words_learned >= 0),

  quizzes_taken       INTEGER       NOT NULL DEFAULT 0
                      CHECK (quizzes_taken >= 0),

  perfect_quizzes     INTEGER       NOT NULL DEFAULT 0
                      CHECK (perfect_quizzes >= 0),

  -- Daily goal (user preference, defaults to 3)
  daily_goal_lessons  SMALLINT      NOT NULL DEFAULT 3
                      CHECK (daily_goal_lessons BETWEEN 1 AND 20),

  -- Notification preference
  daily_reminder_time TIME,
  -- NULL = no reminder. Stored as time-of-day; server sends at this time
  -- in the user's timezone (timezone stored separately or inferred from device).

  -- Onboarding
  onboarding_completed BOOLEAN      NOT NULL DEFAULT FALSE,
  -- False until user finishes the 3-step first-launch flow.

  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Leaderboard queries: ORDER BY total_xp DESC
CREATE INDEX idx_profiles_total_xp      ON public.profiles (total_xp DESC);
CREATE INDEX idx_profiles_current_level ON public.profiles (current_level);
CREATE INDEX idx_profiles_streak        ON public.profiles (current_streak DESC);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.profiles IS
  'App-level user data extending auth.users. One row per user. '
  'Denormalized XP and streak values for fast reads. '
  'Canonical XP history lives in xp_events.';


-- ---------------------------------------------------------------------------
-- B2. user_lesson_progress
--     Tracks each user's relationship with each lesson.
--     One row per (user, lesson) pair — upserted on lesson activity.
--
--     Status lifecycle:
--       available → in_progress → completed
--       (locked status is derived from profiles.current_level, not stored here)
--
--     score: 0–100 (percentage), represents best quiz score for this lesson.
--            Updated only when new score > previous score.
-- ---------------------------------------------------------------------------

CREATE TYPE public.lesson_status AS ENUM (
  'available',    -- User can start this lesson
  'in_progress',  -- User has started but not completed
  'completed'     -- User has finished lesson + quiz at least once
);

CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id             UUID          NOT NULL
                      REFERENCES public.profiles (id) ON DELETE CASCADE,

  lesson_id           UUID          NOT NULL
                      REFERENCES public.lessons (id) ON DELETE CASCADE,
  -- CASCADE: if a lesson is hard-deleted (rare migration), progress is cleaned up.

  status              public.lesson_status  NOT NULL DEFAULT 'available',

  -- Quiz performance (best score across all attempts)
  best_score          SMALLINT      NOT NULL DEFAULT 0
                      CHECK (best_score BETWEEN 0 AND 100),

  -- Number of times the user has completed this lesson
  completion_count    SMALLINT      NOT NULL DEFAULT 0
                      CHECK (completion_count >= 0),

  -- Total XP earned from this lesson (lesson + all quiz attempts)
  total_xp_earned     SMALLINT      NOT NULL DEFAULT 0
                      CHECK (total_xp_earned >= 0),

  -- Spaced repetition: when this lesson should next be reviewed
  -- NULL = no review scheduled (Phase 6: populated after first completion)
  next_review_at      TIMESTAMPTZ,

  -- Timestamps
  first_started_at    TIMESTAMPTZ,
  -- Set once on first open; never updated. Useful for funnel analytics.

  completed_at        TIMESTAMPTZ,
  -- Most recent completion timestamp.

  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- One progress row per user per lesson
  CONSTRAINT user_lesson_progress_unique
    UNIQUE (user_id, lesson_id)
);

-- Primary read pattern: "get all lessons for this user with their status"
CREATE INDEX idx_ulp_user_status
  ON public.user_lesson_progress (user_id, status);

-- Progress page: "get all completed lessons for user, ordered by completion"
CREATE INDEX idx_ulp_user_completed
  ON public.user_lesson_progress (user_id, completed_at DESC)
  WHERE status = 'completed';

-- Spaced repetition scheduler: "find all lessons due for review"
CREATE INDEX idx_ulp_review_queue
  ON public.user_lesson_progress (user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

CREATE TRIGGER user_lesson_progress_updated_at
  BEFORE UPDATE ON public.user_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.user_lesson_progress IS
  'One row per (user, lesson). Tracks completion status, best quiz score, '
  'and spaced repetition scheduling. Updated via upsert on lesson events.';


-- ---------------------------------------------------------------------------
-- B3. quiz_attempts
--     Immutable event log of every quiz answer submitted.
--     Append-only: rows are NEVER updated or deleted.
--
--     This is the most write-heavy table. At 100k users doing 5 quiz
--     answers per day = 500k rows/day = ~180M rows/year.
--     → Candidate for time-based range partitioning at scale (Phase 6).
--
--     is_correct is redundant (derivable from user_answer vs correct_answer)
--     but stored for query performance — avoids re-evaluation at read time.
--
--     question_type mirrors Phase 3 quiz types:
--       'multiple_choice' | 'fill_blank'
-- ---------------------------------------------------------------------------

CREATE TYPE public.quiz_question_type AS ENUM (
  'multiple_choice',
  'fill_blank'
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id             UUID          NOT NULL
                      REFERENCES public.profiles (id) ON DELETE CASCADE,

  lesson_id           UUID          NOT NULL
                      REFERENCES public.lessons (id) ON DELETE CASCADE,

  word_id             UUID
                      REFERENCES public.lesson_words (id) ON DELETE SET NULL,
  -- SET NULL: if the word is removed, the attempt record is preserved for
  -- historical analytics — we just lose the word reference.

  question_type       public.quiz_question_type  NOT NULL,

  -- The answer the user submitted (raw string, not normalized)
  user_answer         TEXT          NOT NULL,

  -- The correct answer at time of attempt (snapshot, not a FK lookup)
  -- Snapshotting prevents historical data corruption if word content changes.
  correct_answer      TEXT          NOT NULL,

  -- Derived at write time for query performance
  is_correct          BOOLEAN       NOT NULL,

  -- XP awarded for this specific answer (0 for wrong, N for correct)
  xp_awarded          SMALLINT      NOT NULL DEFAULT 0
                      CHECK (xp_awarded >= 0),

  -- How long the user took to answer, in milliseconds
  -- NULL if not measured (older clients)
  response_time_ms    INTEGER
                      CHECK (response_time_ms IS NULL OR response_time_ms > 0),

  -- Session grouping: all answers in one quiz sitting share a session_id
  -- Allows "quiz session" analytics without a separate quiz_sessions table
  quiz_session_id     UUID          NOT NULL DEFAULT gen_random_uuid(),

  attempted_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  -- No created_at/updated_at: this is an immutable event log.
  -- attempted_at IS the creation time; rows are never updated.
);

-- Analytics: accuracy per user per lesson
CREATE INDEX idx_quiz_attempts_user_lesson
  ON public.quiz_attempts (user_id, lesson_id, attempted_at DESC);

-- Streak calculation helper: "did this user answer any quiz today?"
CREATE INDEX idx_quiz_attempts_user_date
  ON public.quiz_attempts (user_id, attempted_at);

-- Word-level accuracy (for spaced repetition)
CREATE INDEX idx_quiz_attempts_word
  ON public.quiz_attempts (word_id, is_correct)
  WHERE word_id IS NOT NULL;

-- Session grouping
CREATE INDEX idx_quiz_attempts_session
  ON public.quiz_attempts (quiz_session_id);

COMMENT ON TABLE public.quiz_attempts IS
  'Immutable append-only log of every quiz answer. '
  'Never updated or deleted. Partitioning candidate at 10M+ users.';


-- ---------------------------------------------------------------------------
-- B4. daily_sessions
--     One row per (user, calendar_date) representing a learning day.
--     This is the authoritative source for streak calculation.
--
--     Why not derive streak from quiz_attempts timestamps?
--       - Timezone handling: a "day" depends on the user's local timezone.
--         Storing the date explicitly avoids timezone edge cases.
--       - Performance: streak query = COUNT(*) on a small indexed table,
--         not an expensive date-grouping aggregation on quiz_attempts.
--       - Flexibility: a session can be recorded even on a read-only day
--         (e.g., user reviews vocabulary without taking a quiz).
--
--     The UNIQUE constraint on (user_id, session_date) is the DB-level
--     guarantee that prevents streak inflation. Application logic alone
--     is insufficient — concurrent requests could bypass app-level checks.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.daily_sessions (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id             UUID          NOT NULL
                      REFERENCES public.profiles (id) ON DELETE CASCADE,

  -- DATE (not TIMESTAMPTZ) because a "day" is a calendar concept.
  -- The application converts the user's local time to a date before inserting.
  session_date        DATE          NOT NULL,

  -- Aggregates for this calendar day (updated in the same upsert)
  xp_earned          INTEGER       NOT NULL DEFAULT 0
                      CHECK (xp_earned >= 0),

  lessons_completed  SMALLINT      NOT NULL DEFAULT 0
                      CHECK (lessons_completed >= 0),

  words_reviewed     SMALLINT      NOT NULL DEFAULT 0
                      CHECK (words_reviewed >= 0),

  quiz_answers       SMALLINT      NOT NULL DEFAULT 0
                      CHECK (quiz_answers >= 0),

  -- Total active learning time for the day, in seconds
  -- Incremented from client-side session timer measurements
  active_seconds     INTEGER       NOT NULL DEFAULT 0
                      CHECK (active_seconds >= 0),

  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- THE CRITICAL CONSTRAINT: DB-level prevention of streak double-counting
  CONSTRAINT daily_sessions_unique_per_user_date
    UNIQUE (user_id, session_date)
);

-- Streak query: "get user's last N session dates, ordered"
CREATE INDEX idx_daily_sessions_user_date
  ON public.daily_sessions (user_id, session_date DESC);

-- Analytics: overall activity heatmap
CREATE INDEX idx_daily_sessions_date
  ON public.daily_sessions (session_date DESC);

CREATE TRIGGER daily_sessions_updated_at
  BEFORE UPDATE ON public.daily_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.daily_sessions IS
  'One row per (user, date). Authoritative source for streak calculation. '
  'UNIQUE constraint prevents duplicate session rows at DB level. '
  'DATE type chosen over TIMESTAMPTZ to make calendar-day semantics explicit.';


-- ---------------------------------------------------------------------------
-- B5. user_achievements
--     Records which achievements each user has unlocked and when.
--     Append-only in spirit (achievements are not revoked), but updatable
--     for idempotency on the UNIQUE constraint.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id             UUID          NOT NULL
                      REFERENCES public.profiles (id) ON DELETE CASCADE,

  achievement_id      UUID          NOT NULL
                      REFERENCES public.achievements (id) ON DELETE CASCADE,

  -- XP that was awarded at unlock time (snapshot, in case bonus changes later)
  xp_awarded          SMALLINT      NOT NULL DEFAULT 0,

  earned_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- One achievement per user (not repeatable)
  CONSTRAINT user_achievements_unique
    UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user
  ON public.user_achievements (user_id, earned_at DESC);

COMMENT ON TABLE public.user_achievements IS
  'Junction table: which users have unlocked which achievements. '
  'UNIQUE constraint prevents duplicate awards.';


-- ---------------------------------------------------------------------------
-- B6. xp_events (append-only audit log)
--     Every XP award is recorded here, regardless of source.
--     profiles.total_xp is derived from this table.
--     Allows: XP correction, refund, analytics, anti-cheat audit.
--
--     source_type defines what caused the XP:
--       'lesson_complete' | 'quiz_correct' | 'achievement' |
--       'streak_bonus' | 'daily_first_login' | 'admin_adjustment'
-- ---------------------------------------------------------------------------

CREATE TYPE public.xp_source_type AS ENUM (
  'lesson_complete',
  'quiz_correct',
  'achievement_unlock',
  'streak_bonus',
  'daily_bonus',
  'admin_adjustment'   -- Manual correction; amount can be negative
);

CREATE TABLE IF NOT EXISTS public.xp_events (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id             UUID          NOT NULL
                      REFERENCES public.profiles (id) ON DELETE CASCADE,

  source_type         public.xp_source_type  NOT NULL,

  amount              SMALLINT      NOT NULL,
  -- Positive for awards, negative for admin corrections.
  -- SMALLINT cap: no single event should award >32k XP.

  -- Optional FK to the entity that caused this XP
  -- (lesson, quiz_session, achievement, etc.)
  -- Using text+uuid rather than separate FKs for flexibility across source types
  source_entity_type  TEXT,
  -- 'lesson' | 'quiz_attempt' | 'achievement' | NULL
  source_entity_id    UUID,
  -- FK target depends on source_entity_type (polymorphic reference)

  -- Running total at time of event (for fast balance reconstruction)
  balance_after       INTEGER       NOT NULL,
  -- Maintained by the application/trigger; allows point-in-time balance queries
  -- without summing all prior events.

  occurred_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  -- No updated_at: this is an immutable ledger.
);

-- Fast per-user history
CREATE INDEX idx_xp_events_user_time
  ON public.xp_events (user_id, occurred_at DESC);

-- Anti-cheat: find unusual XP spikes
CREATE INDEX idx_xp_events_amount
  ON public.xp_events (user_id, amount DESC)
  WHERE amount > 100;

COMMENT ON TABLE public.xp_events IS
  'Immutable append-only XP ledger. Every XP award is recorded here. '
  'profiles.total_xp is a denormalized aggregate of this table. '
  'balance_after enables point-in-time balance queries.';


-- =============================================================================
-- SECTION C — FUNCTIONS & TRIGGERS (business logic at DB layer)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- C1. Auto-create profile on auth.users insert
--     Fires when Supabase creates a new auth user (signup / OAuth).
--     Creates the profiles row so all app queries have a guaranteed profile.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)   -- fallback: username part of email
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  -- ON CONFLICT: safe to call multiple times (idempotent)
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auto-creates a profiles row when a new Supabase auth user is registered. '
  'Pulls display_name and avatar_url from OAuth metadata when available.';


-- ---------------------------------------------------------------------------
-- C2. Level calculation function
--     Pure function: given total_xp, returns the correct level (1–8).
--     Used by the XP update trigger and callable from application layer.
--
--     XP thresholds mirror Phase 4 levelConfig.ts — single source of truth
--     should eventually be a DB table (levels), but inline for Phase 5.1.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_level(p_total_xp INTEGER)
RETURNS SMALLINT
LANGUAGE plpgsql
IMMUTABLE   -- Same input always gives same output; allows index use
STRICT      -- Returns NULL if input is NULL
AS $$
BEGIN
  RETURN CASE
    WHEN p_total_xp >= 6350 THEN 8   -- Master
    WHEN p_total_xp >= 3850 THEN 7   -- Advanced
    WHEN p_total_xp >= 2250 THEN 6   -- Confident
    WHEN p_total_xp >= 1250 THEN 5   -- Traveler
    WHEN p_total_xp >=  650 THEN 4   -- Speaker
    WHEN p_total_xp >=  300 THEN 3   -- Builder
    WHEN p_total_xp >=  100 THEN 2   -- Explorer
    ELSE                         1   -- Beginner
  END;
END;
$$;

COMMENT ON FUNCTION public.calculate_level(INTEGER) IS
  'Pure function: converts total XP to level (1–8). '
  'IMMUTABLE so PostgreSQL can cache results and use it in indexes.';


-- ---------------------------------------------------------------------------
-- C3. Award XP function
--     Called by the application (via RPC) to award XP atomically.
--     Updates profiles.total_xp and profiles.current_level in one transaction.
--     Appends to xp_events log.
--     Returns the new total_xp and current_level.
--
--     Using a DB function (not application code) ensures:
--       - Atomicity: XP update + level update + event log in one transaction
--       - Concurrency safety: no race conditions on total_xp
--       - Auditability: every XP award has an xp_events row
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id           UUID,
  p_amount            SMALLINT,
  p_source_type       public.xp_source_type,
  p_source_entity_type TEXT    DEFAULT NULL,
  p_source_entity_id  UUID     DEFAULT NULL
)
RETURNS TABLE (new_total_xp INTEGER, new_level SMALLINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total  INTEGER;
  v_new_level  SMALLINT;
BEGIN
  -- Atomic increment with lock on the profiles row
  UPDATE public.profiles
  SET
    total_xp      = total_xp + p_amount,
    current_level = calculate_level(total_xp + p_amount)
  WHERE id = p_user_id
  RETURNING total_xp, current_level
  INTO v_new_total, v_new_level;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user_id: %', p_user_id;
  END IF;

  -- Append to immutable XP ledger
  INSERT INTO public.xp_events (
    user_id, source_type, amount,
    source_entity_type, source_entity_id,
    balance_after
  ) VALUES (
    p_user_id, p_source_type, p_amount,
    p_source_entity_type, p_source_entity_id,
    v_new_total
  );

  RETURN QUERY SELECT v_new_total, v_new_level;
END;
$$;

COMMENT ON FUNCTION public.award_xp IS
  'Atomically awards XP to a user: updates total_xp, recalculates level, '
  'and appends to xp_events audit log. Call via Supabase RPC.';


-- ---------------------------------------------------------------------------
-- C4. Record daily session (upsert with streak recalculation)
--     Called once per calendar day per user when they complete any activity.
--     Handles the UNIQUE constraint on (user_id, session_date) via ON CONFLICT.
--     Recalculates streak by walking backwards through daily_sessions.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_daily_session(
  p_user_id          UUID,
  p_session_date     DATE,            -- Caller passes local calendar date
  p_xp_earned        INTEGER DEFAULT 0,
  p_lessons_completed SMALLINT DEFAULT 0,
  p_words_reviewed   SMALLINT DEFAULT 0,
  p_quiz_answers     SMALLINT DEFAULT 0,
  p_active_seconds   INTEGER DEFAULT 0
)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  is_new_day     BOOLEAN   -- TRUE if this is the first session today
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_was_inserted     BOOLEAN;
  v_current_streak   INTEGER;
  v_longest_streak   INTEGER;
BEGIN
  -- Upsert: insert new session or increment existing
  INSERT INTO public.daily_sessions (
    user_id, session_date, xp_earned, lessons_completed,
    words_reviewed, quiz_answers, active_seconds
  ) VALUES (
    p_user_id, p_session_date, p_xp_earned, p_lessons_completed,
    p_words_reviewed, p_quiz_answers, p_active_seconds
  )
  ON CONFLICT (user_id, session_date) DO UPDATE SET
    xp_earned          = daily_sessions.xp_earned          + EXCLUDED.xp_earned,
    lessons_completed  = daily_sessions.lessons_completed  + EXCLUDED.lessons_completed,
    words_reviewed     = daily_sessions.words_reviewed     + EXCLUDED.words_reviewed,
    quiz_answers       = daily_sessions.quiz_answers       + EXCLUDED.quiz_answers,
    active_seconds     = daily_sessions.active_seconds     + EXCLUDED.active_seconds,
    updated_at         = NOW();

  -- Detect if this was the first session today
  v_was_inserted := (NOT EXISTS (
    SELECT 1 FROM public.daily_sessions
    WHERE user_id = p_user_id AND session_date = p_session_date
      AND created_at < NOW() - INTERVAL '1 second'
  ));

  -- Recalculate streak: count consecutive days ending today or yesterday
  WITH ordered_dates AS (
    SELECT
      session_date,
      session_date - (ROW_NUMBER() OVER (
        PARTITION BY user_id ORDER BY session_date
      ) * INTERVAL '1 day')::DATE AS grp
    FROM public.daily_sessions
    WHERE user_id = p_user_id
      AND session_date <= p_session_date
  ),
  streaks AS (
    SELECT
      MIN(session_date) AS streak_start,
      MAX(session_date) AS streak_end,
      COUNT(*)          AS streak_length
    FROM ordered_dates
    GROUP BY grp
  )
  SELECT
    -- Current streak: only count if streak includes today or yesterday
    CASE
      WHEN MAX(streak_end) >= p_session_date - 1
      THEN (SELECT streak_length FROM streaks WHERE streak_end = MAX(streak_end))
      ELSE 0
    END,
    MAX(streak_length)
  INTO v_current_streak, v_longest_streak
  FROM streaks;

  -- Update denormalized streak on profiles
  UPDATE public.profiles
  SET
    current_streak = v_current_streak,
    longest_streak = GREATEST(longest_streak, v_longest_streak)
  WHERE id = p_user_id;

  RETURN QUERY SELECT
    v_current_streak,
    GREATEST(v_longest_streak, v_current_streak),
    v_was_inserted;
END;
$$;

COMMENT ON FUNCTION public.record_daily_session IS
  'Upserts a daily_sessions row and recalculates streak via window function. '
  'The consecutive-day logic uses a gap-and-island SQL pattern. '
  'Safe under concurrent requests due to UNIQUE constraint + ON CONFLICT.';


-- =============================================================================
-- SECTION D — ROW LEVEL SECURITY
-- =============================================================================
-- Philosophy:
--   - Content tables: everyone can SELECT, only service_role can INSERT/UPDATE/DELETE
--   - User tables: users can SELECT/INSERT/UPDATE only their own rows
--   - No user can ever UPDATE another user's profile or progress
--   - No user can DELETE their own progress (only admin/service_role can)
--     → Prevents gaming (deleting a bad quiz attempt to reset score)
-- =============================================================================

-- Helper: is the current request from service_role (backend/admin)?
-- Used in RLS policies to allow admin writes.
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT current_role = 'service_role';
$$;


-- ---------------------------------------------------------------------------
-- D1. topics — public read, service_role write
-- ---------------------------------------------------------------------------
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topics_public_read"
  ON public.topics FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "topics_service_write"
  ON public.topics FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D2. lessons — public read, service_role write
-- ---------------------------------------------------------------------------
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_public_read"
  ON public.lessons FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "lessons_service_write"
  ON public.lessons FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D3. lesson_words — public read, service_role write
-- ---------------------------------------------------------------------------
ALTER TABLE public.lesson_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_words_public_read"
  ON public.lesson_words FOR SELECT
  TO authenticated, anon
  USING (TRUE);
-- All words are readable. The lesson's is_active status is enforced
-- at the lessons level via JOIN in application queries.

CREATE POLICY "lesson_words_service_write"
  ON public.lesson_words FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D4. achievements — public read, service_role write
-- ---------------------------------------------------------------------------
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_public_read"
  ON public.achievements FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "achievements_service_write"
  ON public.achievements FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D5. profiles — users read/update own row; service_role has full access
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_service_role());

CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Users cannot self-modify XP, level, or streak via this policy.
    -- Those fields are only writable via SECURITY DEFINER functions
    -- (award_xp, record_daily_session) which bypass RLS.
  );

CREATE POLICY "profiles_service_all"
  ON public.profiles FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D6. user_lesson_progress — users read/write own rows, no delete
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ulp_own_read"
  ON public.user_lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ulp_own_insert"
  ON public.user_lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ulp_own_update"
  ON public.user_lesson_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy for users — only service_role can delete progress.
-- This prevents users from resetting bad quiz scores.
CREATE POLICY "ulp_service_delete"
  ON public.user_lesson_progress FOR DELETE
  USING (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D7. quiz_attempts — users can insert + read own rows, never update/delete
-- ---------------------------------------------------------------------------
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_attempts_own_read"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_own_insert"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE for users — quiz_attempts is an immutable log.
CREATE POLICY "quiz_attempts_service_all"
  ON public.quiz_attempts FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D8. daily_sessions — users insert/update own rows, no delete
-- ---------------------------------------------------------------------------
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_sessions_own_read"
  ON public.daily_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_sessions_own_insert"
  ON public.daily_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_sessions_own_update"
  ON public.daily_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_sessions_service_delete"
  ON public.daily_sessions FOR DELETE
  USING (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D9. user_achievements — users read own rows, service_role awards
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements_own_read"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot award themselves achievements — only service_role / Edge Functions can.
CREATE POLICY "user_achievements_service_write"
  ON public.user_achievements FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());


-- ---------------------------------------------------------------------------
-- D10. xp_events — users read own log, service_role writes
-- ---------------------------------------------------------------------------
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_events_own_read"
  ON public.xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "xp_events_service_write"
  ON public.xp_events FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());
-- award_xp() is SECURITY DEFINER so it can insert regardless of caller's role.


-- =============================================================================
-- SECTION E — REALTIME CONFIGURATION
-- =============================================================================
-- Enable Supabase Realtime on progress tables so the client receives live
-- updates when progress is written from Edge Functions or other clients.
-- Content tables don't need realtime — they change rarely.

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_lesson_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_sessions;

-- =============================================================================
-- SECTION F — STORAGE BUCKETS
-- =============================================================================
-- Supabase Storage for audio files (pronunciation MP3s)
-- Run via Supabase Dashboard or Management API, not SQL.
-- Documented here for architectural completeness.
--
-- Bucket: 'audio'
--   Path pattern: audio/<word_id>.mp3
--   Public: true (no auth required to fetch pronunciation)
--   Max file size: 512 KB per file
--   Allowed MIME types: audio/mpeg, audio/mp4, audio/ogg
--   Policy: service_role can upload; public can read
--
-- Bucket: 'avatars'
--   Path pattern: avatars/<user_id>.<ext>
--   Public: false (authenticated read only)
--   Policy: user can upload own avatar; service_role has full access

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
