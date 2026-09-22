-- Kindergarten Classroom: Supabase foundation
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('student','parent','teacher','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  display_name text not null,
  grade_level text not null check (grade_level in ('pre-k','kindergarten','grade-1','grade-2')),
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  grade_level text not null check (grade_level in ('pre-k','kindergarten','grade-1','grade-2')),
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  unique(course_id, slug)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  lesson_type text not null default 'practice',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  unique(unit_id, slug)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete set null,
  external_id text unique,
  question_type text not null,
  prompt text not null,
  data jsonb not null default '{}'::jsonb,
  answer_data jsonb not null default '{}'::jsonb,
  difficulty smallint check (difficulty between 1 and 5),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.student_answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_data jsonb not null default '{}'::jsonb,
  is_correct boolean,
  response_time_ms integer,
  answered_at timestamptz not null default now()
);

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  attempts integer not null default 0,
  correct_answers integer not null default 0,
  completion_percent numeric(5,2) not null default 0,
  last_activity_at timestamptz,
  unique(student_id, lesson_id)
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  task_date date not null,
  status text not null default 'assigned' check (status in ('assigned','started','completed','skipped')),
  created_at timestamptz not null default now(),
  unique(student_id, task_date, lesson_id)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  icon text
);

create table if not exists public.student_achievements (
  student_id uuid not null references public.students(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key(student_id, achievement_id)
);

create index if not exists idx_units_course on public.units(course_id);
create index if not exists idx_lessons_unit on public.lessons(unit_id);
create index if not exists idx_questions_lesson on public.questions(lesson_id);
create index if not exists idx_answers_student on public.student_answers(student_id, answered_at desc);
create index if not exists idx_progress_student on public.student_progress(student_id);
create index if not exists idx_tasks_student_date on public.daily_tasks(student_id, task_date);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.student_answers enable row level security;
alter table public.student_progress enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;

-- Public curriculum/question reads; student-specific data will be locked down
-- after authentication and parent/student ownership rules are finalized.
create policy "public read courses" on public.courses for select using (is_active);
create policy "public read units" on public.units for select using (is_active);
create policy "public read lessons" on public.lessons for select using (is_active);
create policy "public read questions" on public.questions for select using (is_active);
create policy "public read achievements" on public.achievements for select using (true);
