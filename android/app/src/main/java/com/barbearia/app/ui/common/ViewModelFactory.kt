package com.barbearia.app.ui.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.barbearia.app.data.repository.BarbeariaRepository
import com.barbearia.app.ui.admin.AdminDashboardViewModel
import com.barbearia.app.ui.auth.LoginViewModel
import com.barbearia.app.ui.auth.RegisterViewModel
import com.barbearia.app.ui.barber.BarberDashboardViewModel
import com.barbearia.app.ui.customer.AppointmentBookingViewModel
import com.barbearia.app.ui.customer.MainViewModel

class ViewModelFactory(
    private val repository: BarbeariaRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(LoginViewModel::class.java) -> LoginViewModel(repository)
            modelClass.isAssignableFrom(RegisterViewModel::class.java) -> RegisterViewModel(repository)
            modelClass.isAssignableFrom(MainViewModel::class.java) -> MainViewModel(repository)
            modelClass.isAssignableFrom(AppointmentBookingViewModel::class.java) -> AppointmentBookingViewModel(repository)
            modelClass.isAssignableFrom(BarberDashboardViewModel::class.java) -> BarberDashboardViewModel(repository)
            modelClass.isAssignableFrom(AdminDashboardViewModel::class.java) -> AdminDashboardViewModel(repository)
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        } as T
    }
}
