package com.barbearia.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    @GET("user/profile")
    suspend fun getUserProfile(): Response<UserResponse>

    @GET("services")
    suspend fun getServices(): Response<List<ServiceResponse>>

    @GET("services/barbers")
    suspend fun getBarbers(): Response<List<BarberResponse>>

    @GET("appointments/customer")
    suspend fun getCustomerAppointments(): Response<List<AppointmentResponse>>

    @GET("appointments/barber")
    suspend fun getBarberAppointments(): Response<List<AppointmentResponse>>

    @POST("appointments/book")
    suspend fun bookAppointment(
        @Body request: BookAppointmentRequest
    ): Response<BookAppointmentResponse>

    @PUT("appointments/{id}/status")
    suspend fun updateAppointmentStatus(
        @Path("id") appointmentId: String,
        @Body request: StatusUpdateRequest
    ): Response<AppointmentResponse>

    @GET("admin/statistics")
    suspend fun getAdminStatistics(): Response<AdminStatisticsResponse>

    @GET("admin/appointments")
    suspend fun getAdminAppointments(): Response<List<AppointmentResponse>>

    @GET("admin/profit-distribution")
    suspend fun getAdminProfitDistribution(
        @Query("commission") commissionPercentage: Int
    ): Response<ProfitDistributionResponse>
}
