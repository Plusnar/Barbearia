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
import com.barbearia.app.utils.ValidationConstants
import kotlinx.coroutines.launch

class RegisterViewModel(
    private val repository: BarbeariaRepository
) : ViewModel() {
    private val _uiState = MutableLiveData<UiState<SessionUser>>(UiState.Idle)
    val uiState: LiveData<UiState<SessionUser>> = _uiState

    fun register(
        name: String,
        email: String,
        phone: String,
        password: String,
        confirmPassword: String
    ) {
        val normalizedName = name.trim()
        val normalizedEmail = email.trim()
        val normalizedPhone = phone.trim()

        when {
            normalizedName.length < ValidationConstants.MIN_NAME_LENGTH -> {
                _uiState.value = UiState.Error("Informe seu nome completo.")
                return
            }

            !Patterns.EMAIL_ADDRESS.matcher(normalizedEmail).matches() -> {
                _uiState.value = UiState.Error("Digite um e-mail válido.")
                return
            }

            normalizedPhone.filter(Char::isDigit).length < ValidationConstants.MIN_PHONE_LENGTH -> {
                _uiState.value = UiState.Error("Digite um telefone com DDD.")
                return
            }

            password.length < ValidationConstants.MIN_PASSWORD_LENGTH -> {
                _uiState.value = UiState.Error("A senha precisa ter pelo menos 6 caracteres.")
                return
            }

            password.none(Char::isUpperCase) || password.none(Char::isDigit) -> {
                _uiState.value = UiState.Error("Use ao menos 1 letra maiúscula e 1 número na senha.")
                return
            }

            password != confirmPassword -> {
                _uiState.value = UiState.Error("A confirmação de senha não confere.")
                return
            }
        }

        _uiState.value = UiState.Loading
        viewModelScope.launch {
            _uiState.value = when (
                val result = repository.register(
                    name = normalizedName,
                    email = normalizedEmail,
                    phone = normalizedPhone,
                    password = password
                )
            ) {
                is RepositoryResult.Success -> UiState.Success(result.data)
                is RepositoryResult.Error -> UiState.Error(result.message)
            }
        }
    }
}
