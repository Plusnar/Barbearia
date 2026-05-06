package com.barbearia.app.ui.barber

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.barbearia.app.data.model.Appointment
import com.barbearia.app.data.repository.BarbeariaRepository
import com.barbearia.app.data.repository.RepositoryResult
import com.barbearia.app.ui.common.UiState
import kotlinx.coroutines.launch

class BarberDashboardViewModel(
    private val repository: BarbeariaRepository
) : ViewModel() {
    private val _uiState = MutableLiveData<UiState<List<Appointment>>>(UiState.Loading)
    val uiState: LiveData<UiState<List<Appointment>>> = _uiState

    fun loadAppointments() {
        _uiState.value = UiState.Loading
        viewModelScope.launch {
            _uiState.value = when (val result = repository.loadBarberAppointments()) {
                is RepositoryResult.Success -> UiState.Success(result.data)
                is RepositoryResult.Error -> UiState.Error(result.message)
            }
        }
    }

    fun logout() = repository.logout()
}
