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
exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name } = req.body;
    const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!name || !ownerId) {
        res.status(400).json({ message: 'Name and owner ID are required' });
        return;
    }
    try {
        const project = yield prisma_1.default.project.create({
            data: {
                name,
                ownerId,
            },
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating project', error });
    }
});
exports.createProject = createProject;
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    try {
        const projects = yield prisma_1.default.project.findMany({
            where: { ownerId },
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
});
exports.getProjects = getProjects;
const getProjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    try {
        const project = yield prisma_1.default.project.findFirst({
            where: { id, ownerId },
            include: { pages: true, datasources: true, workflows: true },
        });
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching project', error });
    }
});
exports.getProjectById = getProjectById;
