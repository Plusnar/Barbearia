package com.barbearia.app.ui.customer

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.barbearia.app.BarbeariaApplication
import com.barbearia.app.R
import com.barbearia.app.databinding.ActivityMainBinding
import com.barbearia.app.ui.adapter.AppointmentAdapter
import com.barbearia.app.ui.adapter.PlanAdapter
import com.barbearia.app.ui.auth.LoginActivity
import com.barbearia.app.ui.common.UiState
import com.barbearia.app.ui.common.ViewModelFactory

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    private val appointmentAdapter = AppointmentAdapter()
    private val planAdapter = PlanAdapter()

    private val viewModel: MainViewModel by viewModels {
        ViewModelFactory((application as BarbeariaApplication).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerViews()
        setupListeners()
        observeState()
        viewModel.loadDashboard()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadDashboard()
    }

    private fun setupRecyclerViews() {
        binding.servicesRecycler.apply {
            layoutManager = LinearLayoutManager(this@MainActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = planAdapter
        }
        binding.appointmentsRecycler.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = appointmentAdapter
        }
    }

    private fun setupListeners() {
        binding.bookHeroButton.setOnClickListener {
            startActivity(Intent(this, AppointmentBookingActivity::class.java))
            overridePendingTransition(R.anim.screen_enter_right, R.anim.screen_exit_left)
        }
        binding.newAppointmentButton.setOnClickListener {
            startActivity(Intent(this, AppointmentBookingActivity::class.java))
            overridePendingTransition(R.anim.screen_enter_right, R.anim.screen_exit_left)
        }
        binding.logoutButton.setOnClickListener {
            viewModel.logout()
            startActivity(Intent(this, LoginActivity::class.java))
            overridePendingTransition(R.anim.screen_enter_left, R.anim.screen_exit_right)
            finish()
        }
    }

    private fun observeState() {
        viewModel.uiState.observe(this) { state ->
            binding.progressBar.visibility = if (state is UiState.Loading) android.view.View.VISIBLE else android.view.View.GONE

            when (state) {
                is UiState.Error -> Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                is UiState.Success -> {
                    val data = state.data
                    binding.welcomeTitle.text = "Bem-vindo, ${data.user?.name?.substringBefore(' ') ?: "Castilho"}"
                    binding.welcomeSubtitle.text = "Seu estilo premium começa com um agendamento bem feito."
                    binding.emptyAppointments.visibility =
                        if (data.appointments.isEmpty()) android.view.View.VISIBLE else android.view.View.GONE
                    binding.appointmentsRecycler.visibility =
                        if (data.appointments.isEmpty()) android.view.View.GONE else android.view.View.VISIBLE
                    appointmentAdapter.submitList(data.appointments)
                    planAdapter.submitList(data.plans)
                }

                UiState.Idle, UiState.Loading -> Unit
            }
        }
    }
}
