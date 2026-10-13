package com.example

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class ScreenState {
    MAIN_MENU,
    IN_GAME,
    SETTINGS,
    LORE_ARCHIVES,
    ENDING
}

data class EndingInfo(
    val type: String,
    val title: String,
    val narrative: String
)

data class GameUiState(
    val currentScreen: ScreenState = ScreenState.MAIN_MENU,
    val questIndex: Int = 0,
    val activeQuestTitle: String = "Waking on the Shore",
    val discoveredLocations: Set<String> = setOf("shore"),
    val settings: GameSettings = GameSettings(),
    val latestEnding: EndingInfo? = null,
    val isGamePaused: Boolean = false
)

class GameViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = GameSaveRepository(application)

    private val _uiState = MutableStateFlow(
        GameUiState(
            questIndex = repository.getQuestIndex(),
            discoveredLocations = repository.getDiscoveredLocations(),
            settings = repository.loadSettings()
        )
    )
    val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()

    fun navigateTo(screen: ScreenState) {
        _uiState.update { it.copy(currentScreen = screen) }
    }

    fun onLocationDiscovered(locationId: String, name: String) {
        viewModelScope.launch {
            _uiState.update { current ->
                val updated = current.discoveredLocations + locationId
                repository.saveProgress(current.questIndex, updated, current.latestEnding?.type)
                current.copy(discoveredLocations = updated)
            }
        }
    }

    fun onQuestAdvanced(questIndex: Int, questTitle: String) {
        viewModelScope.launch {
            _uiState.update { current ->
                val nextIdx = questIndex + 1
                repository.saveProgress(nextIdx, current.discoveredLocations, current.latestEnding?.type)
                current.copy(questIndex = nextIdx, activeQuestTitle = questTitle)
            }
        }
    }

    fun onEndingReached(type: String, title: String, narrative: String) {
        viewModelScope.launch {
            val ending = EndingInfo(type, title, narrative)
            _uiState.update { current ->
                repository.saveProgress(current.questIndex, current.discoveredLocations, type)
                current.copy(latestEnding = ending, currentScreen = ScreenState.ENDING)
            }
        }
    }

    fun updateSettings(newSettings: GameSettings) {
        viewModelScope.launch {
            repository.saveSettings(newSettings)
            _uiState.update { it.copy(settings = newSettings) }
        }
    }

    fun resetGame() {
        viewModelScope.launch {
            repository.resetProgress()
            _uiState.update {
                it.copy(
                    questIndex = 0,
                    activeQuestTitle = "Waking on the Shore",
                    discoveredLocations = setOf("shore"),
                    latestEnding = null
                )
            }
        }
    }
}
