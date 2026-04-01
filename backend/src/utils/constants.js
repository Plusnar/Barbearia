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

export const WORKING_HOURS = {
  START: '09:00',
  END: '17:00',
  SLOT_DURATION: 30
};

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

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
