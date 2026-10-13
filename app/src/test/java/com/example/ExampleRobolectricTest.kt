package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ExampleRobolectricTest {

    @Test
    fun `read string from context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("Echoes of the Abyss", appName)
    }

    @Test
    fun `save and load game repository progress`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val repo = GameSaveRepository(context)

        repo.saveProgress(2, setOf("shore", "forest"), "escape")
        assertEquals(2, repo.getQuestIndex())
        assertTrue(repo.getDiscoveredLocations().contains("forest"))
        assertEquals("escape", repo.getEndingReached())

        repo.resetProgress()
        assertEquals(0, repo.getQuestIndex())
    }
}
