export const authResponse = {
  register: {
    notPermission: {
      code: 100101,
      message: 'You are not allowed to register a new user',
      status: false,
    },
    invalidCredentials: {
      code: 100102,
      message: 'Invalid credentials',
      status: false,
    },
    failedToRegister: {
      code: 100103,
      message: 'Failed to register user',
      status: false,
    },
    success: {
      code: 110100,
      message: 'User registered successfully',
      status: true,
    },
  },
  login: {
    notPermission: {
      code: 100201,
      message: 'You are not allowed to login',
      status: false,
    },
    notFound: {
      code: 100202,
      message: 'User not found',
      status: false,
    },
    invalidCredentials: {
      code: 100203,
      message: 'Invalid credentials',
      status: false,
    },
    failedToLogin: {
      code: 100204,
      message: 'Failed to login user',
      status: false,
    },
    success: {
      code: 110200,
      message: 'User logged in successfully',
      status: true,
    },
  },
};
