package com.example

import org.junit.Assert.*
import org.junit.Test

class ExampleUnitTest {
    @Test
    fun testGameSettingsDefaults() {
        val settings = GameSettings()
        assertEquals(1.0f, settings.lookSensitivity, 0.001f)
        assertEquals(0.8f, settings.soundVolume, 0.001f)
        assertEquals("Balanced", settings.graphicsQuality)
        assertEquals("clear", settings.weather)
    }

    @Test
    fun testScreenStateTransitions() {
        var current = ScreenState.MAIN_MENU
        current = ScreenState.IN_GAME
        assertEquals(ScreenState.IN_GAME, current)

        current = ScreenState.ENDING
        assertEquals(ScreenState.ENDING, current)
    }

    @Test
    fun testEndingInfoCreation() {
        val ending = EndingInfo(
            type = "escape",
            title = "THE RESCUE SIGNAL",
            narrative = "Emergency seaplane arrives."
        )
        assertEquals("escape", ending.type)
        assertEquals("THE RESCUE SIGNAL", ending.title)
    }
}
