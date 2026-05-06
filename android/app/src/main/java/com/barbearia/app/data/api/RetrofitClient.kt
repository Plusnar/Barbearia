package com.barbearia.app.data.api

import android.content.Context
import com.barbearia.app.BuildConfig
import com.barbearia.app.utils.AppConfig
import com.google.gson.GsonBuilder
import java.util.concurrent.TimeUnit
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    fun createApiService(context: Context): ApiService {
        val sharedPrefsManager = SharedPreferencesManager(context)
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val authInterceptor = Interceptor { chain ->
            val originalRequest = chain.request()
            val token = sharedPrefsManager.getToken()

            val newRequest = if (token != null) {
                originalRequest.newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
            } else {
                originalRequest
            }
            chain.proceed(newRequest)
        }

        val httpClient = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .connectTimeout(AppConfig.CONNECTION_TIMEOUT, TimeUnit.SECONDS)
            .readTimeout(AppConfig.READ_TIMEOUT, TimeUnit.SECONDS)
            .writeTimeout(AppConfig.WRITE_TIMEOUT, TimeUnit.SECONDS)
            .build()

        val gson = GsonBuilder()
            .setLenient()
            .create()

        return Retrofit.Builder()
            .baseUrl(AppConfig.API_BASE_URL)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(ApiService::class.java)
    }
}
