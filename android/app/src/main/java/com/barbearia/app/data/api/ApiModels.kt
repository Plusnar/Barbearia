package com.barbearia.app.data.api

import com.google.gson.annotations.SerializedName

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

data class BookAppointmentRequest(
    val barberId: String,
    val serviceId: String,
    val date: String,
    val time: String,
    val notes: String? = null
)

data class StatusUpdateRequest(
    val status: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
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

data class AppointmentResponse(
    val id: String,
    val customerId: String,
    val barberId: String,
    val serviceId: String,
    val barberName: String,
    val serviceName: String,
    val customerName: String? = null,
    val price: Double? = null,
    val date: String,
    val time: String,
    val status: String,
    val createdAt: Long? = null
)

data class BookAppointmentResponse(
    val success: Boolean,
    val appointment: AppointmentResponse
)

data class ServiceResponse(
    val id: String,
    val name: String,
    val description: String,
    val duration: Int,
    val price: Double
)

data class BarberResponse(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val specialization: String?,
    val available: Boolean
)

data class AdminStatisticsResponse(
    val totalAppointments: Int,
    val completedAppointments: Int,
    val totalRevenue: Double,
    val activeBarbers: Int,
    val totalCustomers: Int,
    val servicesPerformed: Int? = null
)

data class BarberProfitResponse(
    val barberId: String,
    val barberName: String,
    val servicesPerformed: Int,
    val grossRevenue: Double,
    val barberShare: Double,
    val houseShare: Double,
    val commissionPercentage: Int
)

data class ProfitDistributionResponse(
    val commissionPercentage: Int,
    val totalGrossRevenue: Double,
    val totalBarberShare: Double,
    val totalHouseShare: Double,
    val barbers: List<BarberProfitResponse>
)
