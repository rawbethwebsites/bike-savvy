#!/bin/bash
# Quick script to check existing Supabase tables

echo "🔍 Checking Bike Savvy Supabase schema..."
echo ""
echo "Please get your keys from:"
echo "https://hcczhuojneecshwwgqog.supabase.co/project/hcczhuojneecshwwgqog/settings/api"
echo ""
echo "Then run this SQL in the Supabase SQL Editor:"
echo ""
echo "─────────────────────────────────────────────"
cat << 'SQL'
-- Check existing tables
SELECT 
  table_name,
  '  • ' || table_name as formatted
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name != 'migration_history'
ORDER BY table_name;

-- Get row counts
SELECT 
  schemaname || '.' || tablename as table_name,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
SQL
echo "─────────────────────────────────────────────"
echo ""
echo "Or paste the migration SQL from:"
echo "  supabase/migrations/001_initial_schema.sql"
echo ""
