package com.barbearia.app.utils

object AppConfig {
    const val API_BASE_URL = "http://192.168.0.101:5000/api/"
    
    const val CONNECTION_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 30L
    
    const val TOKEN_EXPIRY_DAYS = 30L
    const val TOKEN_REFRESH_HOURS = 24L
}

object AppConstants {
    const val SHARED_PREFS_NAME = "barbearia_prefs"
    const val KEY_AUTH_TOKEN = "auth_token"
    const val KEY_USER_ID = "user_id"
    const val KEY_USER_NAME = "user_name"
    const val KEY_USER_EMAIL = "user_email"
    const val KEY_USER_ROLE = "user_role"
    
    const val USER_ROLE_ADMIN = "ADMIN"
    const val USER_ROLE_BARBER = "BARBER"
    const val USER_ROLE_CUSTOMER = "CUSTOMER"
    
    const val APPOINTMENT_STATUS_PENDING = "PENDING"
    const val APPOINTMENT_STATUS_CONFIRMED = "CONFIRMED"
    const val APPOINTMENT_STATUS_COMPLETED = "COMPLETED"
    const val APPOINTMENT_STATUS_CANCELLED = "CANCELLED"
    
    const val ERROR_NETWORK = "Network error occurred"
    const val ERROR_INVALID_CREDENTIALS = "Invalid email or password"
    const val ERROR_USER_EXISTS = "Email already registered"
    const val ERROR_BOOKING_FAILED = "Failed to book appointment"
}

object ValidationConstants {
    const val MIN_PASSWORD_LENGTH = 6
    const val MIN_NAME_LENGTH = 2
    const val MIN_PHONE_LENGTH = 10
}
