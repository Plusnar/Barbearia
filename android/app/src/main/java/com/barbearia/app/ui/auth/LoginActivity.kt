package com.barbearia.app.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.barbearia.app.BarbeariaApplication
import com.barbearia.app.R
import com.barbearia.app.databinding.ActivityLoginBinding
import com.barbearia.app.ui.admin.AdminPanelActivity
import com.barbearia.app.ui.barber.BarberDashboardActivity
import com.barbearia.app.ui.common.UiState
import com.barbearia.app.ui.common.ViewModelFactory
import com.barbearia.app.ui.customer.MainActivity

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding

    private val viewModel: LoginViewModel by viewModels {
        ViewModelFactory((application as BarbeariaApplication).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        viewModel.restoreSession()?.let {
            navigateBasedOnRole(it.role)
            return
        }

        setupListeners()
        playIntroAnimation()
        observeState()
    }

    private fun setupListeners() {
        binding.loginButton.setOnClickListener {
            clearErrors()
            viewModel.login(
                email = binding.emailInput.text?.toString().orEmpty(),
                password = binding.passwordInput.text?.toString().orEmpty()
            )
        }

        binding.registerLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            overridePendingTransition(R.anim.screen_enter_right, R.anim.screen_exit_left)
        }
    }

    private fun playIntroAnimation() {
        binding.logoContainer.scaleX = 0.86f
        binding.logoContainer.scaleY = 0.86f
        binding.logoContainer.alpha = 0f
        binding.logoContainer.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(420L)
            .start()

        binding.loginButton.setOnTouchListener { view, event ->
            when (event.action) {
                android.view.MotionEvent.ACTION_DOWN -> view.animate().scaleX(0.98f).scaleY(0.98f).setDuration(90L).start()
                android.view.MotionEvent.ACTION_UP,
                android.view.MotionEvent.ACTION_CANCEL -> view.animate().scaleX(1f).scaleY(1f).setDuration(120L).start()
            }
            false
        }
    }

    private fun observeState() {
        viewModel.uiState.observe(this) { state ->
            val isLoading = state is UiState.Loading
            binding.loginButton.isEnabled = !isLoading
            binding.progressBar.visibility = if (isLoading) android.view.View.VISIBLE else android.view.View.GONE

            when (state) {
                is UiState.Error -> handleError(state.message)
                is UiState.Success -> navigateBasedOnRole(state.data.role)
                UiState.Idle, UiState.Loading -> Unit
            }
        }
    }

    private fun clearErrors() {
        binding.emailInput.error = null
        binding.passwordInput.error = null
    }

    private fun handleError(message: String) {
        when {
            message.contains("e-mail", ignoreCase = true) -> binding.emailInput.error = message
            message.contains("senha", ignoreCase = true) ||
                message.contains("credenciais", ignoreCase = true) ||
                message.contains("credentials", ignoreCase = true) ||
                message.contains("invalid", ignoreCase = true) -> {
                binding.passwordInput.error = message
            }

            else -> Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        }
    }

    private fun navigateBasedOnRole(role: String) {
        val destination = when (role.uppercase()) {
            "ADMIN" -> AdminPanelActivity::class.java
            "BARBER" -> BarberDashboardActivity::class.java
            else -> MainActivity::class.java
        }
        startActivity(Intent(this, destination))
        overridePendingTransition(R.anim.screen_enter_right, R.anim.screen_exit_left)
        finish()
    }
}
