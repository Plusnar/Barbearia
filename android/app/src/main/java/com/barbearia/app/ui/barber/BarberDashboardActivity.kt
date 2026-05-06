package com.barbearia.app.ui.barber

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.barbearia.app.BarbeariaApplication
import com.barbearia.app.R
import com.barbearia.app.databinding.ActivityBarberDashboardBinding
import com.barbearia.app.ui.adapter.AppointmentAdapter
import com.barbearia.app.ui.auth.LoginActivity
import com.barbearia.app.ui.common.UiState
import com.barbearia.app.ui.common.ViewModelFactory

class BarberDashboardActivity : AppCompatActivity() {
    private lateinit var binding: ActivityBarberDashboardBinding
    private val appointmentAdapter = AppointmentAdapter()

    private val viewModel: BarberDashboardViewModel by viewModels {
        ViewModelFactory((application as BarbeariaApplication).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.appointmentsRecycler.layoutManager = LinearLayoutManager(this)
        binding.appointmentsRecycler.adapter = appointmentAdapter

        binding.logoutButton.setOnClickListener {
            viewModel.logout()
            startActivity(Intent(this, LoginActivity::class.java))
            overridePendingTransition(R.anim.screen_enter_left, R.anim.screen_exit_right)
            finish()
        }

        observeState()
        viewModel.loadAppointments()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadAppointments()
    }

    private fun observeState() {
        viewModel.uiState.observe(this) { state ->
            binding.progressBar.visibility = if (state is UiState.Loading) android.view.View.VISIBLE else android.view.View.GONE

            when (state) {
                is UiState.Error -> Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                is UiState.Success -> {
                    binding.emptyState.visibility =
                        if (state.data.isEmpty()) android.view.View.VISIBLE else android.view.View.GONE
                    appointmentAdapter.submitList(state.data)
                }

                UiState.Idle, UiState.Loading -> Unit
            }
        }
    }
}
