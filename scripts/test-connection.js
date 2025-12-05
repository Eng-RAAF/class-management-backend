import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test successful:', result);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('✅ Found tables:', tables);
    
    await prisma.$disconnect();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed!');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'P1001') {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Check if database is paused in Supabase dashboard');
      console.error('2. Try using direct connection instead of pooler');
      console.error('3. Get fresh connection string from Supabase Dashboard');
      console.error('4. Verify credentials are correct');
    }
    
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();

