import { PrismaClient } from '@prisma/client';

// Prisma Client reads DATABASE_URL from environment variable
let prisma;

try {
  // Configure Prisma for connection pooling (Supabase pooler)
  // For pooler connections, we need to handle prepared statement errors
  const prismaOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  };

  prisma = new PrismaClient(prismaOptions);

  // Verify that the student model exists
  if (!prisma.student) {
    console.error('⚠ WARNING: Prisma Student model not found!');
    console.error('Please run: npm run prisma:generate');
    throw new Error('Prisma Client not properly generated. Run: npm run prisma:generate');
  }
} catch (error) {
  if (error.message.includes('Cannot find module') || error.message.includes('not properly generated')) {
    console.error('\n❌ Prisma Client Error:');
    console.error('The Prisma Client has not been generated.');
    console.error('Please run the following commands:');
    console.error('  1. npm run prisma:generate');
    console.error('  2. npm run prisma:migrate (or prisma:push)');
    console.error('\n');
    throw error;
  }
  throw error;
}

// Handle Prisma connection errors
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error.message);
  
  // Check for specific error types
  const isConnectionError = error.code === 'P1001' || 
                           error.message?.includes("Can't reach database server") ||
                           error.message?.includes('connection');
  
  const isSocketError = error.message?.includes('WSAStartup') ||
                       error.message?.includes('10093') ||
                       error.cause?.code === 10093 ||
                       (error.cause && error.cause.code === 10093);
  
  const isPreparedStatementError = error.message?.includes('prepared statement') ||
                                   error.message?.includes('42P05') ||
                                   error.message?.includes('already exists');
  
  if (isConnectionError || isSocketError || isPreparedStatementError) {
    console.error('\n❌ Database Connection Error');
    
    if (isSocketError) {
      console.error('Error Type: Windows Socket Error (WSAStartup)');
      console.error('This is a Windows networking initialization issue.\n');
    } else if (isPreparedStatementError) {
      console.error('Error Type: Prepared Statement Error');
      console.error('This is a Supabase pooler connection issue.\n');
    } else {
      console.error('Error Type: Connection Error\n');
    }
    
    console.error('Possible solutions:');
    
    if (isSocketError) {
      console.error('1. Windows Socket Error Fix:');
      console.error('   → Restart your computer');
      console.error('   → Or restart Windows network adapter');
      console.error('   → Run PowerShell as Administrator: Restart-NetAdapter -Name "*"');
      console.error('   → Try running the server as Administrator');
    }
    
    if (isPreparedStatementError) {
      console.error('1. Prepared Statement Error Fix:');
      console.error('   → Switch to DIRECT connection (not pooler)');
      console.error('   → Use port 6543 instead of 5432 in DATABASE_URL');
      console.error('   → Update backend/.env file');
    }
    
    console.error('2. Check if your Supabase project is active (not paused)');
    console.error('   → Go to Supabase Dashboard and resume if paused');
    console.error('3. Verify DATABASE_URL in .env file');
    console.error('   → Check backend/.env file exists and has correct DATABASE_URL');
    console.error('   → For Supabase direct connection:');
    console.error('     Format: postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres');
    console.error('4. For Supabase, use the DIRECT connection URL');
    console.error('   → Go to Supabase → Settings → Database → Connection string');
    console.error('   → Select "Direct connection" (not "Connection pooling")');
    console.error('5. Check network/firewall settings');
    console.error('   → Ensure ports 5432/6543 are not blocked');
    console.error('6. Test connection: node scripts/test-db-connection.js');
    console.error('7. See DATABASE_CONNECTION_FIX.md for detailed solutions\n');
  }
  
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV === 'development') {
    console.error('Continuing in development mode...');
    console.error('The retry mechanism will attempt to reconnect automatically.\n');
  }
});

// Create a wrapper to handle prepared statement errors
// This is a workaround for Supabase pooler connection issues
const createPrismaWithRetry = (client) => {
  return new Proxy(client, {
    get(target, prop) {
      const value = target[prop];
      
      // Wrap model access (student, class, etc.)
      if (prop && typeof value === 'object' && value !== null && !value.then) {
        return new Proxy(value, {
          get(modelTarget, modelProp) {
            const modelValue = modelTarget[modelProp];
            
            // Wrap async methods (findMany, create, etc.)
            if (typeof modelValue === 'function') {
              return async function(...args) {
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount < maxRetries) {
                  try {
                    return await modelValue.apply(modelTarget, args);
                  } catch (error) {
                    // Check for prepared statement error (42P05)
                    const isPreparedStatementError = error.message?.includes('prepared statement') || 
                                                    error.message?.includes('42P05') ||
                                                    error.message?.includes('already exists') ||
                                                    (error.meta && error.meta.code === '42P05');
                    
                    // Check for Windows socket error
                    const isSocketError = error.message?.includes('WSAStartup') ||
                                         error.message?.includes('10093') ||
                                         error.cause?.code === 10093;
                    
                    // Check for connection errors
                    const isConnectionError = error.code === 'P1001' ||
                                             error.message?.includes("Can't reach database server") ||
                                             error.message?.includes('connection');
                    
                    if ((isPreparedStatementError || isSocketError || isConnectionError) && retryCount < maxRetries - 1) {
                      retryCount++;
                      console.warn(`Database error detected (attempt ${retryCount}/${maxRetries}), reconnecting...`);
                      console.warn('Error:', error.message?.substring(0, 100));
                      
                      try {
                        await target.$disconnect().catch(() => {}); // Ignore disconnect errors
                        await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Exponential backoff
                        await target.$connect();
                        // Retry the operation
                        continue; // Retry the operation
                      } catch (retryError) {
                        console.error('Reconnection failed:', retryError.message);
                        if (retryCount >= maxRetries - 1) {
                          throw error; // Throw original error after max retries
                        }
                      }
                    } else {
                      throw error; // Not a retryable error or max retries reached
                    }
                  }
                }
              };
            }
            return modelValue;
          }
        });
      }
      
      // Wrap $queryRaw and other $ methods
      if (typeof value === 'function' && prop.startsWith('$')) {
        return async function(...args) {
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              return await value.apply(target, args);
            } catch (error) {
              const isPreparedStatementError = error.message?.includes('prepared statement') || 
                                              error.message?.includes('42P05') ||
                                              error.message?.includes('already exists') ||
                                              (error.meta && error.meta.code === '42P05');
              
              const isSocketError = error.message?.includes('WSAStartup') ||
                                   error.message?.includes('10093') ||
                                   error.cause?.code === 10093;
              
              const isConnectionError = error.code === 'P1001' ||
                                       error.message?.includes("Can't reach database server");
              
              if ((isPreparedStatementError || isSocketError || isConnectionError) && retryCount < maxRetries - 1) {
                retryCount++;
                console.warn(`Database error in $ method (attempt ${retryCount}/${maxRetries}), reconnecting...`);
                try {
                  await target.$disconnect().catch(() => {});
                  await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
                  await target.$connect();
                  continue; // Retry
                } catch (retryError) {
                  console.error('Reconnection failed:', retryError.message);
                  if (retryCount >= maxRetries - 1) {
                    throw error;
                  }
                }
              } else {
                throw error;
              }
            }
          }
        };
      }
      
      return value;
    }
  });
};

// Wrap the prisma client with retry logic
prisma = createPrismaWithRetry(prisma);

export default prisma;

