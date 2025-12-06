import { PrismaClient } from '@prisma/client';

// Validate DATABASE_URL before initializing Prisma
const validateDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('\n❌ DATABASE_URL is not set!');
    console.error('\nTo fix this:');
    console.error('1. Go to Vercel Dashboard → Your Backend Project');
    console.error('2. Navigate to Settings → Environment Variables');
    console.error('3. Add DATABASE_URL with your PostgreSQL connection string');
    console.error('4. Format: postgresql://user:password@host:port/database');
    console.error('5. Redeploy the backend after adding the variable\n');
    throw new Error('DATABASE_URL environment variable is not set. Please configure it in Vercel environment variables.');
  }
  
  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    console.error('\n❌ DATABASE_URL is empty!');
    console.error('Please set a valid DATABASE_URL in Vercel environment variables.\n');
    throw new Error('DATABASE_URL is empty. Please set a valid connection string in Vercel environment variables.');
  }
  
  // Check if it starts with the correct protocol
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.error('\n❌ DATABASE_URL has invalid format!');
    console.error('Current value (first 50 chars):', databaseUrl.substring(0, 50));
    console.error('\nDATABASE_URL must start with "postgresql://" or "postgres://"');
    console.error('Example format: postgresql://user:password@host:port/database');
    console.error('\nTo fix:');
    console.error('1. Get your PostgreSQL connection string from your database provider');
    console.error('2. Format: postgresql://user:password@host:port/database');
    console.error('3. Update DATABASE_URL in Vercel → Backend Project → Environment Variables');
    console.error('4. Redeploy the backend\n');
    throw new Error(`DATABASE_URL must start with "postgresql://" or "postgres://". Current format is invalid.`);
  }
  
  return true;
};

// Prisma Client reads DATABASE_URL from environment variable
let prisma;

try {
  // Validate DATABASE_URL first
  validateDatabaseUrl();
  
  // Configure Prisma for connection pooling
  // For pooler connections, we need to handle prepared statement errors
  // Add connection pool settings to handle connection resets better
  const prismaOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    // Connection pool configuration for better reliability
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  };

  prisma = new PrismaClient(prismaOptions);
  
  // Set up connection pool management
  // This helps prevent connection reset errors
  if (process.env.DATABASE_URL?.includes('pooler') || process.env.DATABASE_URL?.includes('5432')) {
    console.warn('⚠️  Using connection pooler. Consider switching to direct connection (port 6543) for better reliability.');
  }

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

// Handle Prisma connection errors (only if prisma is initialized)
if (prisma) {
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
  
  const isConnectionReset = error.cause?.code === 10054 ||
                            error.message?.includes('10054') ||
                            error.message?.includes('ConnectionReset') ||
                            error.message?.includes('forcibly closed') ||
                            (error.cause && error.cause.message?.includes('forcibly closed'));
  
  if (isConnectionError || isSocketError || isPreparedStatementError || isConnectionReset) {
    console.error('\n❌ Database Connection Error');
    
    if (isConnectionReset) {
      console.error('Error Type: Connection Reset (10054)');
      console.error('The database server forcibly closed the connection.\n');
    } else if (isSocketError) {
      console.error('Error Type: Windows Socket Error (WSAStartup)');
      console.error('This is a Windows networking initialization issue.\n');
    } else if (isPreparedStatementError) {
      console.error('Error Type: Prepared Statement Error');
      console.error('This is a connection pooler issue.\n');
    } else {
      console.error('Error Type: Connection Error\n');
    }
    
    console.error('Possible solutions:');
    
    if (isConnectionReset) {
      console.error('1. Connection Reset Error Fix:');
      console.error('   → Switch to direct connection instead of pooler if available');
      console.error('   → Update DATABASE_URL to use direct connection');
      console.error('   → The retry mechanism will automatically reconnect');
      console.error('   → Check your database provider status');
    }
    
    if (isSocketError) {
      console.error('1. Windows Socket Error Fix:');
      console.error('   → Restart your computer');
      console.error('   → Or restart Windows network adapter');
      console.error('   → Run PowerShell as Administrator: Restart-NetAdapter -Name "*"');
      console.error('   → Try running the server as Administrator');
    }
    
    if (isPreparedStatementError) {
      console.error('1. Prepared Statement Error Fix:');
      console.error('   → Switch to direct connection (not pooler) if available');
      console.error('   → Update backend/.env file with correct connection string');
    }
    
    console.error('2. Check if your database is active and accessible');
    console.error('   → Verify your database provider status');
    console.error('3. Verify DATABASE_URL in .env file');
    console.error('   → Check backend/.env file exists and has correct DATABASE_URL');
    console.error('   → Format: postgresql://user:password@host:port/database');
    console.error('4. Use the direct connection URL from your database provider');
    console.error('   → Check your database provider dashboard for connection strings');
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
}

// Create a wrapper to handle prepared statement errors
// This is a workaround for connection pooler issues
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
                    // Error can be in different formats:
                    // 1. error.message contains "prepared statement" or "42P05"
                    // 2. error.meta?.code === '42P05'
                    // 3. error.cause?.code === '42P05' (Prisma ConnectorError format)
                    // 4. Nested: error.kind?.QueryError?.PostgresError?.code === '42P05'
                    const errorCode = error.meta?.code || 
                                     error.cause?.code || 
                                     (error.kind?.QueryError?.PostgresError?.code) ||
                                     (error.message?.match(/42P05/)?.[0]);
                    const isPreparedStatementError = error.message?.includes('prepared statement') || 
                                                    error.message?.includes('42P05') ||
                                                    error.message?.includes('already exists') ||
                                                    errorCode === '42P05' ||
                                                    (error.meta && error.meta.code === '42P05');
                    
                    // Check for Windows socket error
                    const isSocketError = error.message?.includes('WSAStartup') ||
                                         error.message?.includes('10093') ||
                                         error.cause?.code === 10093;
                    
                    // Check for connection errors
                    const isConnectionError = error.code === 'P1001' ||
                                             error.message?.includes("Can't reach database server") ||
                                             error.message?.includes('connection');
                    
                    // Check for connection reset error (10054)
                    const isConnectionReset = error.cause?.code === 10054 ||
                                            error.message?.includes('10054') ||
                                            error.message?.includes('ConnectionReset') ||
                                            error.message?.includes('forcibly closed') ||
                                            (error.cause && error.cause.message?.includes('forcibly closed'));
                    
                    if ((isPreparedStatementError || isSocketError || isConnectionError || isConnectionReset) && retryCount < maxRetries - 1) {
                      retryCount++;
                      const errorType = isConnectionReset ? 'Connection Reset' : 
                                      isPreparedStatementError ? 'Prepared Statement' :
                                      isSocketError ? 'Socket Error' : 'Connection Error';
                      console.warn(`Database ${errorType} error detected (attempt ${retryCount}/${maxRetries}), reconnecting...`);
                      console.warn('Error:', error.message?.substring(0, 100));
                      if (error.cause?.code) {
                        console.warn('Error code:', error.cause.code);
                      }
                      
                      try {
                        // For prepared statement errors, we need to disconnect and reconnect
                        // This clears the prepared statement cache
                        await target.$disconnect().catch(() => {}); // Ignore disconnect errors
                        // Exponential backoff: 1s, 2s, 3s
                        const backoffDelay = 1000 * retryCount;
                        await new Promise(resolve => setTimeout(resolve, backoffDelay));
                        // Reconnect - this creates a fresh connection without cached statements
                        await target.$connect();
                        // Retry the operation
                        continue; // Retry the operation
                      } catch (retryError) {
                        console.error('Reconnection failed:', retryError.message);
                        if (retryCount >= maxRetries - 1) {
                          // If reconnection fails, wrap the error with more context
                          const enhancedError = new Error(`Database operation failed after ${maxRetries} retries: ${error.message}`);
                          enhancedError.originalError = error;
                          enhancedError.code = errorCode || error.code;
                          throw enhancedError;
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
              // Check for prepared statement error (42P05) - same logic as above
              const errorCode = error.meta?.code || 
                               error.cause?.code || 
                               (error.kind?.QueryError?.PostgresError?.code) ||
                               (error.message?.match(/42P05/)?.[0]);
              const isPreparedStatementError = error.message?.includes('prepared statement') || 
                                              error.message?.includes('42P05') ||
                                              error.message?.includes('already exists') ||
                                              errorCode === '42P05' ||
                                              (error.meta && error.meta.code === '42P05');
              
              const isSocketError = error.message?.includes('WSAStartup') ||
                                   error.message?.includes('10093') ||
                                   error.cause?.code === 10093;
              
              const isConnectionError = error.code === 'P1001' ||
                                       error.message?.includes("Can't reach database server");
              
              const isConnectionReset = error.cause?.code === 10054 ||
                                       error.message?.includes('10054') ||
                                       error.message?.includes('ConnectionReset') ||
                                       error.message?.includes('forcibly closed') ||
                                       (error.cause && error.cause.message?.includes('forcibly closed'));
              
              if ((isPreparedStatementError || isSocketError || isConnectionError || isConnectionReset) && retryCount < maxRetries - 1) {
                retryCount++;
                const errorType = isConnectionReset ? 'Connection Reset' : 
                                isPreparedStatementError ? 'Prepared Statement' :
                                isSocketError ? 'Socket Error' : 'Connection Error';
                console.warn(`Database ${errorType} error in $ method (attempt ${retryCount}/${maxRetries}), reconnecting...`);
                try {
                  // Disconnect and reconnect to clear prepared statement cache
                  await target.$disconnect().catch(() => {});
                  const backoffDelay = 1000 * retryCount;
                  await new Promise(resolve => setTimeout(resolve, backoffDelay));
                  await target.$connect();
                  continue; // Retry
                } catch (retryError) {
                  console.error('Reconnection failed:', retryError.message);
                  if (retryCount >= maxRetries - 1) {
                    // Wrap error with more context
                    const enhancedError = new Error(`Database operation failed after ${maxRetries} retries: ${error.message}`);
                    enhancedError.originalError = error;
                    enhancedError.code = errorCode || error.code;
                    throw enhancedError;
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

