package com.example

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
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
fun LoreArchiveScreen(
    discoveredLocations: Set<String>,
    onBack: () -> Unit
) {
    BackHandler { onBack() }
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Dossier, 1: Sectors, 2: Bestiary

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(16.dp)
    ) {
        // Top Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.testTag("archive_back_button")
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = AbyssCyan)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "PROJECT ABYSS DOSSIER",
                    color = TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Classified Island Research Archives",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
        }

        // Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("Dossier", "Sectors (6)", "Creatures").forEachIndexed { index, title ->
                val selected = selectedTab == index
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { selectedTab = index },
                    shape = RoundedCornerShape(8.dp),
                    color = if (selected) AbyssCyanDark else DarkSurface,
                    border = if (selected) androidx.compose.foundation.BorderStroke(1.dp, AbyssCyan) else null
                ) {
                    Text(
                        text = title,
                        color = if (selected) Color.White else TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 10.dp),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        }

        // Tab Content
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            when (selectedTab) {
                0 -> DossierTab()
                1 -> SectorsTab(discoveredLocations)
                2 -> BestiaryTab()
            }
        }
    }
}

@Composable
fun DossierTab() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "INCIDENT LOG: 1986 EXPEDITION",
                    color = AbyssCyan,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Deep seismic drilling at Sector 04 (Blackstone Caverns) triggered an unprecedented sub-surface resonance. Scientists recorded continuous acoustic pulses that mimicked biological sonar. When the Abyssal Gate unsealed, the biological ecosystem morphed, and shadowy entities emerged from the subterranean rifts.",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "THE ECHO VISION PHENOMENON",
                    color = AbyssCyan,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "By emitting harmonic acoustic pulses, survivors can perceive dormant runic script etched into stone, identify structural stress pathways, and illuminate concealed supply caches. Most critically, an Echo Pulse destabilizes the electromagnetic nervous system of nearby Abyssal Prowlers, buying crucial escape time.",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
            }
        }
    }
}

@Composable
fun SectorsTab(discoveredLocations: Set<String>) {
    val sectors = listOf(
        "shore" to ("The Forgotten Shore" to "Shipwreck cove and initial emergency radio communications tower."),
        "forest" to ("The Whispering Forest" to "Ancient pine canopy housing the colossal runic monolith."),
        "village" to ("The Sunken Village" to "Flooded stilt settlement with sluice drainage mechanism."),
        "caverns" to ("The Blackstone Caverns" to "Deep obsidian tunnels resonant with glowing sonic crystals."),
        "facility" to ("The Research Facility" to "Reinforced concrete laboratory bunker and central mainframe."),
        "gate" to ("The Abyssal Gate" to "The colossal stone ring perched over the oceanic void.")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        sectors.forEach { (id, info) ->
            val (name, desc) = info
            val isDiscovered = discoveredLocations.contains(id)

            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isDiscovered) DarkSurface else DarkBackground
                ),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isDiscovered) AbyssCyan.copy(alpha = 0.5f) else DarkSurfaceVariant
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isDiscovered) Icons.Default.CheckCircle else Icons.Default.Lock,
                        contentDescription = if (isDiscovered) "Discovered" else "Locked",
                        tint = if (isDiscovered) AbyssCyan else TextSecondary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = name,
                            color = if (isDiscovered) TextPrimary else TextSecondary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (isDiscovered) desc else "Undiscovered sector. Venture into the fog to map this territory.",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BestiaryTab() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "ENTITY: THE ABYSSAL PROWLER",
                        color = DangerRed,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "THREAT LEVEL: HIGH",
                        color = WarningGold,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "A quadrupedal chitinous predator that stalks the dense forest and caverns. Highly sensitive to noise generated by sprinting and direct flashlight illumination.",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text("Tactical Countermeasures:", color = AbyssCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text("• Crouch (Sneak) to reduce acoustic detection radius to 2 meters.", color = TextSecondary, fontSize = 11.sp)
                Text("• Fire an Echo Pulse (Q) directly at the prowler to temporarily stun it for 6 seconds.", color = TextSecondary, fontSize = 11.sp)
                Text("• Break line of sight behind ancient stones or dense pine trunks.", color = TextSecondary, fontSize = 11.sp)
            }
        }
    }
}
