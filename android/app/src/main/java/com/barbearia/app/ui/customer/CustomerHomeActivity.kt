package com.barbearia.app.ui.customer

import android.content.Intent
import android.os.Bundle
import android.widget.ImageButton
import android.widget.PopupMenu
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.barbearia.app.R
import com.barbearia.app.data.api.SharedPreferencesManager
import com.barbearia.app.data.model.Barber
import com.barbearia.app.data.model.Service
import com.barbearia.app.ui.adapter.BarberCardAdapter
import com.barbearia.app.ui.adapter.ServiceCategoryAdapter
import com.barbearia.app.ui.auth.LoginActivity

class CustomerHomeActivity : AppCompatActivity() {

    private lateinit var serviceRecyclerView: RecyclerView
    private lateinit var barberRecyclerView: RecyclerView
    private lateinit var userIconButton: ImageButton
    private lateinit var serviceAdapter: ServiceCategoryAdapter
    private lateinit var barberAdapter: BarberCardAdapter
    private lateinit var prefsManager: SharedPreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_customer_home)

        prefsManager = SharedPreferencesManager(this)

        serviceRecyclerView = findViewById(R.id.service_recycler_view)
        barberRecyclerView = findViewById(R.id.barber_recycler_view)
        userIconButton = findViewById(R.id.user_icon_button)

        setupServiceRecyclerView()
        setupBarberRecyclerView()

        userIconButton.setOnClickListener { showUserMenu() }

        loadMockData()
    }

    private fun setupServiceRecyclerView() {
        serviceAdapter = ServiceCategoryAdapter { serviceId ->
            navigateToBooking(serviceId)
        }
        serviceRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@CustomerHomeActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = serviceAdapter
        }
    }

    private fun setupBarberRecyclerView() {
        barberAdapter = BarberCardAdapter { barberId ->
            navigateToBarberDetails(barberId)
        }
        barberRecyclerView.apply {
            layoutManager = GridLayoutManager(this@CustomerHomeActivity, 3)
            adapter = barberAdapter
        }
    }

    private fun loadMockData() {
        val mockServices = listOf(
            Service("s1", "Corte", "Corte de cabelo clássico", 30, 50.0),
            Service("s2", "Barba", "Barba com navalha", 25, 35.0),
            Service("s3", "Limpeza", "Limpeza de pele", 20, 40.0),
            Service("s4", "Hidratação", "Hidratação facial", 40, 60.0),
            Service("s5", "Sobrancelha", "Design de sobrancelha", 15, 25.0)
        )

        val mockBarbers = listOf(
            Barber("b1", "João Silva", "joao@barber.com", "11999999999", "Cortes Modernos", true),
            Barber("b2", "Carlos Santos", "carlos@barber.com", "11999999998", "Especialista em Barba", true),
            Barber("b3", "Pedro Costa", "pedro@barber.com", "11999999997", "Cortes Clássicos", true),
            Barber("b4", "Bruno Oliveira", "bruno@barber.com", "11999999996", "Todos os Estilos", true),
            Barber("b5", "Diego Martins", "diego@barber.com", "11999999995", "Especialista em Design", true),
            Barber("b6", "Rafael Gomes", "rafael@barber.com", "11999999994", "Cortes Modernos", true)
        )

        serviceAdapter.submitList(mockServices)
        barberAdapter.submitList(mockBarbers)
    }

    private fun navigateToBooking(serviceId: String) {
        val intent = Intent(this, AppointmentBookingActivity::class.java)
        intent.putExtra("SERVICE_ID", serviceId)
        startActivity(intent)
    }

    private fun navigateToBarberDetails(barberId: String) {
        val intent = Intent(this, AppointmentBookingActivity::class.java)
        intent.putExtra("BARBER_ID", barberId)
        startActivity(intent)
    }

    private fun showUserMenu() {
        val popup = PopupMenu(this, userIconButton)
        popup.menuInflater.inflate(R.menu.menu_user, popup.menu)
        popup.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                R.id.menu_profile -> true
                R.id.menu_settings -> true
                R.id.menu_logout -> {
                    performLogout()
                    true
                }
                else -> false
            }
        }
        popup.show()
    }

    private fun performLogout() {
        prefsManager.clearUserData()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
