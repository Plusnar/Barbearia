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
import com.barbearia.app.data.api.LoginRequest
import com.barbearia.app.data.api.RetrofitClient
import com.barbearia.app.data.api.SharedPreferencesManager
import com.barbearia.app.ui.admin.AdminPanelActivity
import com.barbearia.app.ui.barber.BarberDashboardActivity
import com.barbearia.app.ui.customer.CustomerHomeActivity
import com.barbearia.app.ui.customer.MainActivity
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: Button
    private lateinit var registerLink: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var apiService: ApiService
    private lateinit var sharedPrefsManager: SharedPreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        sharedPrefsManager = SharedPreferencesManager(this)
        if (sharedPrefsManager.isLoggedIn()) {
            navigateBasedOnRole()
            return
        }

        RetrofitClient.initialize(this)
        apiService = RetrofitClient.getApiService()

        emailInput = findViewById(R.id.email_input)
        passwordInput = findViewById(R.id.password_input)
        loginButton = findViewById(R.id.login_button)
        registerLink = findViewById(R.id.register_link)
        progressBar = findViewById(R.id.progress_bar)

        loginButton.setOnClickListener { handleLogin() }
        registerLink.setOnClickListener { navigateToRegister() }
    }

    private fun handleLogin() {
        val email = emailInput.text.toString().trim()
        val password = passwordInput.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            return
        }

        progressBar.visibility = android.view.View.VISIBLE
        loginButton.isEnabled = false

        lifecycleScope.launch {
            try {
                val response = apiService.loginUser(LoginRequest(email, password))
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    sharedPrefsManager.saveToken(authResponse.token)
                    sharedPrefsManager.saveUser(
                        authResponse.user.id,
                        authResponse.user.name,
                        authResponse.user.email,
                        authResponse.user.role.name
                    )
                    navigateBasedOnRole()
                } else {
                    Toast.makeText(this@LoginActivity, "Invalid credentials", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@LoginActivity, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                progressBar.visibility = android.view.View.GONE
                loginButton.isEnabled = true
            }
        }
    }

    private fun navigateBasedOnRole() {
        val role = sharedPrefsManager.getUserRole()
        val intent = when (role) {
            "ADMIN" -> Intent(this, AdminPanelActivity::class.java)
            "BARBER" -> Intent(this, BarberDashboardActivity::class.java)
            else -> Intent(this, CustomerHomeActivity::class.java)
        }
        startActivity(intent)
        finish()
    }

    private fun navigateToRegister() {
        startActivity(Intent(this, RegisterActivity::class.java))
    }
}

