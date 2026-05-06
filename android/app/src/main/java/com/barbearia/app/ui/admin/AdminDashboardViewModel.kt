package com.barbearia.app.ui.admin

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.barbearia.app.data.model.AdminStatistics
import com.barbearia.app.data.model.Appointment
import com.barbearia.app.data.model.ProfitDistribution
import com.barbearia.app.data.repository.BarbeariaRepository
import com.barbearia.app.data.repository.RepositoryResult
import com.barbearia.app.ui.common.UiState
import kotlinx.coroutines.launch

data class AdminDashboardData(
    val statistics: AdminStatistics,
    val appointments: List<Appointment>,
    val profitDistribution: ProfitDistribution
)

class AdminDashboardViewModel(
    private val repository: BarbeariaRepository
) : ViewModel() {
    private val _uiState = MutableLiveData<UiState<AdminDashboardData>>(UiState.Loading)
    val uiState: LiveData<UiState<AdminDashboardData>> = _uiState

    private var commissionPercentage = 50

    fun loadDashboard(commission: Int = commissionPercentage) {
        commissionPercentage = commission.coerceIn(0, 100)
        _uiState.value = UiState.Loading
        viewModelScope.launch {
            val statisticsResult = repository.loadAdminStatistics()
            val appointmentsResult = repository.loadAdminAppointments()
            val profitResult = repository.loadProfitDistribution(commissionPercentage)

            _uiState.value = when {
                statisticsResult is RepositoryResult.Error -> UiState.Error(statisticsResult.message)
                appointmentsResult is RepositoryResult.Error -> UiState.Error(appointmentsResult.message)
                profitResult is RepositoryResult.Error -> UiState.Error(profitResult.message)
                statisticsResult is RepositoryResult.Success &&
                    appointmentsResult is RepositoryResult.Success &&
                    profitResult is RepositoryResult.Success -> {
                    UiState.Success(
                        AdminDashboardData(
                            statistics = statisticsResult.data,
                            appointments = appointmentsResult.data,
                            profitDistribution = profitResult.data
                        )
                    )
                }

                else -> UiState.Error("Não foi possível carregar o painel administrativo.")
            }
        }
    }

    fun logout() = repository.logout()
}
