package com.barbearia.app.data.api

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.barbearia.app.data.model.SessionUser
import com.barbearia.app.utils.AppConstants

class SharedPreferencesManager(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        AppConstants.SHARED_PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) {
        sharedPreferences.edit().putString(AppConstants.KEY_AUTH_TOKEN, token).apply()
    }

    fun getToken(): String? {
        return sharedPreferences.getString(AppConstants.KEY_AUTH_TOKEN, null)
    }

    fun saveUser(user: SessionUser) {
        sharedPreferences.edit().apply {
            putString(AppConstants.KEY_USER_ID, user.id)
            putString(AppConstants.KEY_USER_NAME, user.name)
            putString(AppConstants.KEY_USER_EMAIL, user.email)
            putString(AppConstants.KEY_USER_PHONE, user.phone)
            putString(AppConstants.KEY_USER_ROLE, user.role)
        }.apply()
    }

    fun getSessionUser(): SessionUser? {
        val id = getUserId() ?: return null
        val name = getUserName().orEmpty()
        val email = getUserEmail().orEmpty()
        val phone = getUserPhone().orEmpty()
        val role = getUserRole().orEmpty()
        return SessionUser(id = id, name = name, email = email, phone = phone, role = role)
    }

    fun getUserId(): String? {
        return sharedPreferences.getString(AppConstants.KEY_USER_ID, null)
    }

    fun getUserName(): String? {
        return sharedPreferences.getString(AppConstants.KEY_USER_NAME, null)
    }

    fun getUserEmail(): String? {
        return sharedPreferences.getString(AppConstants.KEY_USER_EMAIL, null)
    }

    fun getUserPhone(): String? {
        return sharedPreferences.getString(AppConstants.KEY_USER_PHONE, null)
    }

    fun getUserRole(): String? {
        return sharedPreferences.getString(AppConstants.KEY_USER_ROLE, null)
    }

    fun isLoggedIn(): Boolean {
        return getToken() != null && getUserId() != null
    }

    fun logout() {
        sharedPreferences.edit().clear().apply()
    }

    fun clearUserData() {
        logout()
    }
}
