package com.example

import android.content.Context
import android.content.SharedPreferences

data class GameSettings(
    val lookSensitivity: Float = 1.0f,
    val soundVolume: Float = 0.8f,
    val ambientVolume: Float = 0.5f,
    val graphicsQuality: String = "Balanced", // "Performance", "Balanced", "Ultra"
    val weather: String = "clear" // "clear", "fog", "storm"
)

class GameSaveRepository(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("echoes_abyss_save", Context.MODE_PRIVATE)

    fun saveProgress(currentQuestIndex: Int, discoveredLocations: Set<String>, endingReached: String?) {
        prefs.edit()
            .putInt("current_quest_index", currentQuestIndex)
            .putStringSet("discovered_locations", discoveredLocations)
            .putString("ending_reached", endingReached)
            .apply()
    }

    fun getQuestIndex(): Int = prefs.getInt("current_quest_index", 0)

    fun getDiscoveredLocations(): Set<String> =
        prefs.getStringSet("discovered_locations", setOf("shore")) ?: setOf("shore")

    fun getEndingReached(): String? = prefs.getString("ending_reached", null)

    fun saveSettings(settings: GameSettings) {
        prefs.edit()
            .putFloat("look_sensitivity", settings.lookSensitivity)
            .putFloat("sound_volume", settings.soundVolume)
            .putFloat("ambient_volume", settings.ambientVolume)
            .putString("graphics_quality", settings.graphicsQuality)
            .putString("weather", settings.weather)
            .apply()
    }

    fun loadSettings(): GameSettings {
        return GameSettings(
            lookSensitivity = prefs.getFloat("look_sensitivity", 1.0f),
            soundVolume = prefs.getFloat("sound_volume", 0.8f),
            ambientVolume = prefs.getFloat("ambient_volume", 0.5f),
            graphicsQuality = prefs.getString("graphics_quality", "Balanced") ?: "Balanced",
            weather = prefs.getString("weather", "clear") ?: "clear"
        )
    }

    fun resetProgress() {
        prefs.edit()
            .remove("current_quest_index")
            .remove("discovered_locations")
            .remove("ending_reached")
            .apply()
    }
}
