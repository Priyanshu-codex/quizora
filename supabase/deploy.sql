-- ==============================================================================
-- QUIZORA PLATFORM — COMPLETE ALL-IN-ONE SUPABASE DEPLOYMENT SCRIPT
-- Execute this entire file in your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with custom application role & profile info
-- ==============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'viewer', 'user')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 2. QUIZZES TABLE
-- Stores assessment definitions, settings, proctoring options, and live metrics
-- ==============================================================================
create table if not exists public.quizzes (
  id text primary key,
  title text not null,
  description text default '',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  duration integer not null default 15,
  question_count integer not null default 0,
  max_score integer not null default 0,
  passing_percentage integer not null default 60,
  max_attempts integer not null default 3,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  max_violations integer not null default 3,
  fullscreen_required boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 3. QUESTIONS TABLE
-- Stores rich questions with options, correct answers, order, and explanations
-- ==============================================================================
create table if not exists public.questions (
  id text primary key,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  text text not null,
  image text,
  type text not null default 'single' check (type in ('single', 'multiple', 'truefalse')),
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null,
  marks integer not null default 10,
  explanation text,
  order_num integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 4. ATTEMPTS TABLE
-- Stores user test sessions, scores, passing results, and proctoring violations
-- ==============================================================================
create table if not exists public.attempts (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  score integer not null default 0,
  max_score integer not null default 0,
  percentage numeric(5, 2) not null default 0,
  passed boolean not null default false,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  time_taken integer,
  violations jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'auto_submitted', 'abandoned')),
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 5. ATTEMPT ANSWERS TABLE
-- Stores granular per-question participant responses, review flags, and timing
-- ==============================================================================
create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id text not null references public.attempts(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  selected_answer jsonb,
  is_marked_for_review boolean not null default false,
  time_spent integer not null default 0,
  created_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

-- ==============================================================================
-- 6. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
create index if not exists idx_quizzes_status on public.quizzes(status);
create index if not exists idx_questions_quiz_id on public.questions(quiz_id);
create index if not exists idx_questions_order on public.questions(quiz_id, order_num);
create index if not exists idx_attempts_user_id on public.attempts(user_id);
create index if not exists idx_attempts_quiz_id on public.attempts(quiz_id);
create index if not exists idx_attempts_status on public.attempts(status);
create index if not exists idx_attempt_answers_attempt on public.attempt_answers(attempt_id);

-- ==============================================================================
-- 7. HELPER SECURITY DEFINER FUNCTIONS & RPCS
-- ==============================================================================
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$ language sql security definer;

create or replace function public.is_admin_or_viewer(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role in ('admin', 'viewer')
  );
$$ language sql security definer;

-- RPC function to increment quiz attempt count safely
create or replace function public.increment_quiz_attempt(quiz_id text)
returns void as $$
begin
  update public.quizzes
  set attempt_count = coalesce(attempt_count, 0) + 1
  where id = quiz_id;
end;
$$ language plpgsql security definer;

grant execute on function public.increment_quiz_attempt(text) to authenticated, anon;

-- ==============================================================================
-- 8. AUTOMATIC TRIGGERS (UPDATED_AT & NEW USER REGISTRATION)
-- ==============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace trigger set_quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create or replace trigger set_questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

-- Trigger to automatically create profile on Supabase auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

-- PROFILES POLICIES
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

-- QUIZZES POLICIES
drop policy if exists "Anyone authenticated can view published quizzes, admins/viewers view all" on public.quizzes;
drop policy if exists "Anyone can view published quizzes, admins/viewers view all" on public.quizzes;
create policy "Anyone can view published quizzes, admins/viewers view all"
  on public.quizzes for select
  to authenticated, anon
  using (status = 'published' or public.is_admin_or_viewer(auth.uid()));

create policy "Admins can insert quizzes"
  on public.quizzes for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "Admins can update quizzes"
  on public.quizzes for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can delete quizzes"
  on public.quizzes for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- QUESTIONS POLICIES
drop policy if exists "Users can view questions of available quizzes" on public.questions;
drop policy if exists "Anyone can view questions of published quizzes" on public.questions;
create policy "Anyone can view questions of published quizzes"
  on public.questions for select
  to authenticated, anon
  using (
    public.is_admin_or_viewer(auth.uid()) or
    exists (
      select 1 from public.quizzes q
      where q.id = questions.quiz_id and (q.status = 'published')
    )
  );

create policy "Admins can insert questions"
  on public.questions for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "Admins can update questions"
  on public.questions for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can delete questions"
  on public.questions for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- ATTEMPTS POLICIES
create policy "Users can view own attempts, admins/viewers view all"
  on public.attempts for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin_or_viewer(auth.uid()));

create policy "Users can insert own attempts"
  on public.attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own attempts"
  on public.attempts for update
  to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ATTEMPT ANSWERS POLICIES
create policy "Users can view answers of accessible attempts"
  on public.attempt_answers for select
  to authenticated
  using (
    public.is_admin_or_viewer(auth.uid()) or
    exists (
      select 1 from public.attempts a
      where a.id = attempt_answers.attempt_id and a.user_id = auth.uid()
    )
  );

create policy "Users can upsert answers for own attempts"
  on public.attempt_answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.attempts a
      where a.id = attempt_answers.attempt_id and a.user_id = auth.uid()
    )
  );

create policy "Users can update answers for own attempts"
  on public.attempt_answers for update
  to authenticated
  using (
    exists (
      select 1 from public.attempts a
      where a.id = attempt_answers.attempt_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.attempts a
      where a.id = attempt_answers.attempt_id and a.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 10. INITIAL SEED DATA (QUIZZES & QUESTIONS)
-- ==============================================================================

-- Demo Quizzes
insert into public.quizzes (
  id, title, description, difficulty, duration, question_count, max_score,
  passing_percentage, max_attempts, status, max_violations, fullscreen_required, attempt_count
) values
(
  'quiz-1',
  'Demo Quiz 1: Modern Web Engineering',
  'Test your knowledge of modern web development concepts including React, TypeScript, and Next.js.',
  'medium',
  15,
  15,
  150,
  60,
  3,
  'published',
  3,
  true,
  0
),
(
  'quiz-2',
  'Demo Quiz 2: Data Structures & Algorithms',
  'Core concepts of foundational data structures: arrays, linked lists, stacks, queues, trees, and algorithm complexity.',
  'hard',
  10,
  5,
  50,
  60,
  3,
  'published',
  3,
  true,
  0
)
on conflict (id) do update
  set title = excluded.title,
      description = excluded.description,
      difficulty = excluded.difficulty,
      duration = excluded.duration,
      question_count = excluded.question_count,
      max_score = excluded.max_score,
      passing_percentage = excluded.passing_percentage,
      status = excluded.status;

-- Demo Questions for Quiz 1 (Modern Web Engineering - 15 Questions)
insert into public.questions (
  id, quiz_id, text, type, options, correct_answer, marks, explanation, order_num
) values
(
  'q1-1', 'quiz-1',
  'Which hook in React is used to perform side effects in function components?',
  'single',
  '[{"id":"a","text":"useState"},{"id":"b","text":"useEffect"},{"id":"c","text":"useContext"},{"id":"d","text":"useReducer"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'useEffect allows you to perform side effects such as data fetching, subscriptions, or manually changing the DOM.',
  1
),
(
  'q1-2', 'quiz-1',
  'In Next.js App Router, what file convention defines a route segment''s UI that wraps child segments?',
  'single',
  '[{"id":"a","text":"page.tsx"},{"id":"b","text":"template.tsx"},{"id":"c","text":"layout.tsx"},{"id":"d","text":"route.tsx"}]'::jsonb,
  '"c"'::jsonb,
  10,
  'layout.tsx defines shared UI that wraps child route segments, persisting across navigation.',
  2
),
(
  'q1-3', 'quiz-1',
  'Which TypeScript utility type makes all properties of a type optional?',
  'single',
  '[{"id":"a","text":"Required<T>"},{"id":"b","text":"Partial<T>"},{"id":"c","text":"Pick<T, K>"},{"id":"d","text":"Omit<T, K>"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'Partial<T> constructs a type with all properties of T set to optional.',
  3
),
(
  'q1-4', 'quiz-1',
  'Which of the following are valid React Hooks? (Select all that apply)',
  'multiple',
  '[{"id":"a","text":"useMemo"},{"id":"b","text":"useCallback"},{"id":"c","text":"useComponent"},{"id":"d","text":"useId"}]'::jsonb,
  '["a","b","d"]'::jsonb,
  10,
  'useMemo, useCallback, and useId are standard built-in React Hooks. useComponent does not exist.',
  4
),
(
  'q1-5', 'quiz-1',
  'In Next.js App Router, all components inside the app directory are Server Components by default.',
  'truefalse',
  '[{"id":"true","text":"True"},{"id":"false","text":"False"}]'::jsonb,
  '"true"'::jsonb,
  10,
  'In the Next.js App Router, components default to React Server Components unless the ''use client'' directive is declared.',
  5
),
(
  'q1-6', 'quiz-1',
  'What HTTP status code represents "Created" after a successful POST request?',
  'single',
  '[{"id":"a","text":"200"},{"id":"b","text":"201"},{"id":"c","text":"204"},{"id":"d","text":"202"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'HTTP 201 Created indicates that the request has succeeded and led to the creation of a new resource.',
  6
),
(
  'q1-7', 'quiz-1',
  'Which CSS property is used to create a flexible responsive layout along a single axis?',
  'single',
  '[{"id":"a","text":"display: block"},{"id":"b","text":"display: grid"},{"id":"c","text":"display: flex"},{"id":"d","text":"display: inline"}]'::jsonb,
  '"c"'::jsonb,
  10,
  'Flexbox is a one-dimensional layout model for arranging items in rows or columns with flexible spacing.',
  7
),
(
  'q1-8', 'quiz-1',
  'What is the purpose of the key prop in React lists?',
  'single',
  '[{"id":"a","text":"To style elements uniquely"},{"id":"b","text":"To help React identify which items have changed, added, or removed"},{"id":"c","text":"To index DOM nodes for screen readers"},{"id":"d","text":"To make components accessible via keyboard"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'Keys help React identify which items have changed, been added, or been removed during reconciliation.',
  8
),
(
  'q1-9', 'quiz-1',
  'Which mechanism in CSS allows elements to adapt styles based on container dimensions rather than viewport size?',
  'single',
  '[{"id":"a","text":"Media Queries"},{"id":"b","text":"Container Queries"},{"id":"c","text":"CSS Variables"},{"id":"d","text":"Flexbox"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'Container Queries (@container) allow you to apply styles based on the size of the parent container rather than the viewport.',
  9
),
(
  'q1-10', 'quiz-1',
  'What does the "Stale-While-Revalidate" HTTP Cache-Control directive do?',
  'single',
  '[{"id":"a","text":"Always fetches from the network"},{"id":"b","text":"Serves stale cached response immediately while asynchronously fetching updated content"},{"id":"c","text":"Forces browser to invalidate cache on every request"},{"id":"d","text":"Caches content permanently without expiration"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'stale-while-revalidate instructs the cache to immediately return stale content while revalidating in the background.',
  10
),
(
  'q1-11', 'quiz-1',
  'In TypeScript, the "unknown" type is safer than "any" because operations on "unknown" require type checking first.',
  'truefalse',
  '[{"id":"true","text":"True"},{"id":"false","text":"False"}]'::jsonb,
  '"true"'::jsonb,
  10,
  'unknown is the type-safe counterpart of any; anything is assignable to unknown, but unknown isn''t assignable to anything else without narrowing.',
  11
),
(
  'q1-12', 'quiz-1',
  'Which of the following are Web Performance Core Web Vitals? (Select all that apply)',
  'multiple',
  '[{"id":"a","text":"LCP (Largest Contentful Paint)"},{"id":"b","text":"INP (Interaction to Next Paint)"},{"id":"c","text":"CLS (Cumulative Layout Shift)"},{"id":"d","text":"DOM (Document Object Model)"}]'::jsonb,
  '["a","b","c"]'::jsonb,
  10,
  'LCP, INP, and CLS are Google''s 3 Core Web Vitals. DOM is the standard document interface, not a performance metric.',
  12
),
(
  'q1-13', 'quiz-1',
  'What is the primary benefit of React Server Components (RSC)?',
  'single',
  '[{"id":"a","text":"Zero client-side JavaScript bundle impact for server-rendered code"},{"id":"b","text":"Automatic CSS styling"},{"id":"c","text":"Elimination of all API routes"},{"id":"d","text":"Faster local compilation"}]'::jsonb,
  '"a"'::jsonb,
  10,
  'Server Components run exclusively on the server and keep heavy dependencies out of the client JavaScript bundle.',
  13
),
(
  'q1-14', 'quiz-1',
  'Which Web API is used to store data that persists across browser sessions until explicitly deleted?',
  'single',
  '[{"id":"a","text":"sessionStorage"},{"id":"b","text":"localStorage"},{"id":"c","text":"Cookie with no expiration"},{"id":"d","text":"Memory Cache"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'localStorage stores data with no expiration time; sessionStorage is cleared when the browsing session ends.',
  14
),
(
  'q1-15', 'quiz-1',
  'Tailwind CSS and CSS Modules both eliminate global CSS namespace collisions.',
  'truefalse',
  '[{"id":"true","text":"True"},{"id":"false","text":"False"}]'::jsonb,
  '"true"'::jsonb,
  10,
  'Both approaches prevent global styling conflicts: CSS Modules scopes class names locally, and Tailwind uses pre-scoped atomic utility classes.',
  15
)
on conflict (id) do update
  set text = excluded.text,
      options = excluded.options,
      correct_answer = excluded.correct_answer,
      marks = excluded.marks,
      explanation = excluded.explanation,
      order_num = excluded.order_num;

-- Demo Questions for Quiz 2 (Data Structures & Algorithms - 5 Questions)
insert into public.questions (
  id, quiz_id, text, type, options, correct_answer, marks, explanation, order_num
) values
(
  'q2-1', 'quiz-2',
  'What is the worst-case time complexity of search in a balanced Binary Search Tree (such as AVL or Red-Black Tree)?',
  'single',
  '[{"id":"a","text":"O(1)"},{"id":"b","text":"O(log n)"},{"id":"c","text":"O(n)"},{"id":"d","text":"O(n log n)"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'Balanced BSTs guarantee logarithmic O(log n) search, insertion, and deletion operations.',
  1
),
(
  'q2-2', 'quiz-2',
  'Which data structure operates on a Last-In, First-Out (LIFO) basis?',
  'single',
  '[{"id":"a","text":"Queue"},{"id":"b","text":"Stack"},{"id":"c","text":"Heap"},{"id":"d","text":"Linked List"}]'::jsonb,
  '"b"'::jsonb,
  10,
  'A stack is a linear data structure following the LIFO principle.',
  2
),
(
  'q2-3', 'quiz-2',
  'What is the average-case time complexity of lookup in a Hash Table with a good hash function?',
  'single',
  '[{"id":"a","text":"O(1)"},{"id":"b","text":"O(log n)"},{"id":"c","text":"O(n)"},{"id":"d","text":"O(n^2)"}]'::jsonb,
  '"a"'::jsonb,
  10,
  'Hash tables offer constant time O(1) average lookup, insert, and delete performance.',
  3
),
(
  'q2-4', 'quiz-2',
  'Which algorithm is commonly used to find the shortest path in a weighted graph with non-negative edge weights?',
  'single',
  '[{"id":"a","text":"Prim''s Algorithm"},{"id":"b","text":"Kruskal''s Algorithm"},{"id":"c","text":"Dijkstra''s Algorithm"},{"id":"d","text":"Floyd-Warshall"}]'::jsonb,
  '"c"'::jsonb,
  10,
  'Dijkstra''s algorithm finds the shortest path between nodes in a graph with non-negative edge weights.',
  4
),
(
  'q2-5', 'quiz-2',
  'A standard Queue follows the First-In, First-Out (FIFO) access order.',
  'truefalse',
  '[{"id":"true","text":"True"},{"id":"false","text":"False"}]'::jsonb,
  '"true"'::jsonb,
  10,
  'Queues maintain FIFO ordering where elements are enqueued at the back and dequeued from the front.',
  5
)
on conflict (id) do update
  set text = excluded.text,
      options = excluded.options,
      correct_answer = excluded.correct_answer,
      marks = excluded.marks,
      explanation = excluded.explanation,
      order_num = excluded.order_num;
