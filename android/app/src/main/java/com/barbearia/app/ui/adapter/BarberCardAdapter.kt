package com.barbearia.app.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import android.widget.TextView
import android.widget.RatingBar
import com.google.android.material.card.MaterialCardView
import com.barbearia.app.R
import com.barbearia.app.data.model.Barber
import kotlin.random.Random

class BarberCardAdapter(private val onBarberSelected: (String) -> Unit = {}) :
    ListAdapter<Barber, BarberCardAdapter.ViewHolder>(BarberDiffCallback()) {

    class ViewHolder(
        itemView: android.view.View,
        private val onBarberSelected: (String) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        private val card: MaterialCardView = itemView.findViewById(R.id.barber_card_home)
        private val nameTextView: TextView = itemView.findViewById(R.id.barber_name_home)
        private val specializationTextView: TextView = itemView.findViewById(R.id.barber_specialization_home)
        private val ratingBar: RatingBar = itemView.findViewById(R.id.barber_rating)
        private var barberId: String = ""

        fun bind(barber: Barber) {
            barberId = barber.id
            nameTextView.text = barber.name
            specializationTextView.text = barber.specialization
            
            ratingBar.rating = Random.nextInt(3, 6).toFloat()
            ratingBar.isEnabled = false
            
            card.setOnClickListener { onBarberSelected(barberId) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val itemView = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_barber_card, parent, false)
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
