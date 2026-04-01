package com.barbearia.app.data.api

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SharedPreferencesManager(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "barbearia_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) {
        sharedPreferences.edit().putString("auth_token", token).apply()
    }

    fun getToken(): String? {
        return sharedPreferences.getString("auth_token", null)
    }

    fun saveUser(userId: String, userName: String, userEmail: String, userRole: String) {
        sharedPreferences.edit().apply {
            putString("user_id", userId)
            putString("user_name", userName)
            putString("user_email", userEmail)
            putString("user_role", userRole)
        }.apply()
    }

    fun getUserId(): String? {
        return sharedPreferences.getString("user_id", null)
    }

    fun getUserName(): String? {
        return sharedPreferences.getString("user_name", null)
    }

    fun getUserEmail(): String? {
        return sharedPreferences.getString("user_email", null)
    }

    fun getUserRole(): String? {
        return sharedPreferences.getString("user_role", null)
    }

    fun isLoggedIn(): Boolean {
        return getToken() != null && getUserId() != null
    }

    fun logout() {
        sharedPreferences.edit().clear().apply()
    }
}
