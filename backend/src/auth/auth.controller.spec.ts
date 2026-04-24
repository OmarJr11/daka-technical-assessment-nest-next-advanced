import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

type AuthServiceMock = {
  validateUser: jest.Mock<Promise<User>, [string, string]>;
  login: jest.Mock<Promise<{ accessToken: string; user: User }>, [User]>;
  register: jest.Mock<Promise<User>, [unknown]>;
  getProfile: jest.Mock<Promise<User>, [User]>;
};

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: AuthServiceMock;

  beforeEach(async (): Promise<void> => {
    authServiceMock = {
      validateUser: jest.fn<Promise<User>, [string, string]>(),
      login: jest.fn<Promise<{ accessToken: string; user: User }>, [User]>(),
      register: jest.fn<Promise<User>, [unknown]>(),
      getProfile: jest.fn<Promise<User>, [User]>(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should login and set auth cookie', async (): Promise<void> => {
    const user: User = {
      id: 1,
      username: 'brock',
    };
    authServiceMock.validateUser.mockResolvedValue(user);
    authServiceMock.login.mockResolvedValue({
      accessToken: 'jwt-token',
      user,
    });
    const response = {
      cookie: jest.fn(),
    } as unknown as Parameters<AuthController['login']>[1];
    const result = await controller.login(
      { username: 'brock', password: 'StrongP@ssw0rd123' },
      response,
    );
    expect(result).toEqual({
      accessToken: 'jwt-token',
      user,
    });
    expect(authServiceMock.validateUser).toHaveBeenCalledWith(
      'brock',
      'StrongP@ssw0rd123',
    );
    expect(authServiceMock.login).toHaveBeenCalledWith(user);
  });

  it('should rethrow unauthorized exceptions in login', async (): Promise<void> => {
    const response = {
      cookie: jest.fn(),
    } as unknown as Parameters<AuthController['login']>[1];
    authServiceMock.validateUser.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );
    await expect(
      controller.login(
        {
          username: 'brock',
          password: 'invalid',
        },
        response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
