#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// Seed script for Bike Savvy database
// Run with: node seed-db.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding Bike Savvy database...\n');

  // 1. Drop foreign key constraint on dashboard_users (for dev only)
  console.log('📋 Dropping foreign key constraint...');
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE dashboard_users DROP CONSTRAINT IF EXISTS dashboard_users_id_fkey;"
  });
  if (dropError) console.log('⚠️  Could not drop constraint (may not exist):', dropError.message);

  // 2. Insert dashboard users
  console.log('\n👥 Inserting dashboard users...');
  const users = [
    { id: '11111111-1111-1111-1111-111111111111', email: 'daniel@bikesavvy.co.za', full_name: 'Daniel Mokoena', role: 'instructor', is_active: true },
    { id: '22222222-2222-2222-2222-222222222222', email: 'michael@bikesavvy.co.za', full_name: 'Michael Peters', role: 'instructor', is_active: true },
    { id: '33333333-3333-3333-3333-333333333333', email: 'owner@bikesavvy.co.za', full_name: 'Bike Savvy Owner', role: 'owner', is_active: true },
  ];
  
  const { error: userError } = await supabase.from('dashboard_users').insert(users);
  if (userError) console.error('❌ User insert error:', userError.message);
  else console.log('✅ Inserted 3 dashboard users');

  // 3. Insert instructors
  console.log('\n🏍️  Inserting instructors...');
  const instructors = [
    { user_id: '11111111-1111-1111-1111-111111111111', qualifications: ['K53 Certified', 'Advanced Riding Instructor'], working_hours_start: '08:00', working_hours_end: '17:00', working_days: [1,2,3,4,5], hourly_rate_cents: 25000 },
    { user_id: '22222222-2222-2222-2222-222222222222', qualifications: ['K53 Certified', 'Defensive Riding Specialist'], working_hours_start: '08:00', working_hours_end: '17:00', working_days: [1,2,3,4,5], hourly_rate_cents: 25000 },
  ];
  
  const { error: instructorError } = await supabase.from('instructors').insert(instructors);
  if (instructorError) console.error('❌ Instructor insert error:', instructorError.message);
  else console.log('✅ Inserted 2 instructors');

  // 4. Insert customers
  console.log('\n👤 Inserting customers...');
  const customers = [
    { first_name: 'Lerato', last_name: 'Mokoena', email: 'lerato.m@email.com', phone: '+277****5678', riding_level: 'beginner', licence_stage: 'assessment', communication_preference: 'whatsapp' },
    { first_name: 'John', last_name: 'Dlamini', email: 'john.d@email.com', phone: '+277****6789', riding_level: 'intermediate', licence_stage: 'learner_test', communication_preference: 'whatsapp' },
    { first_name: 'Sarah', last_name: 'Williams', email: 'sarah.w@email.com', phone: '+277****7890', riding_level: 'beginner', licence_stage: 'practical_training', communication_preference: 'email' },
    { first_name: 'Thabo', last_name: 'Nkosi', email: 'thabo.n@email.com', phone: '+277****8901', riding_level: 'advanced', licence_stage: 'licence_preparation', communication_preference: 'whatsapp' },
    { first_name: 'Michelle', last_name: 'Botha', email: 'michelle.b@email.com', phone: '+277****9012', riding_level: 'beginner', licence_stage: 'assessment', communication_preference: 'sms' },
  ];
  
  const { error: customerError } = await supabase.from('customers').insert(customers);
  if (customerError) console.error('❌ Customer insert error:', customerError.message);
  else console.log('✅ Inserted 5 customers');

  // 5. Insert resources
  console.log('\n🏍️  Inserting resources...');
  const resources = [
    { name: 'Yamaha YBR 125 - Red', type: 'motorcycle', model: 'Yamaha YBR 125', license_plate: 'CA 123-456', is_available: true },
    { name: 'Honda CG 125 - Blue', type: 'motorcycle', model: 'Honda CG 125', license_plate: 'CA 234-567', is_available: true },
    { name: 'Suzuki GZ 150 - Black', type: 'motorcycle', model: 'Suzuki GZ 150', license_plate: 'CA 345-678', is_available: true },
    { name: 'Kawasaki Eliminator 125 - Green', type: 'motorcycle', model: 'Kawasaki Eliminator', license_plate: 'CA 456-789', is_available: true },
    { name: 'Training Area A - Cape Town', type: 'training_area', model: 'Cape Town CBD', license_plate: 'N/A', is_available: true },
    { name: 'Training Area B - Bellville', type: 'training_area', model: 'Bellville', license_plate: 'N/A', is_available: true },
  ];
  
  const { error: resourceError } = await supabase.from('resources').insert(resources);
  if (resourceError) console.error('❌ Resource insert error:', resourceError.message);
  else console.log('✅ Inserted 6 resources');

  // 6. Get IDs for bookings
  console.log('\n🔗 Fetching IDs for bookings...');
  const [{ data: lerato }, { data: john }, { data: sarah }, { data: thabo }, { data: michelle }] = await Promise.all([
    supabase.from('customers').select('id').eq('first_name', 'Lerato').eq('last_name', 'Mokoena').single(),
    supabase.from('customers').select('id').eq('first_name', 'John').eq('last_name', 'Dlamini').single(),
    supabase.from('customers').select('id').eq('first_name', 'Sarah').eq('last_name', 'Williams').single(),
    supabase.from('customers').select('id').eq('first_name', 'Thabo').eq('last_name', 'Nkosi').single(),
    supabase.from('customers').select('id').eq('first_name', 'Michelle').eq('last_name', 'Botha').single(),
  ]);

  const [{ data: beginner }, { data: learner }, { data: practical }, { data: licence }] = await Promise.all([
    supabase.from('courses').select('id').eq('name', 'Beginner Rider Introduction').single(),
    supabase.from('courses').select('id').eq('name', 'Learner License Preparation').single(),
    supabase.from('courses').select('id').eq('name', 'Practical Riding Skills').single(),
    supabase.from('courses').select('id').eq('name', 'Licence Test Preparation').single(),
  ]);

  const [{ data: daniel }, { data: michael }, { data: owner }] = await Promise.all([
    supabase.from('instructors').select('id').eq('user_id', '11111111-1111-1111-1111-111111111111').single(),
    supabase.from('instructors').select('id').eq('user_id', '22222222-2222-2222-2222-222222222222').single(),
    supabase.from('dashboard_users').select('id').eq('email', 'owner@bikesavvy.co.za').single(),
  ]);

  console.log('✅ Got all IDs');

  // 7. Insert bookings
  console.log('\n📅 Inserting bookings...');
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const bookings = [
    {
      booking_number: 'BK-2026-001',
      customer_id: lerato.id,
      course_id: beginner.id,
      instructor_id: daniel.id,
      status: 'confirmed',
      start_time: new Date(now.getTime() - 2*60*60*1000).toISOString(),
      end_time: new Date(now.getTime() + 2*60*60*1000).toISOString(),
      location: 'Training Area A - Cape Town',
      price_cents: 85000,
      deposit_paid_cents: 25000,
      payment_status: 'deposit_paid',
      source: 'dashboard',
      created_by: owner.id
    },
    {
      booking_number: 'BK-2026-002',
      customer_id: john.id,
      course_id: learner.id,
      instructor_id: michael.id,
      status: 'confirmed',
      start_time: new Date(now.getTime() + 30*60*1000).toISOString(),
      end_time: new Date(now.getTime() + 3.5*60*60*1000).toISOString(),
      location: 'Training Area B - Bellville',
      price_cents: 120000,
      deposit_paid_cents: 50000,
      payment_status: 'deposit_paid',
      source: 'dashboard',
      created_by: owner.id
    },
    {
      booking_number: 'BK-2026-003',
      customer_id: sarah.id,
      course_id: practical.id,
      instructor_id: daniel.id,
      status: 'pending_payment',
      start_time: new Date(now.getTime() + 4*60*60*1000).toISOString(),
      end_time: new Date(now.getTime() + 8*60*60*1000).toISOString(),
      location: 'Training Area A - Cape Town',
      price_cents: 180000,
      deposit_paid_cents: 0,
      payment_status: 'unpaid',
      source: 'phone',
      created_by: owner.id
    },
    {
      booking_number: 'BK-2026-004',
      customer_id: thabo.id,
      course_id: licence.id,
      instructor_id: michael.id,
      status: 'confirmed',
      start_time: new Date(tomorrow.getTime() - 2*60*60*1000).toISOString(),
      end_time: new Date(tomorrow.getTime() + 2*60*60*1000).toISOString(),
      location: 'Training Area B - Bellville',
      price_cents: 150000,
      deposit_paid_cents: 50000,
      payment_status: 'deposit_paid',
      source: 'dashboard',
      created_by: owner.id
    },
    {
      booking_number: 'BK-2026-005',
      customer_id: michelle.id,
      course_id: beginner.id,
      instructor_id: daniel.id,
      status: 'confirmed',
      start_time: new Date(tomorrow.getTime() + 2*60*60*1000).toISOString(),
      end_time: new Date(tomorrow.getTime() + 4*60*60*1000).toISOString(),
      location: 'Training Area A - Cape Town',
      price_cents: 85000,
      deposit_paid_cents: 25000,
      payment_status: 'deposit_paid',
      source: 'dashboard',
      created_by: owner.id
    },
    {
      booking_number: 'BK-2026-006',
      customer_id: john.id,
      course_id: practical.id,
      instructor_id: michael.id,
      status: 'completed',
      start_time: new Date(yesterday.getTime() - 4*60*60*1000).toISOString(),
      end_time: new Date(yesterday.getTime() - 2*60*60*1000).toISOString(),
      location: 'Training Area B - Bellville',
      price_cents: 180000,
      deposit_paid_cents: 180000,
      payment_status: 'paid',
      source: 'dashboard',
      created_by: owner.id
    }
  ];

  const { error: bookingError } = await supabase.from('bookings').insert(bookings);
  if (bookingError) console.error('❌ Booking insert error:', bookingError.message);
  else console.log('✅ Inserted 6 bookings');

  // 8. Final counts
  console.log('\n📊 Final counts:');
  const counts = await Promise.all([
    supabase.from('instructors').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('resources').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
  ]);

  console.log(`   Instructors: ${counts[0].count}`);
  console.log(`   Customers: ${counts[1].count}`);
  console.log(`   Resources: ${counts[2].count}`);
  console.log(`   Bookings: ${counts[3].count}`);
  
  console.log('\n✅ Seeding complete! 🎉');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
