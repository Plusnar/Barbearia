package com.barbearia.app.ui.customer

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.barbearia.app.BarbeariaApplication
import com.barbearia.app.R
import com.barbearia.app.databinding.ActivityAppointmentBookingBinding
import com.barbearia.app.ui.adapter.BarberAdapter
import com.barbearia.app.ui.adapter.ServiceAdapter
import com.barbearia.app.ui.common.UiState
import com.barbearia.app.ui.common.ViewModelFactory
import com.google.android.material.datepicker.MaterialDatePicker
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class AppointmentBookingActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAppointmentBookingBinding

    private val serviceAdapter = ServiceAdapter(selectable = true)
    private val barberAdapter = BarberAdapter(selectable = true)

    private val viewModel: AppointmentBookingViewModel by viewModels {
        ViewModelFactory((application as BarbeariaApplication).repository)
    }

    private var selectedDate: String = ""
    private val timeOptions = listOf(
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAppointmentBookingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupSpinner()
        setupRecyclerViews()
        setupDatePicker()
        observeState()
        binding.confirmBookingButton.setOnClickListener { confirmBooking() }
        viewModel.loadForm()
    }

    private fun setupToolbar() {
        binding.backButton.setOnClickListener {
            finish()
            overridePendingTransition(R.anim.screen_enter_left, R.anim.screen_exit_right)
        }
    }

    private fun setupSpinner() {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, timeOptions)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.timeSpinner.adapter = adapter
    }

    private fun setupRecyclerViews() {
        binding.servicesRecycler.apply {
            layoutManager = LinearLayoutManager(this@AppointmentBookingActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = serviceAdapter
        }
        binding.barbersRecycler.apply {
            layoutManager = LinearLayoutManager(this@AppointmentBookingActivity)
            adapter = barberAdapter
        }
    }

    private fun setupDatePicker() {
        binding.dateField.setOnClickListener {
            val datePicker = MaterialDatePicker.Builder.datePicker()
                .setTitleText("Escolha a melhor data")
                .build()
            datePicker.addOnPositiveButtonClickListener { millis ->
                val date = Instant.ofEpochMilli(millis)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate()
                selectedDate = date.format(DateTimeFormatter.ISO_DATE)
                binding.dateField.setText(date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
            }
            datePicker.show(supportFragmentManager, "BOOKING_DATE")
        }
    }

    private fun observeState() {
        viewModel.formState.observe(this) { state ->
            binding.formProgressBar.visibility = if (state is UiState.Loading) android.view.View.VISIBLE else android.view.View.GONE
            when (state) {
                is UiState.Error -> Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                is UiState.Success -> {
                    serviceAdapter.submitList(state.data.services)
                    barberAdapter.submitList(state.data.barbers)
                }

                UiState.Idle, UiState.Loading -> Unit
            }
        }

        viewModel.bookingState.observe(this) { state ->
            val isLoading = state is UiState.Loading
            binding.confirmBookingButton.isEnabled = !isLoading
            binding.bookingProgressBar.visibility = if (isLoading) android.view.View.VISIBLE else android.view.View.GONE

            when (state) {
                is UiState.Error -> Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                is UiState.Success -> {
                    Toast.makeText(this, "Agendamento confirmado com sucesso.", Toast.LENGTH_SHORT).show()
                    finish()
                    overridePendingTransition(R.anim.screen_enter_left, R.anim.screen_exit_right)
                }

                UiState.Idle, UiState.Loading -> Unit
            }
        }
    }

    private fun confirmBooking() {
        viewModel.book(
            barberId = barberAdapter.getSelectedBarberId(),
            serviceId = serviceAdapter.getSelectedServiceId(),
            date = selectedDate,
            time = timeOptions[binding.timeSpinner.selectedItemPosition],
            notes = binding.notesInput.text?.toString().orEmpty()
        )
    }
}
