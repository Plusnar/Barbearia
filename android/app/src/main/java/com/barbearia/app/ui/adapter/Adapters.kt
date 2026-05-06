package com.barbearia.app.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.barbearia.app.R
import com.barbearia.app.data.model.Appointment
import com.barbearia.app.data.model.AppointmentStatus
import com.barbearia.app.data.model.Barber
import com.barbearia.app.data.model.BarberProfit
import com.barbearia.app.data.model.Plan
import com.barbearia.app.data.model.Service
import com.barbearia.app.utils.toBrazilianCurrency
import com.barbearia.app.utils.toFriendlyDate
import com.google.android.material.card.MaterialCardView

class AppointmentAdapter : ListAdapter<Appointment, AppointmentAdapter.ViewHolder>(AppointmentDiffCallback()) {
    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val title: TextView = itemView.findViewById(R.id.appointment_title)
        private val subtitle: TextView = itemView.findViewById(R.id.appointment_subtitle)
        private val metadata: TextView = itemView.findViewById(R.id.appointment_metadata)
        private val status: TextView = itemView.findViewById(R.id.appointment_status)

        fun bind(appointment: Appointment) {
            title.text = appointment.serviceName
            subtitle.text = appointment.customerName?.let { "Cliente: $it" } ?: "Com ${appointment.barberName}"
            metadata.text = "${appointment.date.toFriendlyDate()} • ${appointment.time}"
            status.text = appointment.status.name

            val background = when (appointment.status) {
                AppointmentStatus.PENDING -> R.drawable.bg_status_pending
                AppointmentStatus.CONFIRMED -> R.drawable.bg_status_confirmed
                AppointmentStatus.COMPLETED -> R.drawable.bg_status_completed
                AppointmentStatus.CANCELLED -> R.drawable.bg_status_cancelled
            }
            status.setBackgroundResource(background)
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_appointment, parent, false)
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

class PlanAdapter : ListAdapter<Plan, PlanAdapter.ViewHolder>(PlanDiffCallback()) {
    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val card: MaterialCardView = itemView.findViewById(R.id.plan_card)
        private val name: TextView = itemView.findViewById(R.id.plan_name)
        private val price: TextView = itemView.findViewById(R.id.plan_price)
        private val description: TextView = itemView.findViewById(R.id.plan_description)
        private val benefits: TextView = itemView.findViewById(R.id.plan_benefits)
        private val recommended: TextView = itemView.findViewById(R.id.plan_recommended)

        fun bind(plan: Plan) {
            name.text = plan.name
            price.text = plan.price.toBrazilianCurrency()
            description.text = plan.description
            benefits.text = plan.features.joinToString(separator = "\n") { "- $it" }
            recommended.visibility = if (plan.recommended) View.VISIBLE else View.GONE
            card.strokeColor = ContextCompat.getColor(
                itemView.context,
                if (plan.recommended) R.color.gold_primary else R.color.stroke_soft
            )
            card.strokeWidth = if (plan.recommended) 4 else 2
            itemView.animate().alpha(1f).translationY(0f).setDuration(220L).start()
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context).inflate(R.layout.item_plan, parent, false)
        itemView.alpha = 0.76f
        itemView.translationY = 12f
        return ViewHolder(itemView)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class PlanDiffCallback : DiffUtil.ItemCallback<Plan>() {
        override fun areItemsTheSame(oldItem: Plan, newItem: Plan) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Plan, newItem: Plan) = oldItem == newItem
    }
}

class BarberProfitAdapter : ListAdapter<BarberProfit, BarberProfitAdapter.ViewHolder>(BarberProfitDiffCallback()) {
    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val name: TextView = itemView.findViewById(R.id.profit_barber_name)
        private val services: TextView = itemView.findViewById(R.id.profit_services)
        private val gross: TextView = itemView.findViewById(R.id.profit_gross)
        private val barberShare: TextView = itemView.findViewById(R.id.profit_barber_share)
        private val houseShare: TextView = itemView.findViewById(R.id.profit_house_share)

        fun bind(item: BarberProfit) {
            name.text = item.barberName
            services.text = "${item.servicesPerformed} servicos"
            gross.text = "Faturamento: ${item.grossRevenue.toBrazilianCurrency()}"
            barberShare.text = "Barbeiro: ${item.barberShare.toBrazilianCurrency()}"
            houseShare.text = "Casa: ${item.houseShare.toBrazilianCurrency()}"
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context).inflate(R.layout.item_barber_profit, parent, false)
        return ViewHolder(itemView)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class BarberProfitDiffCallback : DiffUtil.ItemCallback<BarberProfit>() {
        override fun areItemsTheSame(oldItem: BarberProfit, newItem: BarberProfit) = oldItem.barberId == newItem.barberId
        override fun areContentsTheSame(oldItem: BarberProfit, newItem: BarberProfit) = oldItem == newItem
    }
}

class BarberAdapter(
    private val selectable: Boolean = false,
    private val onBarberSelected: ((Barber) -> Unit)? = null
) : ListAdapter<Barber, BarberAdapter.ViewHolder>(BarberDiffCallback()) {
    private var selectedBarberId: String? = null

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val card: MaterialCardView = itemView.findViewById(R.id.barber_card)
        private val nameTextView: TextView = itemView.findViewById(R.id.barber_name)
        private val specializationTextView: TextView = itemView.findViewById(R.id.specialization)
        private val availabilityTextView: TextView = itemView.findViewById(R.id.availability_label)

        fun bind(barber: Barber, selected: Boolean, selectable: Boolean) {
            nameTextView.text = barber.name
            specializationTextView.text = barber.specialization
            availabilityTextView.text = if (barber.available) "Disponível" else "Indisponível"
            availabilityTextView.setBackgroundResource(
                if (barber.available) R.drawable.bg_status_confirmed else R.drawable.bg_status_cancelled
            )

            val strokeColor = if (selected && selectable) {
                R.color.gold_primary
            } else {
                R.color.stroke_soft
            }
            card.strokeColor = ContextCompat.getColor(itemView.context, strokeColor)
            card.strokeWidth = if (selected && selectable) 4 else 2
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context).inflate(R.layout.item_barber, parent, false)
        return ViewHolder(itemView)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val barber = getItem(position)
        holder.bind(barber, barber.id == selectedBarberId, selectable)
        holder.itemView.setOnClickListener {
            if (!selectable) return@setOnClickListener
            val previousId = selectedBarberId
            selectedBarberId = barber.id
            previousId?.let { oldId ->
                val oldPosition = currentList.indexOfFirst { it.id == oldId }
                if (oldPosition >= 0) notifyItemChanged(oldPosition)
            }
            if (holder.bindingAdapterPosition >= 0) {
                notifyItemChanged(holder.bindingAdapterPosition)
            }
            onBarberSelected?.invoke(barber)
        }
    }

    fun getSelectedBarberId(): String = selectedBarberId.orEmpty()

    class BarberDiffCallback : DiffUtil.ItemCallback<Barber>() {
        override fun areItemsTheSame(oldItem: Barber, newItem: Barber) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Barber, newItem: Barber) = oldItem == newItem
    }
}

class ServiceAdapter(
    private val selectable: Boolean = false,
    private val onServiceSelected: ((Service) -> Unit)? = null
) : ListAdapter<Service, ServiceAdapter.ViewHolder>(ServiceDiffCallback()) {
    private var selectedServiceId: String? = null

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val card: MaterialCardView = itemView.findViewById(R.id.service_card)
        private val nameTextView: TextView = itemView.findViewById(R.id.service_name)
        private val descriptionTextView: TextView = itemView.findViewById(R.id.service_description)
        private val priceTextView: TextView = itemView.findViewById(R.id.service_price)
        private val durationTextView: TextView = itemView.findViewById(R.id.service_duration)

        fun bind(service: Service, selected: Boolean, selectable: Boolean) {
            nameTextView.text = service.name
            descriptionTextView.text = service.description
            priceTextView.text = service.price.toBrazilianCurrency()
            durationTextView.text = "${service.duration} min"

            val strokeColor = if (selected && selectable) {
                R.color.gold_primary
            } else {
                R.color.stroke_soft
            }
            card.strokeColor = ContextCompat.getColor(itemView.context, strokeColor)
            card.strokeWidth = if (selected && selectable) 4 else 2
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context).inflate(R.layout.item_service, parent, false)
        return ViewHolder(itemView)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val service = getItem(position)
        holder.bind(service, service.id == selectedServiceId, selectable)
        holder.itemView.setOnClickListener {
            if (!selectable) return@setOnClickListener
            val previousId = selectedServiceId
            selectedServiceId = service.id
            previousId?.let { oldId ->
                val oldPosition = currentList.indexOfFirst { it.id == oldId }
                if (oldPosition >= 0) notifyItemChanged(oldPosition)
            }
            if (holder.bindingAdapterPosition >= 0) {
                notifyItemChanged(holder.bindingAdapterPosition)
            }
            onServiceSelected?.invoke(service)
        }
    }

    fun getSelectedServiceId(): String = selectedServiceId.orEmpty()

    class ServiceDiffCallback : DiffUtil.ItemCallback<Service>() {
        override fun areItemsTheSame(oldItem: Service, newItem: Service) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Service, newItem: Service) = oldItem == newItem
    }
}
