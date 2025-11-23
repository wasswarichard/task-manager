import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from './utils/test-app.module';
import { createTestingApp } from './utils/create-testing-app';

describe('E2E: auth + tasks', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = await createTestingApp(moduleFixture);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers and logs in, then performs task CRUD and assignment', async () => {
    // Register user A
    const regA = await request(server)
      .post('/auth/register')
      .send({ email: 'a@example.com', name: 'Alice', password: 'secret123' })
      .expect(201);
    const userA = regA.body;

    // Register user B
    const regB = await request(server)
      .post('/auth/register')
      .send({ email: 'b@example.com', name: 'Bob', password: 'secret123' })
      .expect(201);
    const userB = regB.body;

    // Login A
    const login = await request(server)
      .post('/auth/login')
      .send({ email: 'a@example.com', password: 'secret123' })
      .expect(201);
    expect(login.body.access_token).toBeDefined();
    const tokenA = login.body.access_token as string;

    // Creating task without token should 401
    await request(server).post('/tasks').send({ title: 'Nope' }).expect(401);

    // Create a task as A
    const created = await request(server)
      .post('/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Test task', description: 'desc', dueDate: '2030-01-01' })
      .expect(201);
    expect(created.body.title).toBe('Test task');
    const taskId = created.body.id as string;

    // Get task
    const got = await request(server)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(got.body.id).toBe(taskId);
    expect(got.body.createdBy.id).toBe(userA.id);

    // List all
    const list = await request(server)
      .get('/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);

    // Assign user B
    await request(server)
      .post(`/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ userId: userB.id })
      .expect(201);

    // Filter by assigneeId should include the task
    const listByAssignee = await request(server)
      .get(`/tasks?assigneeId=${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(listByAssignee.body.find((t: any) => t.id === taskId)).toBeTruthy();

    // Unassign user B
    await request(server)
      .post(`/tasks/${taskId}/unassign`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ userId: userB.id })
      .expect(201);

    // Update task
    const updated = await request(server)
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Updated title' })
      .expect(200);
    expect(updated.body.title).toBe('Updated title');

    // Delete task
    await request(server)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // Validation: creating with empty title should 400
    await request(server)
      .post('/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '' })
      .expect(400);
  });
});
