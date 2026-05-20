import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ObjectId, WithId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { AuthService } from '@/src/services/auth.service';
import { UserDao } from '@/src/dao/user.dao';
import { User } from '@/src/models/user';

// Test suite for AuthService login behavior with mocked dependencies.
describe('AuthService.login', () => {
  // Creates a valid user document for login scenarios.
  const buildUser = (overrides: Partial<WithId<User>> = {}): WithId<User> => ({
    _id: new ObjectId(),
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    role: 'user',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  // Reset mocks between tests to keep each case isolated.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Verifies a valid login returns a token and sanitized user payload.
  it('returns token and user data for a valid login', async () => {
    const userId = new ObjectId();
    const email = 'test@example.com';
    const password = 'plain-password';
    const user: WithId<User> = {
      _id: userId,
      email,
      password: 'hashed-password',
      name: 'Test User',
      role: 'user',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockedFindByEmail = jest.spyOn(UserDao, 'findByEmail').mockResolvedValue(user);
    const mockedCompare = jest.spyOn(bcrypt, 'compare') as unknown as jest.MockedFunction<
      (data: string, encrypted: string) => Promise<boolean>
    >;
    const mockedSign = jest.spyOn(jwt, 'sign') as unknown as jest.MockedFunction<
      (payload: string | Buffer | JwtPayload, secret: Secret, options?: SignOptions) => string
    >;

    mockedCompare.mockResolvedValue(true);
    mockedSign.mockReturnValue('test-token');

    const result = await AuthService.login({ email, password });

    expect(result).toEqual({
      token: 'test-token',
      user: {
        id: userId.toString(),
        email,
        name: 'Test User',
        role: 'user',
      },
    });

    expect(mockedFindByEmail).toHaveBeenCalledWith(email);
    expect(mockedCompare).toHaveBeenCalledWith(password, 'hashed-password');
    expect(mockedSign).toHaveBeenCalledWith(
      {
        userId: userId.toString(),
        email,
        role: 'user',
      },
      expect.any(String),
      { expiresIn: '1d' }
    );
  });

  // Verifies login fails when user is missing.
  it('throws when user is not found', async () => {
    const email = 'missing@example.com';
    const password = 'plain-password';
    const mockedFindByEmail = jest.spyOn(UserDao, 'findByEmail').mockResolvedValue(null);
    const mockedCompare = jest.spyOn(bcrypt, 'compare');
    const mockedSign = jest.spyOn(jwt, 'sign');

    await expect(AuthService.login({ email, password })).rejects.toThrow('Invalid email or password');

    expect(mockedFindByEmail).toHaveBeenCalledWith(email);
    expect(mockedCompare).not.toHaveBeenCalled();
    expect(mockedSign).not.toHaveBeenCalled();
  });

  // Verifies login fails when email is not verified.
  it('throws when user is not verified', async () => {
    const email = 'unverified@example.com';
    const password = 'plain-password';
    const user = buildUser({ email, isVerified: false });
    const mockedFindByEmail = jest.spyOn(UserDao, 'findByEmail').mockResolvedValue(user);
    const mockedCompare = jest.spyOn(bcrypt, 'compare');
    const mockedSign = jest.spyOn(jwt, 'sign');

    await expect(AuthService.login({ email, password })).rejects.toThrow(
      'Please verify your email address before logging in'
    );

    expect(mockedFindByEmail).toHaveBeenCalledWith(email);
    expect(mockedCompare).not.toHaveBeenCalled();
    expect(mockedSign).not.toHaveBeenCalled();
  });

  // Verifies login fails when account is inactive.
  it('throws when user is deactivated', async () => {
    const email = 'inactive@example.com';
    const password = 'plain-password';
    const user = buildUser({ email, isActive: false });
    const mockedFindByEmail = jest.spyOn(UserDao, 'findByEmail').mockResolvedValue(user);
    const mockedCompare = jest.spyOn(bcrypt, 'compare');
    const mockedSign = jest.spyOn(jwt, 'sign');

    await expect(AuthService.login({ email, password })).rejects.toThrow(
      'Your account has been deactivated'
    );

    expect(mockedFindByEmail).toHaveBeenCalledWith(email);
    expect(mockedCompare).not.toHaveBeenCalled();
    expect(mockedSign).not.toHaveBeenCalled();
  });

  // Edge case: valid user but password does not match.
  it('throws when password is invalid', async () => {
    const email = 'test@example.com';
    const password = 'wrong-password';
    const user = buildUser({ email });
    const mockedFindByEmail = jest.spyOn(UserDao, 'findByEmail').mockResolvedValue(user);
    const mockedCompare = jest.spyOn(bcrypt, 'compare') as unknown as jest.MockedFunction<
      (data: string, encrypted: string) => Promise<boolean>
    >;
    const mockedSign = jest.spyOn(jwt, 'sign');

    mockedCompare.mockResolvedValue(false);

    await expect(AuthService.login({ email, password })).rejects.toThrow('Invalid email or password');

    expect(mockedFindByEmail).toHaveBeenCalledWith(email);
    expect(mockedCompare).toHaveBeenCalledWith(password, 'hashed-password');
    expect(mockedSign).not.toHaveBeenCalled();
  });
});

