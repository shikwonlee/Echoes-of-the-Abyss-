package com.example

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*

@Composable
fun SettingsDialog(
    currentSettings: GameSettings,
    onSaveSettings: (GameSettings) -> Unit,
    onDismiss: () -> Unit
) {
    var sensitivity by remember { mutableFloatStateOf(currentSettings.lookSensitivity) }
    var soundVol by remember { mutableFloatStateOf(currentSettings.soundVolume) }
    var ambVol by remember { mutableFloatStateOf(currentSettings.ambientVolume) }
    var graphicsQuality by remember { mutableStateOf(currentSettings.graphicsQuality) }
    var weather by remember { mutableStateOf(currentSettings.weather) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground.copy(alpha = 0.92f))
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, AbyssCyan.copy(alpha = 0.4f))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SETTINGS & CONTROLS",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = AbyssCyan,
                        letterSpacing = 1.sp
                    )
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("close_settings_button")
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }

                HorizontalDivider(
                    color = DarkSurfaceVariant,
                    modifier = Modifier.padding(vertical = 12.dp)
                )

                // Settings Scroll Content
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    // Look Sensitivity
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Camera Look Sensitivity", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("${String.format("%.1f", sensitivity)}x", color = AbyssCyan, fontSize = 13.sp)
                        }
                        Slider(
                            value = sensitivity,
                            onValueChange = { sensitivity = it },
                            valueRange = 0.4f..2.5f,
                            colors = SliderDefaults.colors(
                                thumbColor = AbyssCyan,
                                activeTrackColor = AbyssCyanDark,
                                inactiveTrackColor = DarkSurfaceVariant
                            )
                        )
                    }

                    // Sound Effects Volume
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Sound Effects & Echo Ping", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("${Math.round(soundVol * 100)}%", color = AbyssCyan, fontSize = 13.sp)
                        }
                        Slider(
                            value = soundVol,
                            onValueChange = { soundVol = it },
                            valueRange = 0.0f..1.0f,
                            colors = SliderDefaults.colors(
                                thumbColor = AbyssCyan,
                                activeTrackColor = AbyssCyanDark,
                                inactiveTrackColor = DarkSurfaceVariant
                            )
                        )
                    }

                    // Ambient Ocean & Wind Volume
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Atmospheric Ocean & Wind", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("${Math.round(ambVol * 100)}%", color = AbyssCyan, fontSize = 13.sp)
                        }
                        Slider(
                            value = ambVol,
                            onValueChange = { ambVol = it },
                            valueRange = 0.0f..1.0f,
                            colors = SliderDefaults.colors(
                                thumbColor = AbyssCyan,
                                activeTrackColor = AbyssCyanDark,
                                inactiveTrackColor = DarkSurfaceVariant
                            )
                        )
                    }

                    // Graphics Preset
                    Column {
                        Text("3D Rendering Quality", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("Performance", "Balanced", "Ultra").forEach { preset ->
                                val selected = graphicsQuality == preset
                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { graphicsQuality = preset },
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (selected) AbyssCyanDark else DarkSurfaceVariant,
                                    border = if (selected) androidx.compose.foundation.BorderStroke(1.dp, AbyssCyan) else null
                                ) {
                                    Text(
                                        text = preset,
                                        color = if (selected) Color.White else TextSecondary,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(vertical = 10.dp),
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                    )
                                }
                            }
                        }
                    }

                    // Weather Simulation
                    Column {
                        Text("Atmospheric Weather Preset", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("clear" to "Clear Sky", "fog" to "Dense Mist", "storm" to "Thunderstorm").forEach { (key, label) ->
                                val selected = weather == key
                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { weather = key },
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (selected) AbyssCyanDark else DarkSurfaceVariant,
                                    border = if (selected) androidx.compose.foundation.BorderStroke(1.dp, AbyssCyan) else null
                                ) {
                                    Text(
                                        text = label,
                                        color = if (selected) Color.White else TextSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(vertical = 10.dp),
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                    )
                                }
                            }
                        }
                    }

                    // Controls Guide Summary
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(DarkSurfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Text("Touch / Key Bindings Guide:", color = AbyssCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("• Left Joystick: Walk / Strafe (WASD on keyboard)", color = TextSecondary, fontSize = 11.sp)
                        Text("• Right Drag: 360° Camera Look (Mouse Look)", color = TextSecondary, fontSize = 11.sp)
                        Text("• ECHO [Q]: Emit Sonar Pulse & Reveal Runes", color = TextSecondary, fontSize = 11.sp)
                        Text("• SNEAK [Ctrl]: Silent crouching past Abyssal Prowlers", color = TextSecondary, fontSize = 11.sp)
                        Text("• RUN [Shift]: Fast sprint (Drains stamina)", color = TextSecondary, fontSize = 11.sp)
                        Text("• E / Tap: Collect resource / Inspect puzzle", color = TextSecondary, fontSize = 11.sp)
                    }
                }

                // Save Button
                Button(
                    onClick = {
                        onSaveSettings(
                            GameSettings(
                                lookSensitivity = sensitivity,
                                soundVolume = soundVol,
                                ambientVolume = ambVol,
                                graphicsQuality = graphicsQuality,
                                weather = weather
                            )
                        )
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AbyssCyanDark),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .padding(top = 10.dp)
                ) {
                    Text("APPLY SETTINGS", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
            }
        }
    }
}
