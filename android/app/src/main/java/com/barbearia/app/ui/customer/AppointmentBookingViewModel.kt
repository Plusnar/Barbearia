package com.barbearia.app.ui.customer

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.barbearia.app.data.model.Appointment
import com.barbearia.app.data.model.Barber
import com.barbearia.app.data.model.Service
import com.barbearia.app.data.repository.BarbeariaRepository
import com.barbearia.app.data.repository.RepositoryResult
import com.barbearia.app.ui.common.UiState
import kotlinx.coroutines.launch

data class BookingFormData(
    val services: List<Service>,
    val barbers: List<Barber>
)

class AppointmentBookingViewModel(
    private val repository: BarbeariaRepository
) : ViewModel() {
    private val _formState = MutableLiveData<UiState<BookingFormData>>(UiState.Loading)
    val formState: LiveData<UiState<BookingFormData>> = _formState

    private val _bookingState = MutableLiveData<UiState<Appointment>>(UiState.Idle)
    val bookingState: LiveData<UiState<Appointment>> = _bookingState

    fun loadForm() {
        _formState.value = UiState.Loading
        viewModelScope.launch {
            val servicesResult = repository.loadServices()
            val barbersResult = repository.loadBarbers()

            _formState.value = when {
                servicesResult is RepositoryResult.Error -> UiState.Error(servicesResult.message)
                barbersResult is RepositoryResult.Error -> UiState.Error(barbersResult.message)
                servicesResult is RepositoryResult.Success && barbersResult is RepositoryResult.Success -> {
                    UiState.Success(
                        BookingFormData(
                            services = servicesResult.data,
                            barbers = barbersResult.data
                        )
                    )
                }

                else -> UiState.Error("Não foi possível carregar os dados do agendamento.")
            }
        }
    }

    fun book(
        barberId: String,
        serviceId: String,
        date: String,
        time: String,
        notes: String
    ) {
        when {
            date.isBlank() -> {
                _bookingState.value = UiState.Error("Selecione uma data para continuar.")
                return
            }

            serviceId.isBlank() -> {
                _bookingState.value = UiState.Error("Escolha o serviço desejado.")
                return
            }

            barberId.isBlank() -> {
                _bookingState.value = UiState.Error("Escolha o barbeiro desejado.")
                return
            }
        }

        _bookingState.value = UiState.Loading
        viewModelScope.launch {
            _bookingState.value = when (
                val result = repository.bookAppointment(
                    barberId = barberId,
                    serviceId = serviceId,
                    date = date,
                    time = time,
                    notes = notes.ifBlank { null }
                )
            ) {
                is RepositoryResult.Success -> UiState.Success(result.data)
                is RepositoryResult.Error -> UiState.Error(result.message)
            }
        }
    }
}
