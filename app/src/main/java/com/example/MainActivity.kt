package com.example

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.example.ui.theme.DarkBackground
import com.example.ui.theme.EchoesTheme

class MainActivity : ComponentActivity() {
    private val viewModel: GameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Keep screen on during exploration
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Immersive Sticky fullscreen mode
        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        insetsController.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        insetsController.hide(WindowInsetsCompat.Type.systemBars())

        setContent {
            EchoesTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkBackground
                ) {
                    val uiState by viewModel.uiState.collectAsState()

                    when (uiState.currentScreen) {
                        ScreenState.MAIN_MENU -> {
                            MainMenuScreen(
                                uiState = uiState,
                                onStartGame = { viewModel.navigateTo(ScreenState.IN_GAME) },
                                onOpenArchives = { viewModel.navigateTo(ScreenState.LORE_ARCHIVES) },
                                onOpenSettings = { viewModel.navigateTo(ScreenState.SETTINGS) },
                                onResetGame = { viewModel.resetGame() }
                            )
                        }
                        ScreenState.IN_GAME -> {
                            GameViewContainer(
                                viewModel = viewModel,
                                onOpenSettings = { viewModel.navigateTo(ScreenState.SETTINGS) },
                                onReturnToMenu = { viewModel.navigateTo(ScreenState.MAIN_MENU) }
                            )
                        }
                        ScreenState.SETTINGS -> {
                            SettingsDialog(
                                currentSettings = uiState.settings,
                                onSaveSettings = { viewModel.updateSettings(it) },
                                onDismiss = {
                                    // Return to previous screen or main menu
                                    viewModel.navigateTo(ScreenState.MAIN_MENU)
                                }
                            )
                        }
                        ScreenState.LORE_ARCHIVES -> {
                            LoreArchiveScreen(
                                discoveredLocations = uiState.discoveredLocations,
                                onBack = { viewModel.navigateTo(ScreenState.MAIN_MENU) }
                            )
                        }
                        ScreenState.ENDING -> {
                            EndingScreen(
                                ending = uiState.latestEnding,
                                onReturnToMenu = { viewModel.navigateTo(ScreenState.MAIN_MENU) }
                            )
                        }
                    }
                }
            }
        }
    }
}
