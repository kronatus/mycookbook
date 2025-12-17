#!/usr/bin/env tsx

/**
 * Automated Deployment Script
 * 
 * Features:
 * - Analyzes code changes and generates intelligent commit messages
 * - Automated git staging, commit, and push
 * - Vercel deployment verification with health checks
 * - Rollback mechanism for failed deployments
 * 
 * Requirements: 8.1, 8.4
 */

import { execSync, spawn } from 'child_process';
import * as readline from 'readline';

interface ChangeAnalysis {
  added: string[];
  modified: string[];
  deleted: string[];
  renamed: string[];
}

interface CommitInfo {
  type: string;
  scope?: string;
  description: string;
}

interface DeploymentResult {
  success: boolean;
  url?: string;
  error?: string;
}

class DeploymentScript {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Execute shell command and return output
   */
  private exec(command: string, silent = false): string {
    try {
      return execSync(command, {
        encoding: 'utf-8',
        stdio: silent ? 'pipe' : 'inherit',
      }).trim();
    } catch (error) {
      if (!silent) {
        console.error(`Command failed: ${command}`);
      }
      throw error;
    }
  }

  /**
   * Execute shell command and return output (silent mode)
   */
  private execSilent(command: string): string {
    try {
      return execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Prompt user for input
   */
  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Check if git is installed and repository is initialized
   */
  private checkGitSetup(): boolean {
    try {
      this.execSilent('git --version');
      this.execSilent('git rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Analyze git changes and categorize them
   */
  private analyzeChanges(): ChangeAnalysis {
    const status = this.execSilent('git status --porcelain');
    
    const changes: ChangeAnalysis = {
      added: [],
      modified: [],
      deleted: [],
      renamed: [],
    };

    if (!status) {
      return changes;
    }

    const lines = status.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const statusCode = line.substring(0, 2).trim();
      const file = line.substring(3);

      switch (statusCode) {
        case 'A':
          changes.added.push(file);
          break;
        case 'M':
        case 'AM':
          changes.modified.push(file);
          break;
        case 'D':
          changes.deleted.push(file);
          break;
        case 'R':
          changes.renamed.push(file);
          break;
        case '??':
          changes.added.push(file);
          break;
      }
    }

    return changes;
  }

  /**
   * Generate intelligent commit message based on changes
   */
  private generateCommitMessage(changes: ChangeAnalysis): CommitInfo {
    const allFiles = [
      ...changes.added,
      ...changes.modified,
      ...changes.deleted,
      ...changes.renamed,
    ];

    let commitType = 'chore';
    let scope: string | undefined;
    let description = 'update files';

    // Pattern matching for commit type determination
    const patterns = [
      { regex: /test|spec/i, type: 'test', desc: 'update tests' },
      { regex: /\.md$|docs\//i, type: 'docs', desc: 'update documentation' },
      { regex: /components\//i, type: 'feat', scope: 'ui', desc: 'update UI components' },
      { regex: /app\/api\//i, type: 'feat', scope: 'api', desc: 'update API endpoints' },
      { regex: /src\/services\//i, type: 'feat', scope: 'services', desc: 'update services' },
      { regex: /src\/db\/|drizzle/i, type: 'feat', scope: 'db', desc: 'update database schema' },
      { regex: /\.github\//i, type: 'ci', desc: 'update CI/CD configuration' },
      { regex: /scripts\//i, type: 'chore', scope: 'scripts', desc: 'update build scripts' },
      { regex: /\.config\.|\.json$|\.yml$/i, type: 'chore', scope: 'config', desc: 'update configuration' },
    ];

    // Check patterns in order of priority
    for (const pattern of patterns) {
      if (allFiles.some(file => pattern.regex.test(file))) {
        commitType = pattern.type;
        if (pattern.scope) scope = pattern.scope;
        description = pattern.desc;
        break;
      }
    }

    // Special case: mostly additions = new feature
    if (changes.added.length > changes.modified.length && 
        changes.added.length > changes.deleted.length &&
        commitType === 'chore') {
      commitType = 'feat';
      description = 'add new files';
    }

    // Special case: mostly deletions = cleanup
    if (changes.deleted.length > changes.added.length && 
        changes.deleted.length > changes.modified.length) {
      commitType = 'chore';
      description = 'remove unused files';
    }

    // Special case: single file change
    if (changes.modified.length === 1 && 
        changes.added.length === 0 && 
        changes.deleted.length === 0) {
      const fileName = changes.modified[0].split('/').pop() || changes.modified[0];
      description = `update ${fileName}`;
    } else if (changes.added.length === 1 && 
               changes.modified.length === 0 && 
               changes.deleted.length === 0) {
      const fileName = changes.added[0].split('/').pop() || changes.added[0];
      description = `add ${fileName}`;
    } else if (changes.deleted.length === 1 && 
               changes.added.length === 0 && 
               changes.modified.length === 0) {
      const fileName = changes.deleted[0].split('/').pop() || changes.deleted[0];
      description = `remove ${fileName}`;
    }

    return { type: commitType, scope, description };
  }

  /**
   * Format commit message
   */
  private formatCommitMessage(info: CommitInfo): string {
    let message = info.type;
    if (info.scope) {
      message += `(${info.scope})`;
    }
    message += `: ${info.description}`;
    return message;
  }

  /**
   * Stage, commit, and push changes
   */
  private async commitAndPush(commitMessage: string): Promise<boolean> {
    try {
      console.log('\n📦 Staging changes...');
      this.exec('git add .');

      console.log('💾 Creating commit...');
      this.exec(`git commit -m "${commitMessage}"`);

      const currentBranch = this.execSilent('git branch --show-current');
      console.log(`\n🚀 Pushing to origin/${currentBranch}...`);

      // Check if upstream is set
      const upstream = this.execSilent('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
      
      if (upstream) {
        this.exec('git push');
      } else {
        this.exec(`git push -u origin ${currentBranch}`);
      }

      console.log('✅ Successfully pushed to GitHub!\n');
      return true;
    } catch (error) {
      console.error('❌ Failed to commit and push changes');
      return false;
    }
  }

  /**
   * Get the last commit hash for rollback
   */
  private getLastCommitHash(): string {
    return this.execSilent('git rev-parse HEAD');
  }

  /**
   * Rollback to previous commit
   */
  private async rollback(commitHash: string): Promise<boolean> {
    try {
      console.log('\n⚠️  Initiating rollback...');
      console.log(`Rolling back to commit: ${commitHash.substring(0, 7)}`);
      
      this.exec(`git reset --hard ${commitHash}`);
      this.exec('git push --force');
      
      console.log('✅ Rollback completed successfully\n');
      return true;
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }

  /**
   * Wait for Vercel deployment to complete
   */
  private async waitForDeployment(maxWaitTime = 300000): Promise<DeploymentResult> {
    console.log('\n⏳ Waiting for Vercel deployment...');
    console.log('(This may take a few minutes)');
    
    const startTime = Date.now();
    let attempts = 0;
    
    while (Date.now() - startTime < maxWaitTime) {
      attempts++;
      
      // Wait 10 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Try to get deployment URL from Vercel CLI if available
      const deploymentUrl = this.execSilent('vercel ls --json 2>/dev/null | head -1');
      
      if (deploymentUrl) {
        try {
          const deployment = JSON.parse(deploymentUrl);
          if (deployment.url) {
            return { success: true, url: `https://${deployment.url}` };
          }
        } catch {
          // Continue waiting
        }
      }
      
      if (attempts % 3 === 0) {
        console.log(`Still waiting... (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`);
      }
    }
    
    return { 
      success: false, 
      error: 'Deployment timeout - please check Vercel dashboard manually' 
    };
  }

  /**
   * Verify deployment health
   */
  private async verifyDeployment(url: string): Promise<boolean> {
    console.log('\n🏥 Running health checks...');
    
    try {
      // Use curl to check health endpoint
      const healthUrl = `${url}/api/health`;
      console.log(`Checking: ${healthUrl}`);
      
      const response = this.execSilent(`curl -s -o /dev/null -w "%{http_code}" ${healthUrl}`);
      
      if (response === '200') {
        console.log('✅ Health check passed!');
        
        // Get detailed health info
        const healthData = this.execSilent(`curl -s ${healthUrl}`);
        try {
          const health = JSON.parse(healthData);
          console.log(`   Status: ${health.status}`);
          console.log(`   Database: ${health.database}`);
          console.log(`   Version: ${health.version}`);
        } catch {
          // Ignore JSON parse errors
        }
        
        return true;
      } else {
        console.log(`❌ Health check failed with status: ${response}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Main deployment flow
   */
  async run(): Promise<void> {
    console.log('\n================================');
    console.log('🚀 Automated Deployment Script');
    console.log('================================\n');

    // Check git setup
    if (!this.checkGitSetup()) {
      console.error('❌ Error: Git is not installed or not initialized');
      console.error('Run setup-github script first to initialize the repository');
      this.rl.close();
      process.exit(1);
    }

    // Analyze changes
    const changes = this.analyzeChanges();
    const totalChanges = changes.added.length + changes.modified.length + 
                        changes.deleted.length + changes.renamed.length;

    if (totalChanges === 0) {
      console.log('ℹ️  No changes to commit');
      this.rl.close();
      process.exit(0);
    }

    // Display changes summary
    console.log('📊 Changes detected:');
    if (changes.added.length > 0) {
      console.log(`   ✨ Added: ${changes.added.length} file(s)`);
    }
    if (changes.modified.length > 0) {
      console.log(`   📝 Modified: ${changes.modified.length} file(s)`);
    }
    if (changes.deleted.length > 0) {
      console.log(`   🗑️  Deleted: ${changes.deleted.length} file(s)`);
    }
    if (changes.renamed.length > 0) {
      console.log(`   📋 Renamed: ${changes.renamed.length} file(s)`);
    }

    // Generate commit message
    const commitInfo = this.generateCommitMessage(changes);
    const commitMessage = this.formatCommitMessage(commitInfo);

    console.log('\n💬 Proposed commit message:');
    console.log(`   ${commitMessage}\n`);

    // Ask for confirmation
    const choice = await this.prompt('Use this message? (y/n/custom): ');

    let finalCommitMessage = commitMessage;
    if (choice.toLowerCase() === 'custom' || choice.toLowerCase() === 'c') {
      finalCommitMessage = await this.prompt('Enter custom commit message: ');
    } else if (choice.toLowerCase() !== 'y') {
      console.log('❌ Deployment cancelled');
      this.rl.close();
      process.exit(0);
    }

    // Store current commit for potential rollback
    const previousCommit = this.getLastCommitHash();

    // Commit and push
    const pushSuccess = await this.commitAndPush(finalCommitMessage);
    if (!pushSuccess) {
      console.error('❌ Failed to push changes');
      this.rl.close();
      process.exit(1);
    }

    // Ask if user wants to verify deployment
    const verify = await this.prompt('Wait for and verify Vercel deployment? (y/n): ');
    
    if (verify.toLowerCase() === 'y') {
      // Wait for deployment
      const deployment = await this.waitForDeployment();
      
      if (!deployment.success) {
        console.error(`❌ ${deployment.error}`);
        
        const rollbackChoice = await this.prompt('Rollback changes? (y/n): ');
        if (rollbackChoice.toLowerCase() === 'y') {
          await this.rollback(previousCommit);
        }
        
        this.rl.close();
        process.exit(1);
      }

      // Verify deployment health
      if (deployment.url) {
        const healthy = await this.verifyDeployment(deployment.url);
        
        if (!healthy) {
          console.error('\n❌ Deployment health check failed!');
          
          const rollbackChoice = await this.prompt('Rollback changes? (y/n): ');
          if (rollbackChoice.toLowerCase() === 'y') {
            await this.rollback(previousCommit);
          }
          
          this.rl.close();
          process.exit(1);
        }

        console.log('\n✅ Deployment successful and healthy!');
        console.log(`🌐 URL: ${deployment.url}\n`);
      }
    } else {
      console.log('\n✅ Changes pushed successfully!');
      console.log('ℹ️  Check Vercel dashboard for deployment status\n');
    }

    console.log('================================');
    console.log('✨ Done!');
    console.log('================================\n');

    this.rl.close();
  }
}

// Run the script
const script = new DeploymentScript();
script.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
