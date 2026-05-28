-- Enable Supabase Realtime for conversation tables (Sprint 3)

alter publication supabase_realtime add table conversation_messages;
alter publication supabase_realtime add table conversation_threads;
