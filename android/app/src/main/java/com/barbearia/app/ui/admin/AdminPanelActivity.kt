package com.barbearia.app.ui.admin

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.barbearia.app.BarbeariaApplication
import com.barbearia.app.R
import com.barbearia.app.databinding.ActivityAdminPanelBinding
import com.barbearia.app.ui.adapter.AppointmentAdapter
import com.barbearia.app.ui.adapter.BarberProfitAdapter
import com.barbearia.app.ui.auth.LoginActivity
import com.barbearia.app.ui.common.UiState
import com.barbearia.app.ui.common.ViewModelFactory
import com.barbearia.app.utils.toBrazilianCurrency

class AdminPanelActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAdminPanelBinding
    private val appointmentAdapter = AppointmentAdapter()
    private val profitAdapter = BarberProfitAdapter()

    private val viewModel: AdminDashboardViewModel by viewModels {
        ViewModelFactory((application as BarbeariaApplication).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminPanelBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.appointmentsRecycler.layoutManager = LinearLayoutManager(this)
        binding.appointmentsRecycler.adapter = appointmentAdapter
        binding.profitRecycler.layoutManager = LinearLayoutManager(this)
        binding.profitRecycler.adapter = profitAdapter

        binding.logoutButton.setOnClickListener {
            viewModel.logout()
            startActivity(Intent(this, LoginActivity::class.java))
            overridePendingTransition(R.anim.screen_enter_left, R.anim.screen_exit_right)
            finish()
        }
        binding.applyCommissionButton.setOnClickListener {
            val commission = binding.commissionInput.text?.toString()?.toIntOrNull() ?: 50
            viewModel.loadDashboard(commission)
        }

        observeState()
        viewModel.loadDashboard()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadDashboard()
    }

    private fun observeState() {
        viewModel.uiState.observe(this) { state ->
            binding.progressBar.visibility = if (state is UiState.Loading) android.view.View.VISIBLE else android.view.View.GONE

            when (state) {
                is UiState.Error -> Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                is UiState.Success -> {
                    val stats = state.data.statistics
                    binding.adminMetrics.totalAppointmentsValue.text = stats.totalAppointments.toString()
                    binding.adminMetrics.completedAppointmentsValue.text = stats.completedAppointments.toString()
                    binding.adminMetrics.totalRevenueValue.text = stats.totalRevenue.toBrazilianCurrency()
                    binding.adminMetrics.activeBarbersValue.text = stats.activeBarbers.toString()
                    binding.adminMetrics.totalCustomersValue.text = stats.totalCustomers.toString()
                    binding.adminMetrics.servicesPerformedValue.text = stats.servicesPerformed.toString()
                    binding.houseShareValue.text = state.data.profitDistribution.totalHouseShare.toBrazilianCurrency()
                    binding.barberShareValue.text = state.data.profitDistribution.totalBarberShare.toBrazilianCurrency()
                    binding.commissionInput.setText(state.data.profitDistribution.commissionPercentage.toString())
                    appointmentAdapter.submitList(state.data.appointments)
                    profitAdapter.submitList(state.data.profitDistribution.barbers)
                }

                UiState.Idle, UiState.Loading -> Unit
            }
        }
    }
}
