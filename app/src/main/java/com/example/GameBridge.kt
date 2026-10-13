package com.example

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.webkit.JavascriptInterface

class GameBridge(
    private val context: Context,
    private val onLocationDiscoveredCallback: (String, String) -> Unit,
    private val onQuestAdvancedCallback: (Int, String) -> Unit,
    private val onEndingReachedCallback: (String, String, String) -> Unit
) {
    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(durationMs.coerceIn(20, 500), VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(durationMs.coerceIn(20, 500))
            }
        } catch (e: Exception) {
            Log.w("GameBridge", "Vibration failed", e)
        }
    }

    @JavascriptInterface
    fun onLocationDiscovered(locationId: String, name: String) {
        onLocationDiscoveredCallback(locationId, name)
    }

    @JavascriptInterface
    fun onQuestAdvanced(questIndex: Int, title: String) {
        onQuestAdvancedCallback(questIndex, title)
    }

    @JavascriptInterface
    fun onEndingReached(endingType: String, title: String, narrative: String) {
        onEndingReachedCallback(endingType, title, narrative)
    }

    @JavascriptInterface
    fun logDebug(msg: String) {
        Log.d("GameBridge", msg)
    }
}
