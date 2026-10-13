package com.example

import android.annotation.SuppressLint
import android.graphics.Color
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.*

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun GameViewContainer(
    viewModel: GameViewModel,
    onOpenSettings: () -> Unit,
    onReturnToMenu: () -> Unit
) {
    val context = LocalContext.current
    var isPaused by remember { mutableStateOf(false) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    // Intercept hardware Back button to show pause menu
    BackHandler {
        isPaused = true
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        // Embedded 3D Three.js WebGL WebView
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    setBackgroundColor(Color.TRANSPARENT)

                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        allowFileAccess = true
                        allowContentAccess = true
                        mediaPlaybackRequiresUserGesture = false
                        cacheMode = WebSettings.LOAD_DEFAULT
                        useWideViewPort = true
                        loadWithOverviewMode = true
                        setSupportZoom(false)
                    }

                    // Attach JavascriptInterface
                    val bridge = GameBridge(
                        context = ctx,
                        onLocationDiscoveredCallback = { id, name ->
                            viewModel.onLocationDiscovered(id, name)
                        },
                        onQuestAdvancedCallback = { idx, title ->
                            viewModel.onQuestAdvanced(idx, title)
                        },
                        onEndingReachedCallback = { type, title, narrative ->
                            viewModel.onEndingReached(type, title, narrative)
                        }
                    )
                    addJavascriptInterface(bridge, "AndroidBridge")

                    webChromeClient = WebChromeClient()
                    webViewClient = WebViewClient()

                    loadUrl("file:///android_asset/web/index.html")
                    webViewRef = this
                }
            },
            update = { webView ->
                webViewRef = webView
            }
        )

        // Top subtle Pause/Menu bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { isPaused = true },
                modifier = Modifier
                    .background(DarkSurface.copy(alpha = 0.6f), RoundedCornerShape(50))
                    .size(36.dp)
                    .testTag("pause_game_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Pause,
                    contentDescription = "Pause Game",
                    tint = TextPrimary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        // Pause Modal Overlay
        if (isPaused) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(DarkBackground.copy(alpha = 0.85f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, AbyssCyan.copy(alpha = 0.3f))
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "EXPEDITION PAUSED",
                            fontSize = 18.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.ExtraBold,
                            color = AbyssCyan,
                            letterSpacing = 1.5.sp
                        )

                        Text(
                            text = "Your vitals, inventory, and charted sectors are safe.",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )

                        Button(
                            onClick = { isPaused = false },
                            colors = ButtonDefaults.buttonColors(containerColor = AbyssCyanDark),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = "Resume")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("RESUME EXPLORATION")
                        }

                        OutlinedButton(
                            onClick = {
                                isPaused = false
                                onOpenSettings()
                            },
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, DarkSurfaceVariant),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Icon(Icons.Default.Settings, contentDescription = "Settings", tint = AbyssCyan)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("SETTINGS & CONTROLS", color = TextPrimary)
                        }

                        OutlinedButton(
                            onClick = onReturnToMenu,
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, DangerRed.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Menu", tint = DangerRed)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("SAVE & RETURN TO TITLE", color = DangerRed)
                        }
                    }
                }
            }
        }
    }
}
