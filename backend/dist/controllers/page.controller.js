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
exports.updatePage = exports.getPage = exports.createPage = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Note: projectId is available from the router's mergeParams
const createPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { projectId } = req.params;
    const { name } = req.body;
    const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    try {
        // Verify project ownership
        const project = yield prisma_1.default.project.findFirst({ where: { id: projectId, ownerId } });
        if (!project) {
            res.status(404).json({ message: 'Project not found or you do not have access' });
            return;
        }
        const page = yield prisma_1.default.page.create({
            data: {
                name,
                projectId,
                layout: {}, // Default empty layout
            },
        });
        res.status(201).json(page);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating page', error });
    }
});
exports.createPage = createPage;
const getPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pageId } = req.params;
    try {
        const page = yield prisma_1.default.page.findUnique({ where: { id: pageId } });
        if (!page) {
            res.status(404).json({ message: 'Page not found' });
            return;
        }
        // Optional: Add ownership check here too if needed, though access is already gated by project
        res.json(page);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching page', error });
    }
});
exports.getPage = getPage;
const updatePage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pageId } = req.params;
    const { name, layout } = req.body;
    try {
        const page = yield prisma_1.default.page.update({
            where: { id: pageId },
            data: {
                name,
                layout,
            },
        });
        res.json(page);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating page', error });
    }
});
exports.updatePage = updatePage;
