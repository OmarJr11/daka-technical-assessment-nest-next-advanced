import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const userRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneByOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async (): Promise<void> => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject duplicated users during register', async (): Promise<void> => {
    userRepositoryMock.findOne.mockResolvedValue({
      id: 9,
      username: 'ash',
    });
    await expect(
      service.register({
        username: 'ash',
        password: 'StrongP@ssw0rd123',
        confirmPassword: 'StrongP@ssw0rd123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should create and return login payload', async (): Promise<void> => {
    const user: User = {
      id: 12,
      username: 'misty',
    };
    jwtServiceMock.signAsync.mockResolvedValue('signed-jwt');
    const result = await service.login(user);
    expect(result).toEqual({
      accessToken: 'signed-jwt',
      user,
    });
  });
});
