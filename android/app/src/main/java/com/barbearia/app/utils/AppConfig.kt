package com.barbearia.app.utils

import com.barbearia.app.BuildConfig

object AppConfig {
    val API_BASE_URL = BuildConfig.API_BASE_URL
    const val CONNECTION_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 30L
}

object AppConstants {
    const val SHARED_PREFS_NAME = "barbearia_prefs"
    const val KEY_AUTH_TOKEN = "auth_token"
    const val KEY_USER_ID = "user_id"
    const val KEY_USER_NAME = "user_name"
    const val KEY_USER_EMAIL = "user_email"
    const val KEY_USER_PHONE = "user_phone"
    const val KEY_USER_ROLE = "user_role"

    const val USER_ROLE_ADMIN = "ADMIN"
    const val USER_ROLE_BARBER = "BARBER"
    const val USER_ROLE_CUSTOMER = "CUSTOMER"

    const val APPOINTMENT_STATUS_PENDING = "PENDING"
    const val APPOINTMENT_STATUS_CONFIRMED = "CONFIRMED"
    const val APPOINTMENT_STATUS_COMPLETED = "COMPLETED"
    const val APPOINTMENT_STATUS_CANCELLED = "CANCELLED"
}

object ValidationConstants {
    const val MIN_PASSWORD_LENGTH = 6
    const val MIN_NAME_LENGTH = 2
    const val MIN_PHONE_LENGTH = 10
}
