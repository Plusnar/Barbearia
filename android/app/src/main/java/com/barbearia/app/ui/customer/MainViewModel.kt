package com.barbearia.app.ui.customer

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.barbearia.app.data.model.Appointment
import com.barbearia.app.data.model.Plan
import com.barbearia.app.data.model.SessionUser
import com.barbearia.app.data.repository.BarbeariaRepository
import com.barbearia.app.data.repository.RepositoryResult
import com.barbearia.app.ui.common.UiState
import kotlinx.coroutines.launch

data class DashboardData(
    val user: SessionUser?,
    val plans: List<Plan>,
    val appointments: List<Appointment>
)

class MainViewModel(
    private val repository: BarbeariaRepository
) : ViewModel() {
    private val _uiState = MutableLiveData<UiState<DashboardData>>(UiState.Loading)
    val uiState: LiveData<UiState<DashboardData>> = _uiState

    fun loadDashboard() {
        _uiState.value = UiState.Loading
        viewModelScope.launch {
            val user = repository.currentUser()
            val plansResult = repository.loadPlans()
            val appointmentsResult = repository.loadCustomerAppointments()

            _uiState.value = when {
                plansResult is RepositoryResult.Error -> UiState.Error(plansResult.message)
                appointmentsResult is RepositoryResult.Error -> UiState.Error(appointmentsResult.message)
                plansResult is RepositoryResult.Success && appointmentsResult is RepositoryResult.Success -> {
                    UiState.Success(
                        DashboardData(
                            user = user,
                            plans = plansResult.data,
                            appointments = appointmentsResult.data
                        )
                    )
                }

                else -> UiState.Error("Não foi possível montar seu dashboard.")
            }
        }
    }

    fun logout() = repository.logout()
}
