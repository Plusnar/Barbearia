package com.barbearia.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class SessionUser(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val role: String
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
    val customerName: String? = null,
    val price: Double? = null,
    val date: String,
    val time: String,
    val status: AppointmentStatus,
    val createdAt: Long? = null
) : Parcelable

enum class AppointmentStatus {
    PENDING,
    CONFIRMED,
    COMPLETED,
    CANCELLED;

    companion object {
        fun fromValue(raw: String?): AppointmentStatus {
            return values().firstOrNull { it.name.equals(raw, ignoreCase = true) } ?: PENDING
        }
    }
}

@Parcelize
data class AdminStatistics(
    val totalAppointments: Int,
    val completedAppointments: Int,
    val totalRevenue: Double,
    val activeBarbers: Int,
    val totalCustomers: Int,
    val servicesPerformed: Int
) : Parcelable

@Parcelize
data class Plan(
    val id: String,
    val name: String,
    val price: Double,
    val description: String,
    val features: List<String>,
    val recommended: Boolean = false
) : Parcelable

@Parcelize
data class BarberProfit(
    val barberId: String,
    val barberName: String,
    val servicesPerformed: Int,
    val grossRevenue: Double,
    val barberShare: Double,
    val houseShare: Double,
    val commissionPercentage: Int
) : Parcelable

@Parcelize
data class ProfitDistribution(
    val commissionPercentage: Int,
    val totalGrossRevenue: Double,
    val totalBarberShare: Double,
    val totalHouseShare: Double,
    val barbers: List<BarberProfit>
) : Parcelable
