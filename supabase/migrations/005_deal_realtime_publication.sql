-- Sprint 4: enable Realtime for deal tables

alter publication supabase_realtime add table deals;
alter publication supabase_realtime add table deal_notes;
alter publication supabase_realtime add table deal_stage_history;
