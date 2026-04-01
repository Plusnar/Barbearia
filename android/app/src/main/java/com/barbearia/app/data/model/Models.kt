package com.barbearia.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class User(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val role: UserRole,
    val createdAt: Long
) : Parcelable

enum class UserRole {
    CUSTOMER,
    BARBER,
    ADMIN
}

@Parcelize
data class AuthResponse(
    val token: String,
    val user: User
) : Parcelable

@Parcelize
data class Barber(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val specialization: String,
    val available: Boolean
) : Parcelable

@Parcelize
data class Service(
    val id: String,
    val name: String,
    val description: String,
    val duration: Int,
    val price: Double
) : Parcelable

@Parcelize
data class Appointment(
    val id: String,
    val customerId: String,
    val barberId: String,
    val serviceId: String,
    val barberName: String,
    val serviceName: String,
    val date: String,
    val time: String,
    val status: AppointmentStatus,
    val createdAt: Long
) : Parcelable

enum class AppointmentStatus {
    PENDING,
    CONFIRMED,
    COMPLETED,
    CANCELLED
}

@Parcelize
data class AvailableSlot(
    val date: String,
    val time: String,
    val availableBarbers: List<Barber>
) : Parcelable

@Parcelize
data class ErrorResponse(
    val success: Boolean,
    val message: String
) : Parcelable
