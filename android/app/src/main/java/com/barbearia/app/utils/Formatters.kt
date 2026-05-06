package com.barbearia.app.utils

import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private val currencyFormatter = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))

fun Double.toBrazilianCurrency(): String = currencyFormatter.format(this)

fun String.toFriendlyDate(): String {
    return runCatching {
        LocalDate.parse(this, DateTimeFormatter.ISO_DATE)
            .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    }.getOrDefault(this)
}
