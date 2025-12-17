// Job progress tracking service
// In production, this would be Redis or database

// In-memory job tracking
const jobProgress = new Map<string, {
  id: string;
  userId: string;
  stage: 'uploading' | 'parsing' | 'extracting' | 'validating' | 'saving' | 'complete' | 'error';
  progress: number;
  message: string;
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}>();

export function createJob(userId: string, type: 'url' | 'document'): string {
  const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  jobProgress.set(jobId, {
    id: jobId,
    userId,
    stage: 'uploading',
    progress: 0,
    message: 'Starting ingestion process...',
    startTime: new Date()
  });

  return jobId;
}

export function updateJobProgress(
  jobId: string,
  stage: 'uploading' | 'parsing' | 'extracting' | 'validating' | 'saving' | 'complete' | 'error',
  progress: number,
  message: string,
  result?: any,
  error?: string
) {
  const job = jobProgress.get(jobId);
  if (!job) return;

  job.stage = stage;
  job.progress = progress;
  job.message = message;
  
  if (result) job.result = result;
  if (error) job.error = error;
  
  if (stage === 'complete' || stage === 'error') {
    job.endTime = new Date();
  }
}

export function getJob(jobId: string) {
  return jobProgress.get(jobId);
}

export function cleanupOldJobs() {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  const entries = Array.from(jobProgress.entries());
  for (const [jobId, job] of entries) {
    const age = now.getTime() - job.startTime.getTime();
    if (age > maxAge) {
      jobProgress.delete(jobId);
    }
  }
}

// Clean up old jobs every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldJobs, 60 * 60 * 1000);
}