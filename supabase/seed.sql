-- ==============================================================================
-- QUIZORA PLATFORM — SUPABASE SEED SCRIPT
-- Seeds the 2 official demo quizzes and their complete questions
-- ==============================================================================

create or replace function public.seed_demo_data()
returns void as $$
begin
  -- 1. DEMO QUIZZES (Strictly 2 intentional records)
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

-- 2. DEMO QUESTIONS FOR QUIZ 1 (Modern Web Engineering - 15 Questions)
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

-- 3. DEMO QUESTIONS FOR QUIZ 2 (Data Structures & Algorithms - 5 Questions)
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
end;
$$ language plpgsql security definer;

-- Grant execution to authenticated users and anonymous clients
grant execute on function public.seed_demo_data() to authenticated, anon;

-- Execute seed function immediately
select public.seed_demo_data();
