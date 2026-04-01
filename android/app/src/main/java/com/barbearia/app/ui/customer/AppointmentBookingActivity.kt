package com.barbearia.app.ui.customer

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.barbearia.app.R
import com.barbearia.app.data.api.ApiService
import com.barbearia.app.data.api.BookAppointmentRequest
import com.barbearia.app.data.api.RetrofitClient
import com.barbearia.app.data.model.Barber
import com.barbearia.app.data.model.Service
import com.barbearia.app.ui.adapter.BarberAdapter
import com.barbearia.app.ui.adapter.ServiceAdapter
import com.google.android.material.datepicker.MaterialDatePicker
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.launch

class AppointmentBookingActivity : AppCompatActivity() {
    private lateinit var dateButton: Button
    private lateinit var timeSpinner: Spinner
    private lateinit var barberRecycler: RecyclerView
    private lateinit var serviceRecycler: RecyclerView
    private lateinit var bookButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var apiService: ApiService

    private var selectedDate: String = ""
    private var selectedTime: String = ""
    private var selectedBarberId: String = ""
    private var selectedServiceId: String = ""

    private lateinit var barberAdapter: BarberAdapter
    private lateinit var serviceAdapter: ServiceAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_appointment_booking)

        RetrofitClient.initialize(this)
        apiService = RetrofitClient.getApiService()

        dateButton = findViewById(R.id.date_button)
        timeSpinner = findViewById(R.id.time_spinner)
        barberRecycler = findViewById(R.id.barber_recycler)
        serviceRecycler = findViewById(R.id.service_recycler)
        bookButton = findViewById(R.id.book_button)
        progressBar = findViewById(R.id.progress_bar)

        barberRecycler.layoutManager = GridLayoutManager(this, 2)
        serviceRecycler.layoutManager = GridLayoutManager(this, 1)

        barberAdapter = BarberAdapter { barberId -> selectedBarberId = barberId }
        serviceAdapter = ServiceAdapter { serviceId -> selectedServiceId = serviceId }

        barberRecycler.adapter = barberAdapter
        serviceRecycler.adapter = serviceAdapter

        setupTimeSpinner()
        setupDatePicker()
        setupBookButton()
        loadData()
    }

    private fun setupDatePicker() {
        dateButton.setOnClickListener {
            val datePicker = MaterialDatePicker.Builder.datePicker().build()
            datePicker.addOnPositiveButtonClickListener { selection ->
                val instant = Instant.ofEpochMilli(selection)
                val date = instant.atZone(ZoneId.systemDefault()).toLocalDate()
                selectedDate = date.format(DateTimeFormatter.ISO_DATE)
                dateButton.text = selectedDate
            }
            datePicker.show(supportFragmentManager, "DATE_PICKER")
        }
    }

    private fun setupTimeSpinner() {
        val times = arrayOf(
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
        )
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, times)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        timeSpinner.adapter = adapter
        timeSpinner.onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: android.view.View?, position: Int, id: Long) {
                selectedTime = times[position]
            }
            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
        }
    }

    private fun setupBookButton() {
        bookButton.setOnClickListener {
            if (selectedDate.isEmpty() || selectedTime.isEmpty() || selectedBarberId.isEmpty() || selectedServiceId.isEmpty()) {
                Toast.makeText(this, "Please select all options", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            progressBar.visibility = android.view.View.VISIBLE
            bookButton.isEnabled = false

            lifecycleScope.launch {
                try {
                    val response = apiService.bookAppointment(
                        BookAppointmentRequest(selectedBarberId, selectedServiceId, selectedDate, selectedTime)
                    )
                    if (response.isSuccessful) {
                        Toast.makeText(this@AppointmentBookingActivity, "Appointment booked successfully!", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@AppointmentBookingActivity, "Booking failed", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@AppointmentBookingActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                } finally {
                    progressBar.visibility = android.view.View.GONE
                    bookButton.isEnabled = true
                }
            }
        }
    }

    private fun loadData() {
        progressBar.visibility = android.view.View.VISIBLE
        lifecycleScope.launch {
            try {
                val barbersResponse = apiService.getBarbers()
                val servicesResponse = apiService.getServices()

                if (barbersResponse.isSuccessful && servicesResponse.isSuccessful) {
                    val barbers = barbersResponse.body() ?: emptyList()
                    val services = servicesResponse.body() ?: emptyList()
                    barberAdapter.submitList(barbers)
                    serviceAdapter.submitList(services)
                }
            } catch (e: Exception) {
                Toast.makeText(this@AppointmentBookingActivity, "Error loading data: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                progressBar.visibility = android.view.View.GONE
            }
        }
    }
}
