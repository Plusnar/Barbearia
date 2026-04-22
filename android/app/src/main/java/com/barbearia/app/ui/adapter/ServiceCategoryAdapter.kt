package com.barbearia.app.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import android.widget.TextView
import com.google.android.material.card.MaterialCardView
import com.barbearia.app.R
import com.barbearia.app.data.model.Service

class ServiceCategoryAdapter(private val onServiceSelected: (String) -> Unit = {}) :
    ListAdapter<Service, ServiceCategoryAdapter.ViewHolder>(ServiceDiffCallback()) {

    class ViewHolder(
        itemView: android.view.View,
        private val onServiceSelected: (String) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        private val card: MaterialCardView = itemView.findViewById(R.id.service_card_category)
        private val nameTextView: TextView = itemView.findViewById(R.id.service_name_category)
        private val priceTextView: TextView = itemView.findViewById(R.id.service_price_category)
        private var serviceId: String = ""

        fun bind(service: Service) {
            serviceId = service.id
            nameTextView.text = service.name
            priceTextView.text = "R\$  " + String.format("%.2f", service.price)
            
            card.setOnClickListener { onServiceSelected(serviceId) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_service_category, parent, false)
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
