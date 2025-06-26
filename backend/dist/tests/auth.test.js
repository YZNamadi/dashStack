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
describe('Auth Endpoints', () => {
    let token;
    const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
    };
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up the user if it exists from a previous failed run
        yield prisma_1.default.user.deleteMany({ where: { email: testUser.email } });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up the created user
        yield prisma_1.default.user.deleteMany({ where: { email: testUser.email } });
        yield prisma_1.default.$disconnect();
    }));
    it('should register a new user', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post('/auth/register')
            .send(testUser);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User created successfully');
    }));
    it('should not register a user with a duplicate email', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post('/auth/register')
            .send(testUser);
        expect(res.statusCode).toEqual(500); // Or whatever your error code is
    }));
    it('should log in an existing user', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post('/auth/login')
            .send(testUser);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    }));
    it('should fail to log in with an incorrect password', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post('/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' });
        expect(res.statusCode).toEqual(401);
    }));
    it('should fetch the current user with a valid token', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('email', testUser.email);
    }));
    it('should not fetch user data with an invalid token', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .get('/auth/me')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.statusCode).toEqual(401);
    }));
});
