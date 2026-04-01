# ProGuard rules for Barbearia

-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep class com.barbearia.app.data.model.** { *; }
-keep class com.barbearia.app.data.api.** { *; }

-dontwarn com.squareup.okhttp3.**
-keep class com.squareup.okhttp3.** { *; }

-dontwarn okio.**
-keep class okio.** { *; }

-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepclasseswithmembers class retrofit2.** { *; }

-dontwarn com.google.gson.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.JsonSerializable { *; }

-keep class androidx.** { *; }
-dontwarn androidx.**

-keep class kotlin.** { *; }
-dontwarn kotlin.**
