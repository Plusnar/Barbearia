package com.barbearia.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Header

interface ApiService {
    
    // ==================== AUTENTICAÇÃO ====================
    
    @POST("auth/login")
    suspend fun loginUser(@Body request: LoginRequest): Response<LoginResponse>
    
    @POST("auth/register")
    suspend fun registerUser(@Body request: RegisterRequest): Response<RegisterResponse>
    
    // ==================== USUÁRIO ====================
    
    @GET("user/profile")
    suspend fun getUserProfile(
        @Header("Authorization") token: String
    ): Response<ApiResponse<UserResponse>>
    
    // ==================== SERVIÇOS ====================
    
    @GET("services")
    suspend fun getServices(): Response<ApiResponse<List<com.barbearia.app.data.model.Service>>>
    
    // ==================== AGENDAMENTOS ====================
    
    @GET("appointments")
    suspend fun getAppointments(): Response<ApiResponse<List<com.barbearia.app.data.model.Appointment>>>
    
    @POST("appointments")
    suspend fun createAppointment(
        @Body appointment: CreateAppointmentRequest
    ): Response<ApiResponse<com.barbearia.app.data.model.Appointment>>
    
}

// ==================== MODELOS ADICIONAIS ====================

data class CreateAppointmentRequest(
    val barberId: String,
    val serviceId: String,
    val appointmentDate: String,
    val appointmentTime: String,
    val notes: String? = null
)
