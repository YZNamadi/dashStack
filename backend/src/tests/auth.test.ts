import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';

describe('Auth Endpoints', () => {
  let token: string;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    // Clean up the user if it exists from a previous failed run
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  afterAll(async () => {
    // Clean up the created user
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User created successfully');
  });

  it('should not register a user with a duplicate email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);
    expect(res.statusCode).toEqual(500); // Or whatever your error code is
  });

  it('should log in an existing user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send(testUser);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should fail to log in with an incorrect password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
  });

  it('should fetch the current user with a valid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email', testUser.email);
  });

  it('should not fetch user data with an invalid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toEqual(401);
  });
}); 