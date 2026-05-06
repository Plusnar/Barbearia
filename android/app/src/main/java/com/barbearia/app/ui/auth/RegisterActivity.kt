package com.barbearia.app.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.barbearia.app.BarbeariaApplication
import com.barbearia.app.R
import com.barbearia.app.databinding.ActivityRegisterBinding
import com.barbearia.app.ui.common.UiState
import com.barbearia.app.ui.common.ViewModelFactory
import com.barbearia.app.ui.customer.MainActivity

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding

    private val viewModel: RegisterViewModel by viewModels {
        ViewModelFactory((application as BarbeariaApplication).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        playIntroAnimation()
        observeState()
    }

    private fun setupListeners() {
        binding.registerButton.setOnClickListener {
            clearErrors()
            viewModel.register(
                name = binding.nameInput.text?.toString().orEmpty(),
                email = binding.emailInput.text?.toString().orEmpty(),
                phone = binding.phoneInput.text?.toString().orEmpty(),
                password = binding.passwordInput.text?.toString().orEmpty(),
                confirmPassword = binding.confirmPasswordInput.text?.toString().orEmpty()
            )
        }

        binding.loginLink.setOnClickListener {
            finish()
            overridePendingTransition(R.anim.screen_enter_left, R.anim.screen_exit_right)
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

        binding.registerButton.setOnTouchListener { view, event ->
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
            binding.registerButton.isEnabled = !isLoading
            binding.progressBar.visibility = if (isLoading) android.view.View.VISIBLE else android.view.View.GONE

            when (state) {
                is UiState.Error -> handleError(state.message)
                is UiState.Success -> {
                    Toast.makeText(this, "Conta criada com sucesso.", Toast.LENGTH_SHORT).show()
                    startActivity(Intent(this, MainActivity::class.java))
                    overridePendingTransition(R.anim.screen_enter_right, R.anim.screen_exit_left)
                    finish()
                }

                UiState.Idle, UiState.Loading -> Unit
            }
        }
    }

    private fun clearErrors() {
        binding.nameInput.error = null
        binding.emailInput.error = null
        binding.phoneInput.error = null
        binding.passwordInput.error = null
        binding.confirmPasswordInput.error = null
    }

    private fun handleError(message: String) {
        when {
            message.contains("nome", ignoreCase = true) -> binding.nameInput.error = message
            message.contains("e-mail", ignoreCase = true) -> binding.emailInput.error = message
            message.contains("email", ignoreCase = true) -> binding.emailInput.error = message
            message.contains("telefone", ignoreCase = true) -> binding.phoneInput.error = message
            message.contains("senha", ignoreCase = true) -> {
                binding.passwordInput.error = message
                binding.confirmPasswordInput.error = message
            }

            else -> Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        }
    }
}
