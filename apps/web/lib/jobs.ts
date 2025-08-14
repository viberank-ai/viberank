import crypto from 'node:crypto';

export type JobState = 'queued' | 'running' | 'done' | 'error';
export type Job<T = unknown> = {
  id: string;
  state: JobState;
  progress: number;
  createdAt: number;
  result?: T;
  error?: string;
};

const jobs = new Map<string, Job>();

export function createJob(): Job {
  const id = crypto.randomUUID();
  const job: Job = { id, state: 'queued', progress: 0, createdAt: Date.now() };
  jobs.set(id, job);
  return job;
}
export function getJob(id: string) {
  return jobs.get(id) || null;
}
export function updateJob<T>(id: string, patch: Partial<Job<T>>) {
  const j = jobs.get(id);
  if (!j) return;
  Object.assign(j, patch);
  jobs.set(id, j);
}
