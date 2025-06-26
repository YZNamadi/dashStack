"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowLogs = exports.scheduleWorkflow = exports.runWorkflow = exports.getWorkflows = exports.createWorkflow = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const prisma_1 = __importDefault(require("../utils/prisma"));
const createWorkflow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { name, trigger, type, code } = req.body;
    try {
        const workflow = yield prisma_1.default.workflow.create({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating workflow', error });
    }
});
exports.createWorkflow = createWorkflow;
const getWorkflows = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    try {
        const workflows = yield prisma_1.default.workflow.findMany({
            where: { projectId },
        });
        res.json(workflows);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching workflows', error });
    }
});
exports.getWorkflows = getWorkflows;
const runWorkflow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workflowId } = req.params;
    const { input } = req.body;
    try {
        const workflow = yield prisma_1.default.workflow.findUnique({
            where: { id: workflowId },
        });
        if (!workflow) {
            res.status(404).json({ message: 'Workflow not found' });
            return;
        }
        const result = yield executeWorkflow(workflow, input);
        // Log the execution
        const logs = workflow.logs || [];
        logs.push({
            timestamp: new Date().toISOString(),
            input,
            output: result,
            success: !result.error,
        });
        yield prisma_1.default.workflow.update({
            where: { id: workflowId },
            data: { logs },
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Error running workflow', error: error.message });
    }
});
exports.runWorkflow = runWorkflow;
const scheduleWorkflow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workflowId } = req.params;
    const { cronExpression } = req.body;
    try {
        // TODO: Implement with BullMQ for proper job scheduling
        res.json({ message: 'Workflow scheduled successfully', cronExpression });
    }
    catch (error) {
        res.status(500).json({ message: 'Error scheduling workflow', error: error.message });
    }
});
exports.scheduleWorkflow = scheduleWorkflow;
const getWorkflowLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workflowId } = req.params;
    try {
        const workflow = yield prisma_1.default.workflow.findUnique({
            where: { id: workflowId },
            select: { logs: true },
        });
        if (!workflow) {
            res.status(404).json({ message: 'Workflow not found' });
            return;
        }
        res.json(workflow.logs || []);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching workflow logs', error });
    }
});
exports.getWorkflowLogs = getWorkflowLogs;
// Core workflow execution engine
function executeWorkflow(workflow, input) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const tempDir = (0, os_1.tmpdir)();
            const timestamp = Date.now();
            if (workflow.type === 'Python') {
                // Create Python file
                const pythonFile = (0, path_1.join)(tempDir, `workflow_${timestamp}.py`);
                const pythonCode = `
import json
import sys
import requests
from datetime import datetime

# Input data
input_data = ${JSON.stringify(input)}

def run(input):
${workflow.code.split('\n').map((line) => `    ${line}`).join('\n')}

try:
    result = run(input_data)
    print(json.dumps({"success": True, "data": result}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
                (0, fs_1.writeFileSync)(pythonFile, pythonCode);
                const pythonProcess = (0, child_process_1.spawn)('python', [pythonFile]);
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
                        (0, fs_1.unlinkSync)(pythonFile);
                    }
                    catch (e) {
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
                        }
                        else {
                            reject(new Error(result.error));
                        }
                    }
                    catch (e) {
                        reject(new Error(`Invalid JSON output: ${output}`));
                    }
                });
            }
            else if (workflow.type === 'JavaScript') {
                // Create JavaScript file
                const jsFile = (0, path_1.join)(tempDir, `workflow_${timestamp}.js`);
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
                (0, fs_1.writeFileSync)(jsFile, jsCode);
                const nodeProcess = (0, child_process_1.spawn)('node', [jsFile]);
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
                        (0, fs_1.unlinkSync)(jsFile);
                    }
                    catch (e) {
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
                        }
                        else {
                            reject(new Error(result.error));
                        }
                    }
                    catch (e) {
                        reject(new Error(`Invalid JSON output: ${output}`));
                    }
                });
            }
            else {
                reject(new Error(`Unsupported workflow type: ${workflow.type}`));
            }
        });
    });
}
