import { Response } from 'express';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createWorkflow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { name, trigger, type, code } = req.body;

  try {
    const workflow = await prisma.workflow.create({
      data: {
        projectId,
        name,
        trigger,
        type,
        code,
        logs: [],
      },
    });
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Error creating workflow', error });
  }
};

export const getWorkflows = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;

  try {
    const workflows = await prisma.workflow.findMany({
      where: { projectId },
    });
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workflows', error });
  }
};

export const runWorkflow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { workflowId } = req.params;
  const { input } = req.body;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found' });
      return;
    }

    const result = await executeWorkflow(workflow, input);
    
    // Log the execution
    const logs = workflow.logs as any[] || [];
    logs.push({
      timestamp: new Date().toISOString(),
      input,
      output: result,
      success: !result.error,
    });

    await prisma.workflow.update({
      where: { id: workflowId },
      data: { logs },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Error running workflow', error: error.message });
  }
};

export const scheduleWorkflow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { workflowId } = req.params;
  const { cronExpression } = req.body;

  try {
    // TODO: Implement with BullMQ for proper job scheduling
    res.json({ message: 'Workflow scheduled successfully', cronExpression });
  } catch (error: any) {
    res.status(500).json({ message: 'Error scheduling workflow', error: error.message });
  }
};

export const getWorkflowLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { workflowId } = req.params;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { logs: true },
    });

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found' });
      return;
    }

    res.json(workflow.logs || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workflow logs', error });
  }
};

// Core workflow execution engine
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