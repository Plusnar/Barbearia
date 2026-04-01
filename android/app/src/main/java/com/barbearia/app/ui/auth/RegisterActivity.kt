package com.barbearia.app.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.barbearia.app.R
import com.barbearia.app.data.api.ApiService
import com.barbearia.app.data.api.RegisterRequest
import com.barbearia.app.data.api.RetrofitClient
import com.barbearia.app.data.api.SharedPreferencesManager
import com.barbearia.app.ui.customer.MainActivity
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {
    private lateinit var nameInput: EditText
    private lateinit var emailInput: EditText
    private lateinit var phoneInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var confirmPasswordInput: EditText
    private lateinit var registerButton: Button
    private lateinit var loginLink: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var apiService: ApiService
    private lateinit var sharedPrefsManager: SharedPreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        RetrofitClient.initialize(this)
        sharedPrefsManager = SharedPreferencesManager(this)
        apiService = RetrofitClient.getApiService()

        nameInput = findViewById(R.id.name_input)
        emailInput = findViewById(R.id.email_input)
        phoneInput = findViewById(R.id.phone_input)
        passwordInput = findViewById(R.id.password_input)
        confirmPasswordInput = findViewById(R.id.confirm_password_input)
        registerButton = findViewById(R.id.register_button)
        loginLink = findViewById(R.id.login_link)
        progressBar = findViewById(R.id.progress_bar)

        registerButton.setOnClickListener { handleRegister() }
        loginLink.setOnClickListener { finish() }
    }

    private fun handleRegister() {
        val name = nameInput.text.toString().trim()
        val email = emailInput.text.toString().trim()
        val phone = phoneInput.text.toString().trim()
        val password = passwordInput.text.toString().trim()
        val confirmPassword = confirmPasswordInput.text.toString().trim()

        if (name.isEmpty() || email.isEmpty() || phone.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            return
        }

        if (password != confirmPassword) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return
        }

        if (password.length < 6) {
            Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
            return
        }

        progressBar.visibility = android.view.View.VISIBLE
        registerButton.isEnabled = false

        lifecycleScope.launch {
            try {
                val response = apiService.registerUser(
                    RegisterRequest(name, email, phone, password)
                )
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    sharedPrefsManager.saveToken(authResponse.token)
                    sharedPrefsManager.saveUser(
                        authResponse.user.id,
                        authResponse.user.name,
                        authResponse.user.email,
                        authResponse.user.role.name
                    )
                    startActivity(Intent(this@RegisterActivity, MainActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this@RegisterActivity, "Registration failed", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@RegisterActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                progressBar.visibility = android.view.View.GONE
                registerButton.isEnabled = true
            }
        }
    }
}
