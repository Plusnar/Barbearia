package com.barbearia.app

import android.app.Application
import com.barbearia.app.data.api.RetrofitClient
import com.barbearia.app.data.api.SharedPreferencesManager
import com.barbearia.app.data.repository.BarbeariaRepository

class BarbeariaApplication : Application() {
    val sessionManager by lazy { SharedPreferencesManager(this) }

    val repository by lazy {
        BarbeariaRepository(
            apiService = RetrofitClient.createApiService(this),
            sessionManager = sessionManager
        )
    }
}
