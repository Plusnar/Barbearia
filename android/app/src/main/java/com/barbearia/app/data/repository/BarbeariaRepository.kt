package com.barbearia.app.data.repository

import com.barbearia.app.data.api.AdminStatisticsResponse
import com.barbearia.app.data.api.ApiService
import com.barbearia.app.data.api.AppointmentResponse
import com.barbearia.app.data.api.BarberResponse
import com.barbearia.app.data.api.BookAppointmentRequest
import com.barbearia.app.data.api.LoginRequest
import com.barbearia.app.data.api.BarberProfitResponse
import com.barbearia.app.data.api.RegisterRequest
import com.barbearia.app.data.api.ServiceResponse
import com.barbearia.app.data.api.SharedPreferencesManager
import com.barbearia.app.data.api.StatusUpdateRequest
import com.barbearia.app.data.api.UserResponse
import com.barbearia.app.data.model.AdminStatistics
import com.barbearia.app.data.model.Appointment
import com.barbearia.app.data.model.AppointmentStatus
import com.barbearia.app.data.model.Barber
import com.barbearia.app.data.model.BarberProfit
import com.barbearia.app.data.model.Plan
import com.barbearia.app.data.model.ProfitDistribution
import com.barbearia.app.data.model.Service
import com.barbearia.app.data.model.SessionUser
import org.json.JSONObject
import retrofit2.Response

class BarbeariaRepository(
    private val apiService: ApiService,
    private val sessionManager: SharedPreferencesManager
) {
    suspend fun login(email: String, password: String): RepositoryResult<SessionUser> {
        return safeApiCall(
            call = { apiService.login(LoginRequest(email = email, password = password)) },
            mapper = { body ->
                body.user.toSessionUser().also { user ->
                    sessionManager.saveToken(body.token)
                    sessionManager.saveUser(user)
                }
            }
        )
    }

    suspend fun register(
        name: String,
        email: String,
        phone: String,
        password: String
    ): RepositoryResult<SessionUser> {
        return safeApiCall(
            call = {
                apiService.register(
                    RegisterRequest(
                        name = name,
                        email = email,
                        phone = phone,
                        password = password
                    )
                )
            },
            mapper = { body ->
                body.user.toSessionUser().also { user ->
                    sessionManager.saveToken(body.token)
                    sessionManager.saveUser(user)
                }
            }
        )
    }

    suspend fun loadProfile(): RepositoryResult<SessionUser> {
        return safeApiCall(
            call = { apiService.getUserProfile() },
            mapper = { body ->
                body.toSessionUser().also(sessionManager::saveUser)
            }
        )
    }

    suspend fun loadServices(): RepositoryResult<List<Service>> {
        return safeApiCall(
            call = { apiService.getServices() },
            mapper = { body -> body.map(ServiceResponse::toDomain) }
        )
    }

    suspend fun loadPlans(): RepositoryResult<List<Plan>> {
        return safeApiCall(
            call = { apiService.getServices() },
            mapper = { body -> body.mapIndexed { index, service -> service.toPlan(index) } }
        )
    }

    suspend fun loadBarbers(): RepositoryResult<List<Barber>> {
        return safeApiCall(
            call = { apiService.getBarbers() },
            mapper = { body -> body.map(BarberResponse::toDomain) }
        )
    }

    suspend fun loadCustomerAppointments(): RepositoryResult<List<Appointment>> {
        return safeApiCall(
            call = { apiService.getCustomerAppointments() },
            mapper = { body -> body.map(AppointmentResponse::toDomain) }
        )
    }

    suspend fun loadBarberAppointments(): RepositoryResult<List<Appointment>> {
        return safeApiCall(
            call = { apiService.getBarberAppointments() },
            mapper = { body -> body.map(AppointmentResponse::toDomain) }
        )
    }

    suspend fun loadAdminStatistics(): RepositoryResult<AdminStatistics> {
        return safeApiCall(
            call = { apiService.getAdminStatistics() },
            mapper = AdminStatisticsResponse::toDomain
        )
    }

    suspend fun loadAdminAppointments(): RepositoryResult<List<Appointment>> {
        return safeApiCall(
            call = { apiService.getAdminAppointments() },
            mapper = { body -> body.map(AppointmentResponse::toDomain) }
        )
    }

    suspend fun loadProfitDistribution(commissionPercentage: Int): RepositoryResult<ProfitDistribution> {
        val safePercentage = commissionPercentage.coerceIn(0, 100)
        return safeApiCall(
            call = { apiService.getAdminProfitDistribution(safePercentage) },
            mapper = { body ->
                ProfitDistribution(
                    commissionPercentage = body.commissionPercentage,
                    totalGrossRevenue = body.totalGrossRevenue,
                    totalBarberShare = body.totalBarberShare,
                    totalHouseShare = body.totalHouseShare,
                    barbers = body.barbers.map(BarberProfitResponse::toDomain)
                )
            }
        )
    }

    suspend fun bookAppointment(
        barberId: String,
        serviceId: String,
        date: String,
        time: String,
        notes: String?
    ): RepositoryResult<Appointment> {
        return safeApiCall(
            call = {
                apiService.bookAppointment(
                    BookAppointmentRequest(
                        barberId = barberId,
                        serviceId = serviceId,
                        date = date,
                        time = time,
                        notes = notes
                    )
                )
            },
            mapper = { body -> body.appointment.toDomain() }
        )
    }

    suspend fun updateAppointmentStatus(
        appointmentId: String,
        status: AppointmentStatus
    ): RepositoryResult<Appointment> {
        return safeApiCall(
            call = {
                apiService.updateAppointmentStatus(
                    appointmentId = appointmentId,
                    request = StatusUpdateRequest(status.name)
                )
            },
            mapper = AppointmentResponse::toDomain
        )
    }

    fun currentUser(): SessionUser? = sessionManager.getSessionUser()

    fun isLoggedIn(): Boolean = sessionManager.isLoggedIn()

    fun logout() = sessionManager.logout()

    private suspend fun <T, R> safeApiCall(
        call: suspend () -> Response<T>,
        mapper: (T) -> R
    ): RepositoryResult<R> {
        return try {
            val response = call()
            val body = response.body()
            if (response.isSuccessful && body != null) {
                RepositoryResult.Success(mapper(body))
            } else {
                val backendMessage = response.errorBody()?.string()
                    ?.let { raw ->
                        runCatching { JSONObject(raw).optString("message") }
                            .getOrDefault(raw)
                    }
                    .orEmpty()

                RepositoryResult.Error(backendMessage.ifBlank {
                    when (response.code()) {
                        400 -> "Dados inválidos. Revise os campos e tente novamente."
                        401 -> "Sua sessão expirou ou as credenciais estão incorretas."
                        403 -> "Você não tem permissão para acessar este recurso."
                        409 -> "Já existe um cadastro com essas informações."
                        else -> "Não foi possível concluir a operação no momento."
                    }
                })
            }
        } catch (exception: Exception) {
            RepositoryResult.Error(
                exception.localizedMessage ?: "Erro de conexão com a barbearia."
            )
        }
    }
}

sealed class RepositoryResult<out T> {
    data class Success<T>(val data: T) : RepositoryResult<T>()
    data class Error(val message: String) : RepositoryResult<Nothing>()
}

private fun UserResponse.toSessionUser(): SessionUser {
    return SessionUser(
        id = id,
        name = name,
        email = email,
        phone = phone,
        role = role
    )
}

private fun ServiceResponse.toDomain(): Service {
    return Service(
        id = id,
        name = name,
        description = description,
        duration = duration,
        price = price
    )
}

private fun ServiceResponse.toPlan(index: Int): Plan {
    val benefits = listOf(
        "${duration} minutos de atendimento reservado",
        "Finalizacao premium incluida",
        "Agendamento pelo app sem fila"
    )
    return Plan(
        id = id,
        name = name,
        description = description,
        price = price,
        features = benefits,
        recommended = index == 1 || name.contains("premium", ignoreCase = true)
    )
}

private fun BarberResponse.toDomain(): Barber {
    return Barber(
        id = id,
        name = name,
        email = email,
        phone = phone,
        specialization = specialization.orEmpty().ifBlank { "Especialista premium" },
        available = available
    )
}

private fun AppointmentResponse.toDomain(): Appointment {
    return Appointment(
        id = id,
        customerId = customerId,
        barberId = barberId,
        serviceId = serviceId,
        barberName = barberName,
        serviceName = serviceName,
        customerName = customerName,
        price = price,
        date = date,
        time = time,
        status = AppointmentStatus.fromValue(status),
        createdAt = createdAt
    )
}

private fun AdminStatisticsResponse.toDomain(): AdminStatistics {
    return AdminStatistics(
        totalAppointments = totalAppointments,
        completedAppointments = completedAppointments,
        totalRevenue = totalRevenue,
        activeBarbers = activeBarbers,
        totalCustomers = totalCustomers,
        servicesPerformed = servicesPerformed ?: completedAppointments
    )
}

private fun BarberProfitResponse.toDomain(): BarberProfit {
    return BarberProfit(
        barberId = barberId,
        barberName = barberName,
        servicesPerformed = servicesPerformed,
        grossRevenue = grossRevenue,
        barberShare = barberShare,
        houseShare = houseShare,
        commissionPercentage = commissionPercentage
    )
}
