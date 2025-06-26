import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';
import { User } from '@prisma/client';

describe('Project and Page Endpoints', () => {
  let token: string;
  let user: User;

  const testUserData = {
    email: `project-test-${Date.now()}@example.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    // Create a user and get token before all tests in this suite
    await prisma.user.deleteMany({ where: { email: testUserData.email } });
    
    const userRes = await request(app).post('/auth/register').send(testUserData);
    const createdUser = await prisma.user.findUnique({ where: { email: testUserData.email } });
    if(!createdUser) throw new Error("Test user not created");
    user = createdUser;
    
    const loginRes = await request(app).post('/auth/login').send(testUserData);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    // Clean up after all tests
    await prisma.page.deleteMany({});
    await prisma.project.deleteMany({ where: { ownerId: user.id } });
    await prisma.user.deleteMany({ where: { email: testUserData.email } });
    await prisma.$disconnect();
  });

  it('should create a new project for the authenticated user', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My First Project' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('My First Project');
    
    // Cleanup this specific project
    await prisma.project.delete({ where: { id: res.body.id } });
  });

  it('should get all projects for the authenticated user', async () => {
    // Create a project to be fetched
    const project = await prisma.project.create({ data: { name: 'Gettable Project', ownerId: user.id } });

    const res = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Gettable Project');
    
    // Cleanup this specific project
    await prisma.project.delete({ where: { id: project.id } });
  });

  it('should create a new page within a project', async () => {
    // Create a project to add a page to
    const project = await prisma.project.create({ data: { name: 'Project For Page', ownerId: user.id } });

    const res = await request(app)
      .post(`/projects/${project.id}/pages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Test Page' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('My Test Page');
    
    // Cleanup is handled in afterAll
  });
}); 