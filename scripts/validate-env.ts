#!/usr/bin/env tsx

/**
 * Environment Variable Validation Script
 * 
 * Validates that all required environment variables are set
 * and properly configured for the deployment environment.
 * 
 * Requirements: 8.1, 8.4
 */

interface EnvVariable {
  name: string;
  required: boolean;
  environments: ('development' | 'preview' | 'production')[];
  description: string;
  validate?: (value: string) => boolean;
}

const ENV_VARIABLES: EnvVariable[] = [
  {
    name: 'NEON_DATABASE_URL',
    required: true,
    environments: ['production'],
    description: 'Production database connection string',
    validate: (value) => value.startsWith('postgresql://'),
  },
  {
    name: 'NEON_DEV_DATABASE_URL',
    required: true,
    environments: ['development', 'preview'],
    description: 'Development database connection string',
    validate: (value) => value.startsWith('postgresql://'),
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    environments: ['development', 'preview', 'production'],
    description: 'NextAuth.js secret key for session encryption',
    validate: (value) => value.length >= 32,
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    environments: ['development', 'preview', 'production'],
    description: 'Application URL for authentication callbacks',
    validate: (value) => value.startsWith('http://') || value.startsWith('https://'),
  },
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    required: false,
    environments: ['development', 'preview', 'production'],
    description: 'Vercel Blob storage token for file uploads',
  },
  {
    name: 'NODE_ENV',
    required: true,
    environments: ['development', 'preview', 'production'],
    description: 'Node environment (development, production)',
  },
];

class EnvValidator {
  private environment: string;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Validate all environment variables
   */
  validate(): boolean {
    console.log('\n================================');
    console.log('🔍 Environment Variable Validation');
    console.log('================================\n');
    console.log(`Environment: ${this.environment}\n`);

    const relevantVars = ENV_VARIABLES.filter((envVar) =>
      envVar.environments.includes(this.environment as any)
    );

    for (const envVar of relevantVars) {
      this.validateVariable(envVar);
    }

    this.printResults();

    return this.errors.length === 0;
  }

  /**
   * Validate a single environment variable
   */
  private validateVariable(envVar: EnvVariable): void {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (envVar.required && !value) {
      this.errors.push(
        `❌ ${envVar.name} is required but not set\n   ${envVar.description}`
      );
      return;
    }

    // Check if optional variable is missing
    if (!envVar.required && !value) {
      this.warnings.push(
        `⚠️  ${envVar.name} is not set (optional)\n   ${envVar.description}`
      );
      return;
    }

    // Validate value format if validator is provided
    if (value && envVar.validate && !envVar.validate(value)) {
      this.errors.push(
        `❌ ${envVar.name} has invalid format\n   ${envVar.description}`
      );
      return;
    }

    // Variable is valid
    console.log(`✅ ${envVar.name}`);
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log('\n================================');
    console.log('📊 Validation Results');
    console.log('================================\n');

    if (this.warnings.length > 0) {
      console.log('Warnings:\n');
      this.warnings.forEach((warning) => console.log(warning + '\n'));
    }

    if (this.errors.length > 0) {
      console.log('Errors:\n');
      this.errors.forEach((error) => console.log(error + '\n'));
      console.log('================================');
      console.log('❌ Validation Failed');
      console.log('================================\n');
    } else {
      console.log('================================');
      console.log('✅ Validation Passed');
      console.log('================================\n');
    }
  }

  /**
   * Generate .env.example file
   */
  generateExample(): void {
    console.log('\n================================');
    console.log('📝 Generating .env.example');
    console.log('================================\n');

    let content = '# Environment Variables\n\n';

    const groupedVars = this.groupByEnvironment();

    for (const [env, vars] of Object.entries(groupedVars)) {
      content += `# ${env.toUpperCase()} Environment\n`;
      for (const envVar of vars) {
        content += `# ${envVar.description}\n`;
        if (envVar.required) {
          content += `${envVar.name}=\n\n`;
        } else {
          content += `# ${envVar.name}=\n\n`;
        }
      }
    }

    console.log(content);
    console.log('Copy this content to .env.example file\n');
  }

  /**
   * Group variables by environment
   */
  private groupByEnvironment(): Record<string, EnvVariable[]> {
    const grouped: Record<string, EnvVariable[]> = {
      development: [],
      preview: [],
      production: [],
    };

    for (const envVar of ENV_VARIABLES) {
      for (const env of envVar.environments) {
        if (!grouped[env].includes(envVar)) {
          grouped[env].push(envVar);
        }
      }
    }

    return grouped;
  }

  /**
   * Check database connectivity
   */
  async checkDatabaseConnection(): Promise<boolean> {
    console.log('\n================================');
    console.log('🔌 Database Connection Check');
    console.log('================================\n');

    const dbUrl =
      this.environment === 'production'
        ? process.env.NEON_DATABASE_URL
        : process.env.NEON_DEV_DATABASE_URL;

    if (!dbUrl) {
      console.log('❌ Database URL not configured\n');
      return false;
    }

    try {
      // Try to import and use the database connection
      const { checkConnection } = await import('../src/db/connection');
      const isConnected = await checkConnection();

      if (isConnected) {
        console.log('✅ Database connection successful\n');
        return true;
      } else {
        console.log('❌ Database connection failed\n');
        return false;
      }
    } catch (error) {
      console.log('❌ Database connection error:', error);
      console.log('');
      return false;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const validator = new EnvValidator();

  switch (command) {
    case 'generate':
      validator.generateExample();
      break;

    case 'check-db':
      const dbConnected = await validator.checkDatabaseConnection();
      process.exit(dbConnected ? 0 : 1);
      break;

    case 'validate':
    default:
      const isValid = validator.validate();
      
      if (args.includes('--check-db')) {
        const dbConnected = await validator.checkDatabaseConnection();
        process.exit(isValid && dbConnected ? 0 : 1);
      } else {
        process.exit(isValid ? 0 : 1);
      }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { EnvValidator };
