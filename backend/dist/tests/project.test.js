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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const prisma_1 = __importDefault(require("../utils/prisma"));
describe('Project and Page Endpoints', () => {
    let token;
    let user;
    const testUserData = {
        email: `project-test-${Date.now()}@example.com`,
        password: 'password123',
    };
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create a user and get token before all tests in this suite
        yield prisma_1.default.user.deleteMany({ where: { email: testUserData.email } });
        const userRes = yield (0, supertest_1.default)(app_1.default).post('/auth/register').send(testUserData);
        const createdUser = yield prisma_1.default.user.findUnique({ where: { email: testUserData.email } });
        if (!createdUser)
            throw new Error("Test user not created");
        user = createdUser;
        const loginRes = yield (0, supertest_1.default)(app_1.default).post('/auth/login').send(testUserData);
        token = loginRes.body.token;
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up after all tests
        yield prisma_1.default.page.deleteMany({});
        yield prisma_1.default.project.deleteMany({ where: { ownerId: user.id } });
        yield prisma_1.default.user.deleteMany({ where: { email: testUserData.email } });
        yield prisma_1.default.$disconnect();
    }));
    it('should create a new project for the authenticated user', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post('/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My First Project' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('My First Project');
        // Cleanup this specific project
        yield prisma_1.default.project.delete({ where: { id: res.body.id } });
    }));
    it('should get all projects for the authenticated user', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a project to be fetched
        const project = yield prisma_1.default.project.create({ data: { name: 'Gettable Project', ownerId: user.id } });
        const res = yield (0, supertest_1.default)(app_1.default)
            .get('/projects')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Gettable Project');
        // Cleanup this specific project
        yield prisma_1.default.project.delete({ where: { id: project.id } });
    }));
    it('should create a new page within a project', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a project to add a page to
        const project = yield prisma_1.default.project.create({ data: { name: 'Project For Page', ownerId: user.id } });
        const res = yield (0, supertest_1.default)(app_1.default)
            .post(`/projects/${project.id}/pages`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My Test Page' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('My Test Page');
        // Cleanup is handled in afterAll
    }));
});
