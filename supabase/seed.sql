-- SINC CRM — Sprint 1: demo seed data
-- Password for all demo users: Demo1234!

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Deterministic UUIDs
-- ---------------------------------------------------------------------------
-- Users (auth.users = profiles.id)
--   System:   a0000000-0000-4000-8000-000000000000  (service account, no password)
--   Manager:  a0000000-0000-4000-8000-000000000001
--   Sales 1:  a0000000-0000-4000-8000-000000000002
--   Sales 2:  a0000000-0000-4000-8000-000000000003
--   Client 1: a0000000-0000-4000-8000-000000000004
--   Client 2: a0000000-0000-4000-8000-000000000005
--   Client 3: a0000000-0000-4000-8000-000000000006
--
-- Clients table
--   c0000000-0000-4000-8000-000000000001 → client1 profile (claimed)
--   c0000000-0000-4000-8000-000000000002 → client2 profile (claimed)
--   c0000000-0000-4000-8000-000000000003 → client3 profile (claimed)
--   c0000000-0000-4000-8000-000000000004 → unclaimed (no profile, demonstrates nudge flow)
--   Threads 1–6: e0000000-0000-4000-8000-000000000001 … 000006
--   Messages:   f0000000-…  |  Stage history: 10000000-…  |  Notes: 20000000-…

-- ---------------------------------------------------------------------------
-- Auth users (handle_new_user trigger creates profiles)
-- ---------------------------------------------------------------------------

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  phone,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  is_sso_user
) values
  (
    -- System service account — sender for inquiry confirmation messages
    'a0000000-0000-4000-8000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'system@sinc.internal',
    extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"SINC System"}',
    now(),
    now(),
    '', '', '', '',
    null, '', '', '', '', false
  ),
  (
    'a0000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@sinc.demo',
    extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alex Manager","role":"manager"}',
    now(),
    now(),
    '', '', '', '',
    null, '', '', '', '', false
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sales1@sinc.demo',
    extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sam Sales","role":"sales"}',
    now(),
    now(),
    '', '', '', '',
    null, '', '', '', '', false
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sales2@sinc.demo',
    extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Jordan Sales","role":"sales"}',
    now(),
    now(),
    '', '', '', '',
    null, '', '', '', '', false
  ),
  (
    'a0000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'client1@sinc.demo',
    extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Emma Client","role":"client"}',
    now(),
    now(),
    '', '', '', '',
    null, '', '', '', '', false
  ),
  (
    'a0000000-0000-4000-8000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'client2@sinc.demo',
    extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Liam Client","role":"client"}',
    now(),
    now(),
    '', '', '', '',
    null, '', '', '', '', false
  ),
  (
    'a0000000-0000-4000-8000-000000000006',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'client3@sinc.demo',
    extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sophia Client","role":"client"}',
    now(),
    now(),
    '', '', '', '',
    null, '', '', '', '', false
  );

-- Elevated roles for demo users (trigger always creates client; disable guard during seed)
ALTER TABLE profiles DISABLE TRIGGER profiles_protect_role;

UPDATE profiles SET role = 'manager'
  WHERE id = 'a0000000-0000-4000-8000-000000000001';

UPDATE profiles SET role = 'sales'
  WHERE id IN (
    'a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000003'
  );

ALTER TABLE profiles ENABLE TRIGGER profiles_protect_role;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    'b0000000-0000-4000-8000-000000000000',
    'a0000000-0000-4000-8000-000000000000',
    '{"sub":"a0000000-0000-4000-8000-000000000000","email":"system@sinc.internal"}'::jsonb,
    'email',
    'system@sinc.internal',
    now(),
    now(),
    now()
  ),
  (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    '{"sub":"a0000000-0000-4000-8000-000000000001","email":"manager@sinc.demo"}'::jsonb,
    'email',
    'manager@sinc.demo',
    now(),
    now(),
    now()
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    '{"sub":"a0000000-0000-4000-8000-000000000002","email":"sales1@sinc.demo"}'::jsonb,
    'email',
    'sales1@sinc.demo',
    now(),
    now(),
    now()
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000003',
    '{"sub":"a0000000-0000-4000-8000-000000000003","email":"sales2@sinc.demo"}'::jsonb,
    'email',
    'sales2@sinc.demo',
    now(),
    now(),
    now()
  ),
  (
    'b0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000004',
    '{"sub":"a0000000-0000-4000-8000-000000000004","email":"client1@sinc.demo"}'::jsonb,
    'email',
    'client1@sinc.demo',
    now(),
    now(),
    now()
  ),
  (
    'b0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000005',
    '{"sub":"a0000000-0000-4000-8000-000000000005","email":"client2@sinc.demo"}'::jsonb,
    'email',
    'client2@sinc.demo',
    now(),
    now(),
    now()
  ),
  (
    'b0000000-0000-4000-8000-000000000006',
    'a0000000-0000-4000-8000-000000000006',
    '{"sub":"a0000000-0000-4000-8000-000000000006","email":"client3@sinc.demo"}'::jsonb,
    'email',
    'client3@sinc.demo',
    now(),
    now(),
    now()
  );

-- ---------------------------------------------------------------------------
-- Clients (linked to client profiles)
-- ---------------------------------------------------------------------------

insert into clients (
  id,
  profile_id,
  full_name,
  email,
  phone,
  country,
  target_country,
  created_by,
  created_at,
  updated_at
) values
  (
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000004',
    'Emma Client',
    'client1@sinc.demo',
    '+1 555 0101',
    'United States',
    'United Kingdom',
    'a0000000-0000-4000-8000-000000000002',
    now() - interval '30 days',
    now() - interval '2 days'
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000005',
    'Liam Client',
    'client2@sinc.demo',
    '+1 555 0102',
    'Canada',
    'Germany',
    'a0000000-0000-4000-8000-000000000002',
    now() - interval '21 days',
    now() - interval '1 day'
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000006',
    'Sophia Client',
    'client3@sinc.demo',
    '+44 555 0103',
    'United Kingdom',
    'Canada',
    'a0000000-0000-4000-8000-000000000003',
    now() - interval '14 days',
    now()
  ),
  (
    -- Unclaimed client — profile_id null, demonstrates unverified badge + nudge email flow
    'c0000000-0000-4000-8000-000000000004',
    null,
    'Omar Khalil',
    'omar.khalil@example.com',
    '+971 55 0104',
    'UAE',
    'Canada',
    'a0000000-0000-4000-8000-000000000002',
    now() - interval '3 days',
    now() - interval '1 day'
  );

-- ---------------------------------------------------------------------------
-- Conversation threads (6)
-- ---------------------------------------------------------------------------

insert into conversation_threads (
  id,
  client_id,
  assigned_to,
  subject,
  status,
  last_message_at,
  created_at,
  updated_at
) values
  (
    'e0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    'University application inquiry',
    'open',
    now() - interval '2 hours',
    now() - interval '5 days',
    now() - interval '2 hours'
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000002',
    null,
    'Visa documentation help',
    'open',
    now() - interval '1 day',
    now() - interval '4 days',
    now() - interval '1 day'
  ),
  (
    'e0000000-0000-4000-8000-000000000003',
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    'Follow-up on documents',
    'pending',
    now() - interval '6 hours',
    now() - interval '3 days',
    now() - interval '6 hours'
  ),
  (
    'e0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000003',
    'MBA program questions',
    'open',
    now() - interval '3 hours',
    now() - interval '2 days',
    now() - interval '3 hours'
  ),
  (
    'e0000000-0000-4000-8000-000000000005',
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000003',
    'Scholarship options',
    'closed',
    now() - interval '7 days',
    now() - interval '10 days',
    now() - interval '7 days'
  ),
  (
    -- Thread for unclaimed client — demonstrates unverified badge, invite was already sent
    'e0000000-0000-4000-8000-000000000006',
    'c0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000002',
    'Study in Canada inquiry',
    'open',
    now() - interval '18 hours',
    now() - interval '3 days',
    now() - interval '18 hours'
  );

-- Mark unclaimed client's invite as sent (first team reply was 1 day ago)
update clients
  set invite_sent_at = now() - interval '1 day',
      invite_link_token = 'demo-invite-token-placeholder'
  where id = 'c0000000-0000-4000-8000-000000000004';

-- ---------------------------------------------------------------------------
-- Conversation messages (3–5 per thread)
-- ---------------------------------------------------------------------------

insert into conversation_messages (id, thread_id, sender_id, sender_type, body, created_at) values
  -- Thread 1 (4 messages)
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'client', 'Hi, I am interested in applying to UK universities for September intake.', now() - interval '5 days'),
  ('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'team', 'Hello Emma! Happy to help. Which programs are you considering?', now() - interval '5 days' + interval '20 minutes'),
  ('f0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'client', 'Business and economics, preferably in London.', now() - interval '4 days'),
  ('f0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'team', 'Great choices. I will send a shortlist of programs and entry requirements.', now() - interval '2 hours'),

  -- Thread 2 (3 messages)
  ('f0000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'client', 'Could you clarify which visa documents I need for Germany?', now() - interval '4 days'),
  ('f0000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'client', 'I have my passport and admission letter ready.', now() - interval '3 days'),
  ('f0000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'client', 'Also wondering about proof of funds requirements.', now() - interval '1 day'),

  -- Thread 3 (5 messages)
  ('f0000000-0000-4000-8000-000000000008', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'team', 'Emma, please upload your transcripts when you have a moment.', now() - interval '3 days'),
  ('f0000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'client', 'Will do — I am waiting on one final semester grade.', now() - interval '3 days' + interval '1 hour'),
  ('f0000000-0000-4000-8000-000000000010', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'team', 'No problem. We can proceed with the rest of the checklist.', now() - interval '2 days'),
  ('f0000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'client', 'Should I also prepare a personal statement draft?', now() - interval '1 day'),
  ('f0000000-0000-4000-8000-000000000012', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'team', 'Yes — I will share a template and review it with you.', now() - interval '6 hours'),

  -- Thread 4 (4 messages)
  ('f0000000-0000-4000-8000-000000000013', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000006', 'client', 'What GMAT score do top Canadian MBA programs typically expect?', now() - interval '2 days'),
  ('f0000000-0000-4000-8000-000000000014', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'team', 'Most competitive programs look for 650+, but holistic review matters.', now() - interval '2 days' + interval '30 minutes'),
  ('f0000000-0000-4000-8000-000000000015', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000006', 'client', 'I scored 680 — would you recommend Rotman or Ivey?', now() - interval '1 day'),
  ('f0000000-0000-4000-8000-000000000016', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'team', 'Both are strong fits. Let us compare curriculum and career outcomes on a call.', now() - interval '3 hours'),

  -- Thread 5 (3 messages)
  ('f0000000-0000-4000-8000-000000000017', 'e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005', 'client', 'Are there merit scholarships available for engineering programs?', now() - interval '10 days'),
  ('f0000000-0000-4000-8000-000000000018', 'e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'team', 'Yes — several universities offer 10–25% merit awards. I will send details.', now() - interval '9 days'),
  ('f0000000-0000-4000-8000-000000000019', 'e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'team', 'Closing this thread — Liam chose a program with a built-in scholarship.', now() - interval '7 days'),

  -- Thread 6 — unclaimed client Omar (system sends first message, then rep replies triggering invite)
  ('f0000000-0000-4000-8000-000000000020', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000000', 'team', 'Thanks for reaching out. One of our consultants will review your message and be in touch shortly.', now() - interval '3 days'),
  ('f0000000-0000-4000-8000-000000000021', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'team', 'Hi Omar! I saw your interest in studying in Canada. I would love to help you explore the best options for your background.', now() - interval '1 day'),
  ('f0000000-0000-4000-8000-000000000022', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'team', 'I have sent you an invite to set up your account so we can continue this conversation directly.', now() - interval '18 hours');

-- ---------------------------------------------------------------------------
-- Deals (8 — one per pipeline stage)
-- ---------------------------------------------------------------------------

insert into deals (
  id,
  client_id,
  owner_id,
  title,
  stage,
  value_amount,
  value_currency,
  expected_intake,
  lost_reason,
  created_at,
  updated_at
) values
  (
    'd0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    'UK Business Undergrad — Emma',
    'new_lead',
    4500.00,
    'USD',
    'Sep 2026',
    null,
    now() - interval '10 days',
    now() - interval '10 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    'Germany Engineering — Liam',
    'contacted',
    5200.00,
    'USD',
    'Oct 2026',
    null,
    now() - interval '9 days',
    now() - interval '7 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'c0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000003',
    'Canada MBA — Sophia',
    'consultation_booked',
    8000.00,
    'USD',
    'Jan 2027',
    null,
    now() - interval '8 days',
    now() - interval '5 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    'UK Foundation Program — Emma',
    'documents_requested',
    3800.00,
    'USD',
    'Sep 2026',
    null,
    now() - interval '7 days',
    now() - interval '3 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000005',
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000003',
    'Germany Masters — Liam',
    'application_started',
    6000.00,
    'USD',
    'Oct 2026',
    null,
    now() - interval '6 days',
    now() - interval '2 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000006',
    'c0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000002',
    'Canada Data Science — Sophia',
    'submitted',
    5500.00,
    'USD',
    'Jan 2027',
    null,
    now() - interval '5 days',
    now() - interval '1 day'
  ),
  (
    'd0000000-0000-4000-8000-000000000007',
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000003',
    'UK Economics — Emma',
    'won',
    4200.00,
    'USD',
    'Sep 2026',
    null,
    now() - interval '20 days',
    now() - interval '4 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000008',
    'c0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000002',
    'Canada Nursing — Sophia',
    'lost',
    4800.00,
    'USD',
    'Jan 2027',
    'Chose a competitor agency',
    now() - interval '15 days',
    now() - interval '6 days'
  );

-- ---------------------------------------------------------------------------
-- Deal stage history (each deal has at least one entry)
-- ---------------------------------------------------------------------------

insert into deal_stage_history (id, deal_id, from_stage, to_stage, changed_by, created_at) values
  ('10000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', null, 'new_lead', 'a0000000-0000-4000-8000-000000000002', now() - interval '10 days'),
  ('10000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', null, 'new_lead', 'a0000000-0000-4000-8000-000000000002', now() - interval '9 days'),
  ('10000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', 'new_lead', 'contacted', 'a0000000-0000-4000-8000-000000000002', now() - interval '7 days'),
  ('10000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000003', null, 'new_lead', 'a0000000-0000-4000-8000-000000000003', now() - interval '8 days'),
  ('10000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000003', 'new_lead', 'contacted', 'a0000000-0000-4000-8000-000000000003', now() - interval '7 days'),
  ('10000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000003', 'contacted', 'consultation_booked', 'a0000000-0000-4000-8000-000000000003', now() - interval '5 days'),
  ('10000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000004', null, 'new_lead', 'a0000000-0000-4000-8000-000000000002', now() - interval '7 days'),
  ('10000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000004', 'new_lead', 'contacted', 'a0000000-0000-4000-8000-000000000002', now() - interval '6 days'),
  ('10000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000004', 'contacted', 'consultation_booked', 'a0000000-0000-4000-8000-000000000002', now() - interval '5 days'),
  ('10000000-0000-4000-8000-000000000010', 'd0000000-0000-4000-8000-000000000004', 'consultation_booked', 'documents_requested', 'a0000000-0000-4000-8000-000000000002', now() - interval '3 days'),
  ('10000000-0000-4000-8000-000000000011', 'd0000000-0000-4000-8000-000000000005', null, 'new_lead', 'a0000000-0000-4000-8000-000000000003', now() - interval '6 days'),
  ('10000000-0000-4000-8000-000000000012', 'd0000000-0000-4000-8000-000000000005', 'new_lead', 'contacted', 'a0000000-0000-4000-8000-000000000003', now() - interval '5 days'),
  ('10000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000005', 'contacted', 'consultation_booked', 'a0000000-0000-4000-8000-000000000003', now() - interval '4 days'),
  ('10000000-0000-4000-8000-000000000014', 'd0000000-0000-4000-8000-000000000005', 'consultation_booked', 'documents_requested', 'a0000000-0000-4000-8000-000000000003', now() - interval '3 days'),
  ('10000000-0000-4000-8000-000000000015', 'd0000000-0000-4000-8000-000000000005', 'documents_requested', 'application_started', 'a0000000-0000-4000-8000-000000000003', now() - interval '2 days'),
  ('10000000-0000-4000-8000-000000000016', 'd0000000-0000-4000-8000-000000000006', null, 'new_lead', 'a0000000-0000-4000-8000-000000000002', now() - interval '5 days'),
  ('10000000-0000-4000-8000-000000000017', 'd0000000-0000-4000-8000-000000000006', 'new_lead', 'contacted', 'a0000000-0000-4000-8000-000000000002', now() - interval '4 days'),
  ('10000000-0000-4000-8000-000000000018', 'd0000000-0000-4000-8000-000000000006', 'contacted', 'consultation_booked', 'a0000000-0000-4000-8000-000000000002', now() - interval '3 days'),
  ('10000000-0000-4000-8000-000000000019', 'd0000000-0000-4000-8000-000000000006', 'consultation_booked', 'documents_requested', 'a0000000-0000-4000-8000-000000000002', now() - interval '2 days'),
  ('10000000-0000-4000-8000-000000000020', 'd0000000-0000-4000-8000-000000000006', 'documents_requested', 'application_started', 'a0000000-0000-4000-8000-000000000002', now() - interval '36 hours'),
  ('10000000-0000-4000-8000-000000000021', 'd0000000-0000-4000-8000-000000000006', 'application_started', 'submitted', 'a0000000-0000-4000-8000-000000000002', now() - interval '1 day'),
  ('10000000-0000-4000-8000-000000000022', 'd0000000-0000-4000-8000-000000000007', null, 'new_lead', 'a0000000-0000-4000-8000-000000000003', now() - interval '20 days'),
  ('10000000-0000-4000-8000-000000000023', 'd0000000-0000-4000-8000-000000000007', 'new_lead', 'contacted', 'a0000000-0000-4000-8000-000000000003', now() - interval '18 days'),
  ('10000000-0000-4000-8000-000000000024', 'd0000000-0000-4000-8000-000000000007', 'contacted', 'consultation_booked', 'a0000000-0000-4000-8000-000000000003', now() - interval '15 days'),
  ('10000000-0000-4000-8000-000000000025', 'd0000000-0000-4000-8000-000000000007', 'consultation_booked', 'documents_requested', 'a0000000-0000-4000-8000-000000000003', now() - interval '12 days'),
  ('10000000-0000-4000-8000-000000000026', 'd0000000-0000-4000-8000-000000000007', 'documents_requested', 'application_started', 'a0000000-0000-4000-8000-000000000003', now() - interval '10 days'),
  ('10000000-0000-4000-8000-000000000027', 'd0000000-0000-4000-8000-000000000007', 'application_started', 'submitted', 'a0000000-0000-4000-8000-000000000003', now() - interval '8 days'),
  ('10000000-0000-4000-8000-000000000028', 'd0000000-0000-4000-8000-000000000007', 'submitted', 'won', 'a0000000-0000-4000-8000-000000000003', now() - interval '4 days'),
  ('10000000-0000-4000-8000-000000000029', 'd0000000-0000-4000-8000-000000000008', null, 'new_lead', 'a0000000-0000-4000-8000-000000000002', now() - interval '15 days'),
  ('10000000-0000-4000-8000-000000000030', 'd0000000-0000-4000-8000-000000000008', 'new_lead', 'contacted', 'a0000000-0000-4000-8000-000000000002', now() - interval '13 days'),
  ('10000000-0000-4000-8000-000000000031', 'd0000000-0000-4000-8000-000000000008', 'contacted', 'consultation_booked', 'a0000000-0000-4000-8000-000000000002', now() - interval '11 days'),
  ('10000000-0000-4000-8000-000000000032', 'd0000000-0000-4000-8000-000000000008', 'consultation_booked', 'lost', 'a0000000-0000-4000-8000-000000000002', now() - interval '6 days');

-- ---------------------------------------------------------------------------
-- Deal notes (4 deals)
-- ---------------------------------------------------------------------------

insert into deal_notes (id, deal_id, author_id, body, created_at) values
  (
    '20000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000003',
    'Consultation scheduled for Thursday 10:00 AM. Sophia prefers video call.',
    now() - interval '5 days'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000002',
    'Waiting on final transcript. Reminder sent today.',
    now() - interval '3 days'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'd0000000-0000-4000-8000-000000000007',
    'a0000000-0000-4000-8000-000000000003',
    'Offer letter received from target university. Deal closed successfully.',
    now() - interval '4 days'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'd0000000-0000-4000-8000-000000000008',
    'a0000000-0000-4000-8000-000000000002',
    'Client signed with competitor citing lower service fee.',
    now() - interval '6 days'
  );
