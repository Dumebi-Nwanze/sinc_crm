-- Sprint 3 security: prevent authenticated JWT from reading invite_link_token

revoke all on table public.clients from authenticated;

grant select (
  id,
  profile_id,
  full_name,
  email,
  phone,
  country,
  target_country,
  invite_sent_at,
  created_by,
  created_at,
  updated_at
) on table public.clients to authenticated;

-- Align sales thread updates with Worker rules: assigned rep only (no unassign, no unassigned edits)
drop policy if exists "threads_update_sales" on conversation_threads;

create policy "threads_update_sales"
  on conversation_threads for update
  using (
    public.current_user_role() = 'sales'
    and assigned_to = auth.uid()
  )
  with check (
    public.current_user_role() = 'sales'
    and assigned_to = auth.uid()
  );
