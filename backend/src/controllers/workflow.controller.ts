import { Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { workflowEngine } from '../services/workflow-engine.service';

export const createWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId } = req.params;
    const { name, trigger, type, code, description } = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: user.userId } });
    if (!project) {
        res.status(404).json({ message: 'Project not found or you do not have access' });
        return;
    }

    const workflow = await prisma.workflow.create({
      data: {
        projectId,
        name,
        trigger,
        type,
        code,
        description,
        logs: [],
      },
    });
    res.status(201).json(workflow);
  } catch (error) {
    next(error);
  }
};

export const getWorkflows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId } = req.params;

    // Verify project ownership
    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: user.userId } });
    if (!project) {
        res.status(404).json({ message: 'Project not found or you do not have access' });
        return;
    }

    const workflows = await prisma.workflow.findMany({
      where: { projectId },
      include: {
        triggers: true,
      },
    });
    res.json(workflows);
  } catch (error) {
    next(error);
  }
};

export const getWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId, workflowId } = req.params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        projectId,
        project: { ownerId: user.userId },
      },
      include: {
        triggers: true,
      },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found or you do not have access' });
      return;
    }

    res.json(workflow);
  } catch (error) {
    next(error);
  }
};

export const updateWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId, workflowId } = req.params;
    const { name, trigger, type, code, description } = req.body;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        projectId,
        project: { ownerId: user.userId },
      },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found or you do not have access' });
      return;
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        name,
        trigger,
        type,
        code,
        description,
      },
    });

    res.json(updatedWorkflow);
  } catch (error) {
    next(error);
  }
};

export const runWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId, workflowId } = req.params;
    const { input } = req.body;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        projectId,
        project: { ownerId: user.userId },
      },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found or you do not have access' });
      return;
    }

    // For /run endpoint: execute synchronously and return result
    try {
      const result = await workflowEngine.executeWorkflow({ workflowId, projectId, input });
      await workflowEngine["logWorkflowExecution"](workflowId, input, result, true);
      res.json(result);
    } catch (err) {
      await workflowEngine["logWorkflowExecution"](workflowId, input, null, false, err instanceof Error ? err.message : String(err));
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const getWorkflowStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { jobId } = req.params;

    const status = await workflowEngine.getWorkflowStatus(jobId);
    res.json(status);
  } catch (error) {
    next(error);
  }
};

export const scheduleWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId, workflowId } = req.params;
    const { cronExpression } = req.body;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        projectId,
        project: { ownerId: user.userId },
      },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found or you do not have access' });
      return;
    }

    await workflowEngine.scheduleWorkflow(workflowId, projectId, cronExpression);
    
    res.json({ 
      message: 'Workflow scheduled successfully', 
      cronExpression,
      workflowId 
    });
  } catch (error) {
    next(error);
  }
};

export const createWebhookTrigger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId, workflowId } = req.params;
    const { webhookPath } = req.body;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        projectId,
        project: { ownerId: user.userId },
      },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found or you do not have access' });
      return;
    }

    const webhookId = await workflowEngine.createWebhookTrigger(workflowId, projectId, webhookPath);
    
    res.json({ 
      message: 'Webhook trigger created successfully', 
      webhookId,
      webhookPath,
      workflowId 
    });
  } catch (error) {
    next(error);
  }
};

export const triggerWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { webhookId } = req.params;
    const payload = req.body;

    const jobId = await workflowEngine.triggerWebhook(webhookId, payload);
    
    res.json({ 
      message: 'Webhook triggered successfully', 
      jobId,
      webhookId 
    });
  } catch (error) {
    next(error);
  }
};

export const stopWorkflowTrigger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId, workflowId } = req.params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        projectId,
        project: { ownerId: user.userId },
      },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found or you do not have access' });
      return;
    }

    await workflowEngine.stopWorkflowTrigger(workflowId);
    
    res.json({ 
      message: 'Workflow trigger stopped successfully', 
      workflowId 
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflowLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId, workflowId } = req.params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        projectId,
        project: { ownerId: user.userId },
      },
      select: { logs: true },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found or you do not have access' });
      return;
    }

    res.json(workflow.logs || []);
  } catch (error) {
    next(error);
  }
};

export const getWorkflowStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: user.userId } });
    if (!project) {
      res.status(404).json({ message: 'Project not found or you do not have access' });
      return;
    }

    const workflows = await prisma.workflow.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        logs: true,
        triggers: true,
      },
    });

    // Remove the Workflow type annotation since it's not defined or imported
    const stats = (workflows: any[]) => {
      return {
        totalWorkflows: workflows.length,

        activeTriggers: workflows.filter(
          (w) => Array.isArray(w.triggers) && w.triggers.some((t: any) => t && t.isActive)
        ).length,

        totalExecutions: workflows.reduce(
          (sum, w) => sum + (Array.isArray(w.logs) ? w.logs.length : 0),
          0
        ),

        successfulExecutions: workflows.reduce(
          (sum, w) =>
            sum +
            (Array.isArray(w.logs)
              ? w.logs.filter((log: { success?: boolean }) => log.success).length
              : 0),
          0
        ),

        failedExecutions: workflows.reduce(
          (sum, w) =>
            sum +
            (Array.isArray(w.logs)
              ? w.logs.filter((log: { success?: boolean }) => !log.success).length
              : 0),
          0
        ),

        recentExecutions: workflows
          .flatMap((w) =>
            (Array.isArray(w.logs) ? w.logs : [])
              .slice(-5)
              .map((log: any) => ({
                workflowId: w.id,
                workflowName: w.name,
                ...log,
              }))
          )
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 10),
      };
    };

    res.json(stats(workflows));
  } catch (error) {
    next(error);
  }
};

export const getQueueStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const stats = await workflowEngine.getQueueStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { projectId, workflowId } = req.params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        projectId,
        project: { ownerId: user.userId },
      },
    });
    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found or you do not have access' });
      return;
    }

    // Stop any active triggers
    await workflowEngine.stopWorkflowTrigger(workflowId);

    await prisma.workflow.delete({ where: { id: workflowId } });
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Legacy execution function (kept for backward compatibility)
async function executeWorkflow(workflow: any, input: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const tempDir = tmpdir();
    const timestamp = Date.now();
    
    if (workflow.type === 'Python') {
      // Create Python file
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
          const result = JSON.parse(output.trim());
          if (result.success) {
            resolve(result.data);
          } else {
            reject(new Error(result.error));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON output: ${output}`));
        }
      });
    } else if (workflow.type === 'JavaScript') {
      // Create JavaScript file
      const jsFile = join(tempDir, `workflow_${timestamp}.js`);
      const jsCode = `
const input = ${JSON.stringify(input)};

async function run(input) {
${workflow.code}
}

run(input)
  .then(result => {
    console.log(JSON.stringify({ success: true, data: result }));
  })
  .catch(error => {
    console.log(JSON.stringify({ success: false, error: error.message }));
  });
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
          reject(new Error(`Node process exited with code ${code}: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          if (result.success) {
            resolve(result.data);
          } else {
            reject(new Error(result.error));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON output: ${output}`));
        }
      });
    } else {
      reject(new Error(`Unsupported workflow type: ${workflow.type}`));
    }
  });
} 