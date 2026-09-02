/**
 * Script to inspect existing Supabase schema
 * Run this to see what tables already exist
 */

import { createClient } from '@supabase/supabase-js';

// Replace with your actual keys from .env.local
const SUPABASE_URL = 'https://hcczhuojneecshwwgqog.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not set');
  console.log('Please set it in .env.local or run:');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY="your-key-here"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectSchema() {
  console.log('🔍 Inspecting Bike Savvy Supabase schema...\n');

  // Get all tables
  const { data: tables, error } = await supabase.rpc('get_tables');
  
  if (error) {
    // Try alternative: query information_schema
    console.log('RPC not available, querying information_schema...\n');
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .neq('table_name', 'migration_history');
    
    if (schemaError) {
      console.error('Error querying schema:', schemaError);
      return;
    }
    
    console.log('📊 Existing Tables:');
    console.log('─'.repeat(50));
    schemaData?.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });
    console.log(`\nTotal: ${schemaData?.length || 0} tables\n`);
    
    // Get row counts for each table
    console.log('📈 Row Counts:');
    console.log('─'.repeat(50));
    for (const row of schemaData || []) {
      const { count, error: countError } = await supabase
        .from(row.table_name)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`  • ${row.table_name}: ${count} rows`);
      }
    }
    return;
  }

  console.log('Tables:', tables);
}

inspectSchema();
