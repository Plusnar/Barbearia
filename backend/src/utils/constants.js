export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  BARBER: 'BARBER',
  ADMIN: 'ADMIN'
};

export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_EXISTS: 'Email already registered',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid token',
  APPOINTMENT_NOT_FOUND: 'Appointment not found',
  DATABASE_ERROR: 'Database error occurred',
  INVALID_INPUT: 'Invalid input data'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  APPOINTMENT_BOOKED: 'Appointment booked successfully',
  APPOINTMENT_UPDATED: 'Appointment updated',
  OPERATION_SUCCESS: 'Operation completed successfully'
};
