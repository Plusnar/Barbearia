package com.barbearia.app.ui.admin

import android.content.Intent
import android.os.Bundle
import android.widget.Button
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
import com.barbearia.app.ui.adapter.AppointmentAdapter
import com.barbearia.app.ui.auth.LoginActivity
import kotlinx.coroutines.launch

class AdminPanelActivity : AppCompatActivity() {
    private lateinit var totalAppointmentsText: TextView
    private lateinit var completedAppointmentsText: TextView
    private lateinit var totalRevenueText: TextView
    private lateinit var activeBarbersText: TextView
    private lateinit var totalCustomersText: TextView
    private lateinit var appointmentsRecycler: RecyclerView
    private lateinit var logoutButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var apiService: ApiService
    private lateinit var sharedPrefsManager: SharedPreferencesManager
    private lateinit var adapter: AppointmentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_admin_panel)

        RetrofitClient.initialize(this)
        sharedPrefsManager = SharedPreferencesManager(this)
        apiService = RetrofitClient.getApiService()

        totalAppointmentsText = findViewById(R.id.total_appointments)
        completedAppointmentsText = findViewById(R.id.completed_appointments)
        totalRevenueText = findViewById(R.id.total_revenue)
        activeBarbersText = findViewById(R.id.active_barbers)
        totalCustomersText = findViewById(R.id.total_customers)
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

        loadAdminData()
        loadAllAppointments()
    }

    private fun loadAdminData() {
        lifecycleScope.launch {
            try {
                val response = apiService.getAdminStatistics()
                if (response.isSuccessful && response.body() != null) {
                    val stats = response.body()!!
                    totalAppointmentsText.text = "Total: ${stats.totalAppointments}"
                    completedAppointmentsText.text = "Completed: ${stats.completedAppointments}"
                    totalRevenueText.text = "Revenue: R$ ${String.format("%.2f", stats.totalRevenue)}"
                    activeBarbersText.text = "Active Barbers: ${stats.activeBarbers}"
                    totalCustomersText.text = "Customers: ${stats.totalCustomers}"
                }
            } catch (e: Exception) {
                Toast.makeText(this@AdminPanelActivity, "Error loading statistics", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun loadAllAppointments() {
        progressBar.visibility = android.view.View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = apiService.getAllAppointments()
                if (response.isSuccessful && response.body() != null) {
                    adapter.submitList(response.body())
                }
            } catch (e: Exception) {
                Toast.makeText(this@AdminPanelActivity, "Error loading appointments", Toast.LENGTH_SHORT).show()
            } finally {
                progressBar.visibility = android.view.View.GONE
            }
        }
    }
}
