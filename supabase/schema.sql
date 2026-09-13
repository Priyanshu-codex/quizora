-- ==============================================================================
-- QUIZORA PLATFORM — COMPLETE SUPABASE DATABASE SCHEMA
-- Compatible with PostgreSQL 15+ & Supabase Row Level Security (RLS)
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
-- 7. HELPER SECURITY DEFINER FUNCTIONS FOR ROLE VERIFICATION
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

-- Trigger to automatically confirm email and create profile on Supabase auth.users signup
create or replace function public.auto_confirm_user_email()
returns trigger as $$
begin
  new.email_confirmed_at = coalesce(new.email_confirmed_at, now());
  new.confirmed_at = coalesce(new.confirmed_at, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.auto_confirm_user_email();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Auto-confirm email in auth.users if not already confirmed
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmed_at = coalesce(confirmed_at, now())
  where id = new.id and (email_confirmed_at is null or confirmed_at is null);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
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
