package com.barbearia.app.ui.barber

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.barbearia.app.R
import com.barbearia.app.data.api.ApiService
import com.barbearia.app.data.api.RetrofitClient
import com.barbearia.app.data.api.SharedPreferencesManager
import com.barbearia.app.data.api.StatusUpdateRequest
import com.barbearia.app.ui.adapter.AppointmentAdapter
import com.barbearia.app.ui.auth.LoginActivity
import kotlinx.coroutines.launch

class BarberDashboardActivity : AppCompatActivity() {
    private lateinit var appointmentsRecycler: RecyclerView
    private lateinit var logoutButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var apiService: ApiService
    private lateinit var sharedPrefsManager: SharedPreferencesManager
    private lateinit var adapter: AppointmentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_barber_dashboard)

        RetrofitClient.initialize(this)
        sharedPrefsManager = SharedPreferencesManager(this)
        apiService = RetrofitClient.getApiService()

        appointmentsRecycler = findViewById(R.id.appointments_recycler)
        logoutButton = findViewById(R.id.logout_button)
        progressBar = findViewById(R.id.progress_bar)

        appointmentsRecycler.layoutManager = LinearLayoutManager(this)
        adapter = AppointmentAdapter()
        appointmentsRecycler.adapter = adapter

        logoutButton.setOnClickListener {
            sharedPrefsManager.logout()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }

        loadAppointments()
    }

    override fun onResume() {
        super.onResume()
        loadAppointments()
    }

    private fun loadAppointments() {
        progressBar.visibility = android.view.View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = apiService.getBarberAppointments()
                if (response.isSuccessful && response.body() != null) {
                    adapter.submitList(response.body())
                } else {
                    Toast.makeText(this@BarberDashboardActivity, "Failed to load appointments", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@BarberDashboardActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                progressBar.visibility = android.view.View.GONE
            }
        }
    }
}
