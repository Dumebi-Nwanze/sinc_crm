-- SINC CRM — Sprint 1: full schema migration

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type app_role as enum ('client', 'sales', 'manager');
create type conversation_status as enum ('open', 'pending', 'closed');
create type message_sender_type as enum ('client', 'team');
create type deal_stage as enum (
  'new_lead',
  'contacted',
  'consultation_booked',
  'documents_requested',
  'application_started',
  'submitted',
  'won',
  'lost'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role app_role not null,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  full_name text not null,
  email text not null,
  phone text,
  country text,
  target_country text,
  invite_sent_at timestamptz,
  invite_link_token text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversation_threads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  assigned_to uuid references profiles(id),
  subject text not null,
  status conversation_status not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  sender_type message_sender_type not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table deals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  owner_id uuid references profiles(id),
  title text not null,
  stage deal_stage not null default 'new_lead',
  value_amount numeric(12, 2),
  value_currency text default 'USD',
  expected_intake text,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  from_stage deal_stage,
  to_stage deal_stage not null,
  changed_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table deal_notes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create unique index clients_email_unique_idx on clients (lower(email));
create index clients_profile_id_idx on clients(profile_id);

create index conversation_threads_client_id_idx on conversation_threads(client_id);
create index conversation_threads_assigned_to_idx on conversation_threads(assigned_to);
create index conversation_threads_status_idx on conversation_threads(status);
create index conversation_messages_thread_id_created_at_idx on conversation_messages(thread_id, created_at);

create index deals_client_id_idx on deals(client_id);
create index deals_owner_id_idx on deals(owner_id);
create index deals_stage_idx on deals(stage);
create index deal_stage_history_deal_id_created_at_idx on deal_stage_history(deal_id, created_at desc);
create index deal_notes_deal_id_created_at_idx on deal_notes(deal_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Auth trigger — auto-create profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Always default to client; elevated roles are assigned via service-role/admin flows only.
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'client'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() = old.id then
      raise exception 'Cannot change own role';
    end if;

    if public.current_user_role() is distinct from 'manager'::app_role then
      raise exception 'Only managers can change roles';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_role
  before update on profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- RLS helper functions
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from clients where profile_id = auth.uid() limit 1;
$$;

create or replace function public.can_access_thread(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from conversation_threads t
    where t.id = p_thread_id
      and (
        public.current_user_role() = 'manager'
        or (
          public.current_user_role() = 'sales'
          and (t.assigned_to = auth.uid() or t.assigned_to is null)
        )
        or (
          public.current_user_role() = 'client'
          and t.client_id = public.current_client_id()
        )
      )
  );
$$;

create or replace function public.can_access_deal(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from deals d
    where d.id = p_deal_id
      and (
        public.current_user_role() = 'manager'
        or (
          public.current_user_role() = 'sales'
          and d.owner_id = auth.uid()
        )
        or (
          public.current_user_role() = 'client'
          and d.client_id = public.current_client_id()
        )
      )
  );
$$;

create or replace function public.sales_can_read_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from conversation_threads t
    where t.client_id = p_client_id
      and (t.assigned_to = auth.uid() or t.assigned_to is null)
  )
  or exists (
    select 1
    from deals d
    where d.client_id = p_client_id
      and d.owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table clients enable row level security;
alter table conversation_threads enable row level security;
alter table conversation_messages enable row level security;
alter table deals enable row level security;
alter table deal_stage_history enable row level security;
alter table deal_notes enable row level security;

-- profiles
create policy "profiles_select_own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles_select_manager"
  on profiles for select
  using (public.current_user_role() = 'manager');

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_manager"
  on profiles for update
  using (public.current_user_role() = 'manager')
  with check (public.current_user_role() = 'manager');

-- clients
create policy "clients_select_client_own"
  on clients for select
  using (
    public.current_user_role() = 'client'
    and profile_id = auth.uid()
  );

create policy "clients_select_sales"
  on clients for select
  using (
    public.current_user_role() = 'sales'
    and public.sales_can_read_client(id)
  );

create policy "clients_select_manager"
  on clients for select
  using (public.current_user_role() = 'manager');

create policy "clients_insert_manager"
  on clients for insert
  with check (public.current_user_role() = 'manager');

create policy "clients_update_manager"
  on clients for update
  using (public.current_user_role() = 'manager')
  with check (public.current_user_role() = 'manager');

create policy "clients_delete_manager"
  on clients for delete
  using (public.current_user_role() = 'manager');

-- conversation_threads
create policy "threads_select_client"
  on conversation_threads for select
  using (
    public.current_user_role() = 'client'
    and client_id = public.current_client_id()
  );

create policy "threads_select_sales"
  on conversation_threads for select
  using (
    public.current_user_role() = 'sales'
    and (assigned_to = auth.uid() or assigned_to is null)
  );

create policy "threads_select_manager"
  on conversation_threads for select
  using (public.current_user_role() = 'manager');

create policy "threads_insert_manager"
  on conversation_threads for insert
  with check (public.current_user_role() = 'manager');

create policy "threads_insert_sales"
  on conversation_threads for insert
  with check (
    public.current_user_role() = 'sales'
    and public.sales_can_read_client(client_id)
  );

create policy "threads_update_sales"
  on conversation_threads for update
  using (
    public.current_user_role() = 'sales'
    and (assigned_to = auth.uid() or assigned_to is null)
  )
  with check (
    public.current_user_role() = 'sales'
    and (assigned_to = auth.uid() or assigned_to is null)
  );

create policy "threads_update_manager"
  on conversation_threads for update
  using (public.current_user_role() = 'manager')
  with check (public.current_user_role() = 'manager');

create policy "threads_delete_manager"
  on conversation_threads for delete
  using (public.current_user_role() = 'manager');

-- conversation_messages
create policy "messages_select"
  on conversation_messages for select
  using (public.can_access_thread(thread_id));

create policy "messages_insert_client"
  on conversation_messages for insert
  with check (
    public.current_user_role() = 'client'
    and sender_id = auth.uid()
    and sender_type = 'client'
    and public.can_access_thread(thread_id)
  );

create policy "messages_insert_team"
  on conversation_messages for insert
  with check (
    public.current_user_role() in ('sales', 'manager')
    and sender_id = auth.uid()
    and sender_type = 'team'
    and public.can_access_thread(thread_id)
  );

create policy "messages_update_manager"
  on conversation_messages for update
  using (public.current_user_role() = 'manager')
  with check (public.current_user_role() = 'manager');

create policy "messages_delete_manager"
  on conversation_messages for delete
  using (public.current_user_role() = 'manager');

-- deals
create policy "deals_select_client"
  on deals for select
  using (
    public.current_user_role() = 'client'
    and client_id = public.current_client_id()
  );

create policy "deals_select_sales"
  on deals for select
  using (
    public.current_user_role() = 'sales'
    and owner_id = auth.uid()
  );

create policy "deals_select_manager"
  on deals for select
  using (public.current_user_role() = 'manager');

create policy "deals_insert_sales"
  on deals for insert
  with check (
    public.current_user_role() = 'sales'
    and owner_id = auth.uid()
  );

create policy "deals_insert_manager"
  on deals for insert
  with check (public.current_user_role() = 'manager');

create policy "deals_update_sales"
  on deals for update
  using (
    public.current_user_role() = 'sales'
    and owner_id = auth.uid()
  )
  with check (
    public.current_user_role() = 'sales'
    and owner_id = auth.uid()
  );

create policy "deals_update_manager"
  on deals for update
  using (public.current_user_role() = 'manager')
  with check (public.current_user_role() = 'manager');

create policy "deals_delete_manager"
  on deals for delete
  using (public.current_user_role() = 'manager');

-- deal_stage_history
create policy "deal_stage_history_select"
  on deal_stage_history for select
  using (public.can_access_deal(deal_id));

create policy "deal_stage_history_insert_sales"
  on deal_stage_history for insert
  with check (
    public.current_user_role() = 'sales'
    and changed_by = auth.uid()
    and exists (
      select 1 from deals d
      where d.id = deal_id and d.owner_id = auth.uid()
    )
  );

create policy "deal_stage_history_insert_manager"
  on deal_stage_history for insert
  with check (
    public.current_user_role() = 'manager'
    and changed_by = auth.uid()
  );

-- deal_notes — clients have no access (high-level deal status only via deals table)
create policy "deal_notes_select_sales"
  on deal_notes for select
  using (
    public.current_user_role() = 'sales'
    and exists (
      select 1 from deals d
      where d.id = deal_id and d.owner_id = auth.uid()
    )
  );

create policy "deal_notes_select_manager"
  on deal_notes for select
  using (public.current_user_role() = 'manager');

create policy "deal_notes_insert_sales"
  on deal_notes for insert
  with check (
    public.current_user_role() = 'sales'
    and author_id = auth.uid()
    and exists (
      select 1 from deals d
      where d.id = deal_id and d.owner_id = auth.uid()
    )
  );

create policy "deal_notes_insert_manager"
  on deal_notes for insert
  with check (
    public.current_user_role() = 'manager'
    and author_id = auth.uid()
  );

create policy "deal_notes_update_manager"
  on deal_notes for update
  using (public.current_user_role() = 'manager')
  with check (public.current_user_role() = 'manager');

create policy "deal_notes_delete_manager"
  on deal_notes for delete
  using (public.current_user_role() = 'manager');
