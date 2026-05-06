package com.barbearia.app.ui.auth

import android.util.Patterns
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.barbearia.app.data.model.SessionUser
import com.barbearia.app.data.repository.BarbeariaRepository
import com.barbearia.app.data.repository.RepositoryResult
import com.barbearia.app.ui.common.UiState
import kotlinx.coroutines.launch

class LoginViewModel(
    private val repository: BarbeariaRepository
) : ViewModel() {
    private val _uiState = MutableLiveData<UiState<SessionUser>>(UiState.Idle)
    val uiState: LiveData<UiState<SessionUser>> = _uiState

    fun restoreSession(): SessionUser? = repository.currentUser().takeIf { repository.isLoggedIn() }

    fun login(email: String, password: String) {
        val normalizedEmail = email.trim()
        val normalizedPassword = password.trim()

        when {
            normalizedEmail.isBlank() -> {
                _uiState.value = UiState.Error("Informe seu e-mail ou usuário.")
                return
            }

            !Patterns.EMAIL_ADDRESS.matcher(normalizedEmail).matches() -> {
                _uiState.value = UiState.Error("Digite um e-mail válido.")
                return
            }

            normalizedPassword.isBlank() -> {
                _uiState.value = UiState.Error("Informe sua senha.")
                return
            }
        }

        _uiState.value = UiState.Loading
        viewModelScope.launch {
            _uiState.value = when (val result = repository.login(normalizedEmail, normalizedPassword)) {
                is RepositoryResult.Success -> UiState.Success(result.data)
                is RepositoryResult.Error -> UiState.Error(result.message)
            }
        }
    }
}
