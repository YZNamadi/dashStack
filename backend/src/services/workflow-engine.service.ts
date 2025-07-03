import { Queue, Worker, Job } from 'bullmq';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import cron, { ScheduledTask } from 'node-cron';
import prisma from '../utils/prisma';

interface WorkflowJob {
  workflowId: string;
  projectId: string;
  input?: Record<string, unknown>;
  trigger?: string;
  scheduledAt?: Date;
}

interface WorkflowTrigger {
  id: string;
  workflowId: string;
  type: 'cron' | 'webhook' | 'datasource' | 'manual';
  config: Record<string, unknown>;
  isActive: boolean;
}

interface WorkflowResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface WorkflowStatus {
  status: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed';
  result?: unknown;
  error?: string;
}

class WorkflowEngine {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private triggers: Map<string, ScheduledTask> = new Map();
  private webhookTriggers: Map<string, string> = new Map<string, string>();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues() {
    // Main workflow queue
    const workflowQueue = new Queue('workflows', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
    console.log('Redis connected for workflow queues');

    // Scheduled workflows queue
    const scheduledQueue = new Queue('scheduled-workflows', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    this.queues.set('workflows', workflowQueue);
    this.queues.set('scheduled', scheduledQueue);

    // Initialize workers
    this.initializeWorkers();
  }

  private initializeWorkers() {
    // Main workflow worker
    const workflowWorker = new Worker('workflows', async (job: Job<WorkflowJob>) => {
      return await this.executeWorkflow(job.data);
    }, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      concurrency: 5,
    });

    // Scheduled workflow worker
    const scheduledWorker = new Worker('scheduled-workflows', async (job: Job<WorkflowJob>) => {
      return await this.executeWorkflow(job.data);
    }, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      concurrency: 3,
    });

    this.workers.set('workflows', workflowWorker);
    this.workers.set('scheduled', scheduledWorker);

    // Handle worker events
    workflowWorker.on('completed', async (job: Job<WorkflowJob>, result: unknown) => {
      await this.logWorkflowExecution(job.data.workflowId, job.data.input, result, true);
    });

    workflowWorker.on('failed', async (job: Job<WorkflowJob> | undefined, err: Error) => {
      if (job) {
        await this.logWorkflowExecution(job.data.workflowId, job.data.input, null, false, err.message);
      }
    });

    scheduledWorker.on('completed', async (job: Job<WorkflowJob>, result: unknown) => {
      await this.logWorkflowExecution(job.data.workflowId, job.data.input, result, true);
    });

    scheduledWorker.on('failed', async (job: Job<WorkflowJob> | undefined, err: Error) => {
      if (job) {
        await this.logWorkflowExecution(job.data.workflowId, job.data.input, null, false, err.message);
      }
    });
  }

  async executeWorkflow(jobData: WorkflowJob): Promise<unknown> {
    const { workflowId, input } = jobData;

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return new Promise((resolve, reject) => {
      const tempDir = tmpdir();
      const timestamp = Date.now();
      
      if (workflow.type === 'Python') {
        this.executePythonWorkflow(workflow, input, tempDir, timestamp, resolve, reject);
      } else if (workflow.type === 'JavaScript') {
        this.executeJavaScriptWorkflow(workflow, input, tempDir, timestamp, resolve, reject);
      } else {
        reject(new Error(`Unsupported workflow type: ${workflow.type}`));
      }
    });
  }

  private executePythonWorkflow(
    workflow: { code: string; type: string }, 
    input: Record<string, unknown> | undefined, 
    tempDir: string, 
    timestamp: number, 
    resolve: (value: unknown) => void, 
    reject: (error: Error) => void
  ): void {
    const pythonFile = join(tempDir, `workflow_${timestamp}.py`);
    const pythonCode = `
import json
import sys
import requests
from datetime import datetime

# Input data
input_data = ${JSON.stringify(input)}

def run(input):
${workflow.code.split('\n').map((line: string) => `    ${line}`).join('\n')}

try:
    result = run(input_data)
    print(json.dumps({"success": True, "data": result}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

    writeFileSync(pythonFile, pythonCode);

    const pythonProcess = spawn('python', [pythonFile]);
    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      try {
        unlinkSync(pythonFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${error}`));
        return;
      }

      try {
        const result = JSON.parse(output.trim()) as WorkflowResult;
        if (result.success) {
          resolve(result.data);
        } else {
          reject(new Error(result.error));
        }
      } catch (e) {
        reject(new Error(`Invalid JSON output: ${output}`));
      }
    });
  }

  private executeJavaScriptWorkflow(
    workflow: { code: string; type: string },
    input: Record<string, unknown> | undefined,
    tempDir: string,
    timestamp: number,
    resolve: (value: unknown) => void,
    reject: (error: Error) => void
  ): void {
    const jsFile = join(tempDir, `workflow_${timestamp}.js`);
    const jsCode = `
const input = ${JSON.stringify(input)};

async function run(input) {
${workflow.code}
}

(async () => {
  try {
    const result = await run(input);
    console.log(JSON.stringify({ success: true, data: result }));
  } catch (error) {
    console.log(JSON.stringify({ success: false, error: error.message }));
  }
})();
`;

    writeFileSync(jsFile, jsCode);

    const nodeProcess = spawn('node', [jsFile]);
    let output = '';
    let error = '';

    nodeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    nodeProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    nodeProcess.on('close', (code) => {
      try {
        unlinkSync(jsFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (code !== 0) {
        reject(new Error(`Node.js process exited with code ${code}: ${error}`));
        return;
      }

      try {
        const result = JSON.parse(output.trim()) as WorkflowResult;
        if (result.success) {
          resolve(result.data);
        } else {
          reject(new Error(result.error));
        }
      } catch (e) {
        reject(new Error(`Invalid JSON output: ${output}`));
      }
    });
  }

  async runWorkflow(workflowId: string, projectId: string, input?: Record<string, unknown>): Promise<string> {
    const queue = this.queues.get('workflows');
    if (!queue) {
      throw new Error('Workflow queue not initialized');
    }

    const job = await queue.add('workflow', { workflowId, projectId, input });
    if (!job.id) {
      throw new Error('Failed to create job');
    }
    return job.id;
  }

  async scheduleWorkflow(workflowId: string, projectId: string, cronExpression: string): Promise<void> {
    if (!cron.validate(cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    // Stop any existing trigger for this workflow
    await this.stopWorkflowTrigger(workflowId);

    // Create a new cron task
    const task = cron.schedule(cronExpression, async () => {
      const queue = this.queues.get('scheduled');
      if (queue) {
        await queue.add('scheduled-workflow', { workflowId, projectId });
      }
    });

    this.triggers.set(workflowId, task);

    // Update workflow trigger in database
    await prisma.workflowTrigger.create({
      data: {
        workflowId,
        type: 'cron',
        config: { cronExpression },
        isActive: true,
      },
    });
  }

  async createWebhookTrigger(workflowId: string, projectId: string, webhookPath: string): Promise<string> {
    const webhookId = `wh_${Math.random().toString(36).substr(2, 9)}`;
    this.webhookTriggers.set(webhookId, workflowId);

    // Store webhook trigger in database
    await prisma.workflowTrigger.create({
      data: {
        workflowId,
        type: 'webhook',
        config: { webhookId, path: webhookPath },
        isActive: true,
      },
    });

    return webhookId;
  }

  async triggerWebhook(webhookId: string, payload: Record<string, unknown>): Promise<string> {
    const workflowId = this.webhookTriggers.get(webhookId)!;
    if (!workflowId) {
      throw new Error('Webhook not found');
    }

    const trigger = await prisma.workflowTrigger.findFirst({
      where: { workflowId, type: 'webhook' },
      include: { workflow: true },
    });

    if (!trigger || !trigger.isActive || !trigger.workflow) {
      throw new Error('Webhook trigger not found or inactive');
    }

    return await this.runWorkflow(workflowId, trigger.workflow.projectId, payload);
  }

  async stopWorkflowTrigger(workflowId: string): Promise<void> {
    // Stop and remove cron task if exists
    const task = this.triggers.get(workflowId);
    if (task) {
      task.stop();
      this.triggers.delete(workflowId);
    }

    // Remove webhook trigger if exists
    for (const [webhookId, wfId] of this.webhookTriggers.entries()) {
      if (wfId === workflowId) {
        this.webhookTriggers.delete(webhookId);
      }
    }

    // Update trigger status in database
    await prisma.workflowTrigger.updateMany({
      where: { workflowId },
      data: { isActive: false },
    });
  }

  private async logWorkflowExecution(
    workflowId: string,
    input: Record<string, unknown> | undefined,
    output: unknown,
    success: boolean,
    error?: string,
    executionTimeMs?: number
  ): Promise<void> {
    const log = {
      timestamp: new Date().toISOString(),
      input: input ? JSON.stringify(input) : null,
      output: output ? JSON.stringify(output) : null,
      success,
      error: error || null,
      executionTimeMs: executionTimeMs || null,
    };

    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        logs: {
          push: log,
        },
      },
    });
  }

  async getWorkflowStatus(jobId: string): Promise<WorkflowStatus> {
    const [workflowJob, scheduledJob] = await Promise.all([
      this.queues.get('workflows')?.getJob(jobId),
      this.queues.get('scheduled')?.getJob(jobId),
    ]);

    const job = workflowJob || scheduledJob;
    if (!job) {
      throw new Error('Job not found');
    }

    const state = await job.getState();
    const result = job.returnvalue;
    const error = job.failedReason;

    return {
      status: state,
      result,
      error,
    };
  }

  async getQueueStats(): Promise<QueueStats> {
    const workflowQueue = this.queues.get('workflows');
    if (!workflowQueue) {
      throw new Error('Workflow queue not initialized');
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      workflowQueue.getWaitingCount(),
      workflowQueue.getActiveCount(),
      workflowQueue.getCompletedCount(),
      workflowQueue.getFailedCount(),
      workflowQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  async shutdown(): Promise<void> {
    // Stop all cron tasks
    for (const task of this.triggers.values()) {
      task.stop();
    }
    this.triggers.clear();

    // Close all workers
    await Promise.all(Array.from(this.workers.values()).map(worker => worker.close()));
    this.workers.clear();

    // Close all queues
    await Promise.all(Array.from(this.queues.values()).map(queue => queue.close()));
    this.queues.clear();
  }
}

export const workflowEngine = new WorkflowEngine(); 