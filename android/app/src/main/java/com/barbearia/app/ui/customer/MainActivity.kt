package com.barbearia.app.ui.customer

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.barbearia.app.R
import com.barbearia.app.data.api.ApiService
import com.barbearia.app.data.api.RetrofitClient
import com.barbearia.app.data.api.SharedPreferencesManager
import com.barbearia.app.data.model.Appointment
import com.barbearia.app.ui.auth.LoginActivity
import com.barbearia.app.ui.adapter.AppointmentAdapter
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var newAppointmentButton: Button
    private lateinit var logoutButton: Button
    private lateinit var appointmentsRecyclerView: RecyclerView
    private lateinit var progressBar: ProgressBar
    private lateinit var emptyStateLayout: LinearLayout
    private lateinit var apiService: ApiService
    private lateinit var sharedPrefsManager: SharedPreferencesManager
    private lateinit var adapter: AppointmentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        RetrofitClient.initialize(this)
        sharedPrefsManager = SharedPreferencesManager(this)
        apiService = RetrofitClient.getApiService()

        newAppointmentButton = findViewById(R.id.new_appointment_button)
        logoutButton = findViewById(R.id.logout_button)
        appointmentsRecyclerView = findViewById(R.id.appointments_recycler)
        progressBar = findViewById(R.id.progress_bar)
        emptyStateLayout = findViewById(R.id.empty_state_layout)

        appointmentsRecyclerView.layoutManager = LinearLayoutManager(this)
        adapter = AppointmentAdapter()
        appointmentsRecyclerView.adapter = adapter

        newAppointmentButton.setOnClickListener {
            startActivity(Intent(this, AppointmentBookingActivity::class.java))
        }

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
                val response = apiService.getCustomerAppointments()
                if (response.isSuccessful && response.body() != null) {
                    val appointments = response.body()!!
                    if (appointments.isEmpty()) {
                        emptyStateLayout.visibility = android.view.View.VISIBLE
                        appointmentsRecyclerView.visibility = android.view.View.GONE
                    } else {
                        emptyStateLayout.visibility = android.view.View.GONE
                        appointmentsRecyclerView.visibility = android.view.View.VISIBLE
                        adapter.submitList(appointments)
                    }
                } else {
                    Toast.makeText(this@MainActivity, "Failed to load appointments", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                progressBar.visibility = android.view.View.GONE
            }
        }
    }
}
