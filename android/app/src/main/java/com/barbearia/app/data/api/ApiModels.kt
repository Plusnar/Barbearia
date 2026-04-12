package com.barbearia.app.data.api

import com.google.gson.annotations.SerializedName

// ==================== REQUISIÇÕES ====================

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val phone: String,
    val password: String,
    val role: String = "CUSTOMER"
)

// ==================== RESPOSTAS ====================

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

data class AuthResponse(
    val success: Boolean,
    val token: String,
    val user: UserResponse
)

data class UserResponse(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val role: String,
    @SerializedName("created_at")
    val createdAt: Long? = null,
    val createdAtFormatted: String? = null
)

data class LoginResponse(
    val success: Boolean,
    val token: String,
    val user: UserResponse
)

data class RegisterResponse(
    val success: Boolean,
    val token: String,
    val user: UserResponse
)
