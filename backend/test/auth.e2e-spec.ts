import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/auth/entities/user.entity';

type AuthServiceMock = {
  validateUser: jest.Mock<Promise<User>, [string, string]>;
  login: jest.Mock<Promise<{ accessToken: string; user: User }>, [User]>;
  register: jest.Mock<Promise<User>, [unknown]>;
  getProfile: jest.Mock<Promise<User>, [User]>;
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authServiceMock: AuthServiceMock;

  beforeEach(async (): Promise<void> => {
    authServiceMock = {
      validateUser: jest.fn<Promise<User>, [string, string]>(),
      login: jest.fn<Promise<{ accessToken: string; user: User }>, [User]>(),
      register: jest.fn<Promise<User>, [unknown]>(),
      getProfile: jest.fn<Promise<User>, [User]>(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', async (): Promise<void> => {
    const createdUser: User = {
      id: 10,
      username: 'ash',
    };
    authServiceMock.register.mockResolvedValue(createdUser);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'ash',
        password: 'StrongP@ssw0rd123',
        confirmPassword: 'StrongP@ssw0rd123',
      })
      .expect(201)
      .expect((response: { body: User }): void => {
        expect(response.body).toEqual(createdUser);
      });
  });

  it('/auth/login (POST)', async (): Promise<void> => {
    const publicUser: User = {
      id: 11,
      username: 'misty',
    };
    authServiceMock.validateUser.mockResolvedValue(publicUser);
    authServiceMock.login.mockResolvedValue({
      accessToken: 'jwt-token',
      user: publicUser,
    });
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'misty',
        password: 'StrongP@ssw0rd123',
      })
      .expect(201)
      .expect(
        (response: { body: { accessToken: string; user: User } }): void => {
          expect(response.body.user).toEqual(publicUser);
          expect(response.body.accessToken).toBe('jwt-token');
        },
      );
  });

  afterEach(async (): Promise<void> => {
    await app.close();
  });
});
