package com.barbearia.app.ui.auth

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.barbearia.app.R
import com.barbearia.app.data.model.Plan

class PlanAdapter(
    private val plans: List<Plan>,
    private val onPlanSelected: (Plan) -> Unit
) : RecyclerView.Adapter<PlanAdapter.PlanViewHolder>() {

    private var selectedPosition = -1

    class PlanViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val card: View = view.findViewById(R.id.plan_card)
        val name: TextView = view.findViewById(R.id.plan_name)
        val price: TextView = view.findViewById(R.id.plan_price)
        val description: TextView = view.findViewById(R.id.plan_description)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlanViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_plan, parent, false)
        return PlanViewHolder(view)
    }

    override fun onBindViewHolder(holder: PlanViewHolder, position: Int) {
        val plan = plans[position]
        holder.name.text = plan.name
        holder.price.text = "R$ ${"%.2f".format(plan.price)}"
        holder.description.text = plan.description

        if (selectedPosition == position) {
            holder.card.setBackgroundResource(R.drawable.input_background) // Using input_background as a temporary highlight
            holder.card.alpha = 1.0f
            holder.card.elevation = 8f
        } else {
            holder.card.setBackgroundResource(android.R.color.white)
            holder.card.alpha = 0.8f
            holder.card.elevation = 2f
        }

        holder.itemView.setOnClickListener {
            val previousPosition = selectedPosition
            selectedPosition = holder.adapterPosition
            if (previousPosition >= 0) {
                notifyItemChanged(previousPosition)
            }
            if (selectedPosition >= 0) {
                notifyItemChanged(selectedPosition)
                onPlanSelected(plan)
            }
        }
    }

    override fun getItemCount() = plans.size
}
