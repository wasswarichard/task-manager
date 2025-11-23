import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from './utils/test-app.module';
import { createTestingApp } from './utils/create-testing-app';

describe('E2E: auth + tasks', () => {
  let app: INestApplication;
  let server: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let taskId: string;

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

  describe('Auth', () => {
    it('registers user A', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({ email: 'a@example.com', name: 'Alice', password: 'secret123' })
        .expect(201);
      userA = res.body;
      expect(userA.id).toBeDefined();
    });

    it('registers user B', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({ email: 'b@example.com', name: 'Bob', password: 'secret123' })
        .expect(201);
      userB = res.body;
      expect(userB.id).toBeDefined();
    });

    it('logs in user A', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({ email: 'a@example.com', password: 'secret123' })
        .expect(201);
      tokenA = res.body.access_token;
      expect(tokenA).toBeDefined();
    });
  });

  describe('Task CRUD', () => {
    it('cannot create task without token', async () => {
      await request(server).post('/tasks').send({ title: 'task' }).expect(401);
    });

    it('creates a task', async () => {
      const res = await request(server)
        .post('/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Test task',
          description: 'desc',
          dueDate: '2030-01-01',
        })
        .expect(201);
      taskId = res.body.id;
      expect(res.body.title).toBe('Test task');
    });

    it('gets the task', async () => {
      const res = await request(server)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.id).toBe(taskId);
      expect(res.body.createdBy.id).toBe(userA.id);
    });

    it('lists all tasks', async () => {
      const res = await request(server)
        .get('/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      console.log(res.body);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('updates the task', async () => {
      const res = await request(server)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Updated title' })
        .expect(200);
      expect(res.body.task.title).toBe('Updated title');
    });

    it('cannot create task with empty title', async () => {
      await request(server)
        .post('/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: '' })
        .expect(400);
    });

    it('deletes the task', async () => {
      await request(server)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
    });
  });

  describe('Task assignment', () => {
    beforeAll(async () => {
      const res = await request(server)
        .post('/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Assign test' })
        .expect(201);
      taskId = res.body.id;
    });

    it('assigns user B to task', async () => {
      await request(server)
        .post(`/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB.id })
        .expect(201);
    });

    it('filters tasks by assignee', async () => {
      const res = await request(server)
        .get(`/tasks?assigneeId=${userB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.find((t: any) => t.id === taskId)).toBeTruthy();
    });

    it('unassigns user B', async () => {
      await request(server)
        .post(`/tasks/${taskId}/unassign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB.id })
        .expect(201);
    });
  });
});
