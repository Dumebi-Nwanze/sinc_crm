-- Sprint 4: restrict client access to internal deal data (security audit)

-- Clients must not read internal stage history (raw stages, changed_by)
drop policy if exists "deal_stage_history_select" on deal_stage_history;

create policy "deal_stage_history_select_manager"
  on deal_stage_history for select
  using (public.current_user_role() = 'manager');

create policy "deal_stage_history_select_sales"
  on deal_stage_history for select
  using (
    public.current_user_role() = 'sales'
    and exists (
      select 1 from deals d
      where d.id = deal_id and d.owner_id = auth.uid()
    )
  );

-- Clients must not SELECT deals directly (exposes lost_reason, value, owner_id).
-- Client-facing status will use Worker API + CLIENT_STAGE_LABELS when dashboard ships.
drop policy if exists "deals_select_client" on deals;
