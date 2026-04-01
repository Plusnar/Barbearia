package com.barbearia.app.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.barbearia.app.R
import com.barbearia.app.data.model.Appointment
import com.barbearia.app.data.model.Barber
import com.barbearia.app.data.model.Service
import android.widget.TextView
import android.widget.CardView

class AppointmentAdapter : ListAdapter<Appointment, AppointmentAdapter.ViewHolder>(AppointmentDiffCallback()) {
    class ViewHolder(itemView: android.view.View) : RecyclerView.ViewHolder(itemView) {
        private val barberName: TextView = itemView.findViewById(R.id.barber_name)
        private val serviceName: TextView = itemView.findViewById(R.id.service_name)
        private val dateTime: TextView = itemView.findViewById(R.id.date_time)
        private val status: TextView = itemView.findViewById(R.id.status)

        fun bind(appointment: Appointment) {
            barberName.text = appointment.barberName
            serviceName.text = appointment.serviceName
            dateTime.text = "${appointment.date} ${appointment.time}"
            status.text = appointment.status.name
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context).inflate(R.layout.item_appointment, parent, false)
        return ViewHolder(itemView)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class AppointmentDiffCallback : DiffUtil.ItemCallback<Appointment>() {
        override fun areItemsTheSame(oldItem: Appointment, newItem: Appointment) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Appointment, newItem: Appointment) = oldItem == newItem
    }
}

class BarberAdapter(private val onBarberSelected: (String) -> Unit) : ListAdapter<Barber, BarberAdapter.ViewHolder>(BarberDiffCallback()) {
    class ViewHolder(itemView: android.view.View, private val onBarberSelected: (String) -> Unit) : RecyclerView.ViewHolder(itemView) {
        private val nameTextView: TextView = itemView.findViewById(R.id.barber_name)
        private val specializationTextView: TextView = itemView.findViewById(R.id.specialization)
        private val card: CardView = itemView.findViewById(R.id.barber_card)
        private var barberId: String = ""

        fun bind(barber: Barber) {
            barberId = barber.id
            nameTextView.text = barber.name
            specializationTextView.text = barber.specialization
            card.setOnClickListener { onBarberSelected(barberId) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context).inflate(R.layout.item_barber, parent, false)
        return ViewHolder(itemView, onBarberSelected)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class BarberDiffCallback : DiffUtil.ItemCallback<Barber>() {
        override fun areItemsTheSame(oldItem: Barber, newItem: Barber) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Barber, newItem: Barber) = oldItem == newItem
    }
}

class ServiceAdapter(private val onServiceSelected: (String) -> Unit) : ListAdapter<Service, ServiceAdapter.ViewHolder>(ServiceDiffCallback()) {
    class ViewHolder(itemView: android.view.View, private val onServiceSelected: (String) -> Unit) : RecyclerView.ViewHolder(itemView) {
        private val nameTextView: TextView = itemView.findViewById(R.id.service_name)
        private val priceTextView: TextView = itemView.findViewById(R.id.service_price)
        private val durationTextView: TextView = itemView.findViewById(R.id.service_duration)
        private val card: CardView = itemView.findViewById(R.id.service_card)
        private var serviceId: String = ""

        fun bind(service: Service) {
            serviceId = service.id
            nameTextView.text = service.name
            priceTextView.text = "R$ ${service.price}"
            durationTextView.text = "${service.duration} min"
            card.setOnClickListener { onServiceSelected(serviceId) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context).inflate(R.layout.item_service, parent, false)
        return ViewHolder(itemView, onServiceSelected)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ServiceDiffCallback : DiffUtil.ItemCallback<Service>() {
        override fun areItemsTheSame(oldItem: Service, newItem: Service) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Service, newItem: Service) = oldItem == newItem
    }
}
