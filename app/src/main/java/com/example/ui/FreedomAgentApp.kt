package com.example.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.model.AgentRole
import com.example.model.PolicyProfile
import com.example.model.PrivacyMode
import com.example.model.TaskItemModel
import com.example.model.TaskState
import com.example.ui.theme.FreedomAmber
import com.example.ui.theme.FreedomBackground
import com.example.ui.theme.FreedomBorder
import com.example.ui.theme.FreedomCyan
import com.example.ui.theme.FreedomGreen
import com.example.ui.theme.FreedomIndigo
import com.example.ui.theme.FreedomIndigoDark
import com.example.ui.theme.FreedomIndigoLight
import com.example.ui.theme.FreedomRose
import com.example.ui.theme.FreedomSurface
import com.example.ui.theme.FreedomSurfaceElevated
import com.example.ui.theme.FreedomSurfaceVariant
import com.example.ui.theme.FreedomTextMuted
import com.example.ui.theme.FreedomTextPrimary
import com.example.ui.theme.FreedomTextSecondary

enum class FreedomNavScreen(val title: String, val icon: ImageVector) {
    DASHBOARD("Dashboard", Icons.Default.Dashboard),
    WORKSPACE("Workspace", Icons.Default.Code),
    AGENTS("Agents", Icons.Default.Group),
    SECURITY("Security", Icons.Default.Security)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FreedomAgentApp(
    viewModel: FreedomAgentViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var currentScreen by remember { mutableStateOf(FreedomNavScreen.DASHBOARD) }
    var showCreateDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = FreedomBackground,
        topBar = {
            FreedomTopBar(
                privacyMode = uiState.privacyMode,
                isOllamaConnected = uiState.isOllamaConnected,
                onRefresh = { viewModel.checkBackendConnectivity() }
            )
        },
        bottomBar = {
            FreedomBottomNav(
                currentScreen = currentScreen,
                onSelectScreen = { currentScreen = it }
            )
        },
        floatingActionButton = {
            if (currentScreen == FreedomNavScreen.DASHBOARD || currentScreen == FreedomNavScreen.WORKSPACE) {
                FloatingActionButton(
                    onClick = { showCreateDialog = true },
                    containerColor = FreedomIndigo,
                    contentColor = Color.White,
                    modifier = Modifier.testTag("create_task_fab")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Create Task")
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentScreen) {
                FreedomNavScreen.DASHBOARD -> DashboardScreen(
                    uiState = uiState,
                    onSelectTask = {
                        viewModel.selectTask(it)
                        currentScreen = FreedomNavScreen.WORKSPACE
                    },
                    onCreateClick = { showCreateDialog = true }
                )
                FreedomNavScreen.WORKSPACE -> WorkspaceScreen(
                    uiState = uiState,
                    onApprove = { viewModel.approvePendingAction(it) },
                    onReject = { viewModel.rejectPendingAction(it) },
                    onSelectTask = { viewModel.selectTask(it) }
                )
                FreedomNavScreen.AGENTS -> AgentsScreen(
                    agents = uiState.agents,
                    activeAgentId = uiState.tasks.firstOrNull()?.activeAgent
                )
                FreedomNavScreen.SECURITY -> SecurityScreen(
                    currentPrivacyMode = uiState.privacyMode,
                    currentPolicyProfile = uiState.policyProfile,
                    onSelectPrivacyMode = { viewModel.setPrivacyMode(it) },
                    onSelectPolicyProfile = { viewModel.setPolicyProfile(it) }
                )
            }
        }

        if (showCreateDialog) {
            CreateTaskDialog(
                onDismiss = { showCreateDialog = false },
                onLaunch = { title, prompt ->
                    viewModel.launchTask(title, prompt)
                    showCreateDialog = false
                    currentScreen = FreedomNavScreen.WORKSPACE
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FreedomTopBar(
    privacyMode: PrivacyMode,
    isOllamaConnected: Boolean,
    onRefresh: () -> Unit
) {
    TopAppBar(
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = FreedomSurface.copy(alpha = 0.95f)
        ),
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(FreedomIndigo, FreedomCyan)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text("FA", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
                Column {
                    Text(
                        "FREEDOM AGENT",
                        color = FreedomTextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        "Universal AI Hub",
                        color = FreedomTextMuted,
                        fontSize = 11.sp
                    )
                }
            }
        },
        actions = {
            // Privacy mode pill
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(FreedomSurfaceVariant)
                    .border(1.dp, FreedomIndigo.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    privacyMode.displayName.uppercase(),
                    color = FreedomCyan,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(Modifier.width(6.dp))

            // Ollama connectivity indicator
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (isOllamaConnected) FreedomGreen.copy(alpha = 0.15f) else FreedomRose.copy(alpha = 0.15f))
                    .border(
                        1.dp,
                        if (isOllamaConnected) FreedomGreen.copy(alpha = 0.5f) else FreedomRose.copy(alpha = 0.5f),
                        RoundedCornerShape(12.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(if (isOllamaConnected) FreedomGreen else FreedomRose)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        if (isOllamaConnected) "OLLAMA LIVE" else "OFFLINE",
                        color = if (isOllamaConnected) FreedomGreen else FreedomRose,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            IconButton(onClick = onRefresh) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = FreedomTextSecondary)
            }
        }
    )
}

@Composable
fun FreedomBottomNav(
    currentScreen: FreedomNavScreen,
    onSelectScreen: (FreedomNavScreen) -> Unit
) {
    NavigationBar(
        containerColor = FreedomSurface.copy(alpha = 0.95f),
        tonalElevation = 8.dp
    ) {
        FreedomNavScreen.entries.forEach { screen ->
            val selected = currentScreen == screen
            NavigationBarItem(
                selected = selected,
                onClick = { onSelectScreen(screen) },
                icon = {
                    Icon(
                        screen.icon,
                        contentDescription = screen.title,
                        tint = if (selected) FreedomIndigoLight else FreedomTextMuted
                    )
                },
                label = {
                    Text(
                        screen.title,
                        color = if (selected) FreedomIndigoLight else FreedomTextMuted,
                        fontSize = 12.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = FreedomIndigo.copy(alpha = 0.2f)
                ),
                modifier = Modifier.testTag("nav_${screen.name.lowercase()}")
            )
        }
    }
}

@Composable
fun DashboardScreen(
    uiState: FreedomUiState,
    onSelectTask: (String) -> Unit,
    onCreateClick: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            // Hero Telemetry Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                TelemetryCard(
                    title = "AGENTS",
                    value = "${uiState.agents.size}",
                    subtitle = "Autonomous Specialists",
                    color = FreedomIndigo,
                    modifier = Modifier.weight(1f)
                )
                TelemetryCard(
                    title = "TASKS",
                    value = "${uiState.tasks.size}",
                    subtitle = "${uiState.tasks.count { it.state == TaskState.COMPLETED }} completed",
                    color = FreedomCyan,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                TelemetryCard(
                    title = "PRIVACY",
                    value = uiState.privacyMode.displayName,
                    subtitle = "Zero-egress sandbox",
                    color = FreedomGreen,
                    modifier = Modifier.weight(1f)
                )
                TelemetryCard(
                    title = "MODEL",
                    value = uiState.activeModel,
                    subtitle = "Local inference",
                    color = FreedomAmber,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Active Tasks Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "AUTONOMOUS TASKS",
                    color = FreedomTextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    "${uiState.tasks.size} active",
                    color = FreedomTextMuted,
                    fontSize = 12.sp
                )
            }
        }

        if (uiState.tasks.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = FreedomSurfaceVariant),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("No active missions", color = FreedomTextSecondary, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Launch an autonomous multi-agent task to inspect code, synthesize patches, or run verified tests.",
                            color = FreedomTextMuted,
                            fontSize = 13.sp
                        )
                        Spacer(Modifier.height(16.dp))
                        Button(
                            onClick = onCreateClick,
                            colors = ButtonDefaults.buttonColors(containerColor = FreedomIndigo)
                        ) {
                            Text("Launch First Task")
                        }
                    }
                }
            }
        } else {
            items(uiState.tasks, key = { it.id }) { task ->
                TaskRowCard(task = task, onClick = { onSelectTask(task.id) })
            }
        }
    }
}

@Composable
fun TelemetryCard(
    title: String,
    value: String,
    subtitle: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .border(1.dp, color.copy(alpha = 0.3f), RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = FreedomSurfaceVariant.copy(alpha = 0.8f)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(title, color = FreedomTextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(Modifier.height(4.dp))
            Text(value, color = color, fontSize = 18.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height(2.dp))
            Text(subtitle, color = FreedomTextSecondary, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
fun TaskRowCard(
    task: TaskItemModel,
    onClick: () -> Unit
) {
    val stateColor = when (task.state) {
        TaskState.COMPLETED -> FreedomGreen
        TaskState.RUNNING, TaskState.PLANNING, TaskState.VERIFYING -> FreedomCyan
        TaskState.WAITING_FOR_APPROVAL -> FreedomAmber
        TaskState.FAILED -> FreedomRose
        TaskState.PENDING, TaskState.CANCELLED -> FreedomTextMuted
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .border(1.dp, FreedomBorder.copy(alpha = 0.5f), RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(containerColor = FreedomSurface),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    task.title,
                    color = FreedomTextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(stateColor.copy(alpha = 0.15f))
                        .border(1.dp, stateColor.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        task.state.label.uppercase(),
                        color = stateColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(Modifier.height(8.dp))
            Text(
                task.prompt,
                color = FreedomTextSecondary,
                fontSize = 13.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Agent: ${task.activeAgent}", color = FreedomIndigoLight, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                Text(task.createdAt, color = FreedomTextMuted, fontSize = 11.sp)
            }
        }
    }
}

@Composable
fun WorkspaceScreen(
    uiState: FreedomUiState,
    onApprove: (String) -> Unit,
    onReject: (String) -> Unit,
    onSelectTask: (String) -> Unit
) {
    val selectedTask = uiState.tasks.find { it.id == uiState.selectedTaskId } ?: uiState.tasks.firstOrNull()

    if (selectedTask == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No task selected", color = FreedomTextSecondary)
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            // Task Header
            Card(
                colors = CardDefaults.cardColors(containerColor = FreedomSurfaceVariant),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(selectedTask.title, color = FreedomTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(selectedTask.prompt, color = FreedomTextSecondary, fontSize = 13.sp)
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("State: ${selectedTask.state.label}", color = FreedomCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text("Assigned: ${selectedTask.assignedModel}", color = FreedomTextMuted, fontSize = 12.sp)
                    }
                }
            }
        }

        // Approval Gate Card
        if (selectedTask.pendingApproval != null && selectedTask.pendingApproval.status == "PENDING") {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = FreedomAmber.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, FreedomAmber.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Warning, contentDescription = "Approval Required", tint = FreedomAmber)
                            Spacer(Modifier.width(8.dp))
                            Text(
                                "HUMAN APPROVAL GATE",
                                color = FreedomAmber,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                letterSpacing = 1.sp
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(selectedTask.pendingApproval.description, color = FreedomTextPrimary, fontSize = 13.sp)
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Command: ${selectedTask.pendingApproval.command}",
                            color = FreedomTextSecondary,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp
                        )
                        Spacer(Modifier.height(14.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { onApprove(selectedTask.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = FreedomGreen),
                                modifier = Modifier.weight(1f).testTag("approve_button")
                            ) {
                                Text("Approve Patch", fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { onReject(selectedTask.id) },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = FreedomRose),
                                modifier = Modifier.weight(1f).testTag("reject_button")
                            ) {
                                Text("Reject")
                            }
                        }
                    }
                }
            }
        }

        // Execution Plan Steps
        item {
            Text("EXECUTION GRAPH", color = FreedomTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        items(selectedTask.planSteps) { step ->
            Card(
                colors = CardDefaults.cardColors(containerColor = FreedomSurface),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = FreedomIndigoLight, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(10.dp))
                    Text(step, color = FreedomTextPrimary, fontSize = 13.sp)
                }
            }
        }

        // Diff Viewer (if available)
        if (selectedTask.diff.isNotBlank()) {
            item {
                Text("SYNTHESIZED UNIFIED DIFF", color = FreedomTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = FreedomSurfaceElevated),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, FreedomBorder, RoundedCornerShape(12.dp))
                ) {
                    Text(
                        selectedTask.diff,
                        color = FreedomGreen,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(14.dp)
                    )
                }
            }
        }

        // Event Stream
        item {
            Text("LIVE TELEMETRY & LOGS", color = FreedomTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        items(selectedTask.events) { event ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "[${event.eventType}] ${event.message}",
                    color = FreedomTextSecondary,
                    fontSize = 12.sp,
                    modifier = Modifier.weight(1f)
                )
                Text(event.timestamp, color = FreedomTextMuted, fontSize = 11.sp)
            }
        }
    }
}

@Composable
fun AgentsScreen(
    agents: List<AgentRole>,
    activeAgentId: String?
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                "AUTONOMOUS AGENT TEAM",
                color = FreedomTextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }

        items(agents, key = { it.id }) { agent ->
            val isActive = agent.id == activeAgentId
            Card(
                colors = CardDefaults.cardColors(containerColor = FreedomSurfaceVariant),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        if (isActive) FreedomIndigoLight else FreedomBorder.copy(alpha = 0.5f),
                        RoundedCornerShape(14.dp)
                    )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(agent.iconEmoji, fontSize = 22.sp)
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(agent.name, color = FreedomTextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text(agent.roleTitle, color = FreedomIndigoLight, fontSize = 12.sp)
                            }
                        }
                        if (isActive) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(FreedomIndigo.copy(alpha = 0.2f))
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text("ACTIVE", color = FreedomIndigoLight, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(Modifier.height(8.dp))
                    Text(agent.description, color = FreedomTextSecondary, fontSize = 12.sp)

                    Spacer(Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        agent.allowedTools.forEach { tool ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(FreedomSurfaceElevated)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(tool, color = FreedomCyan, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SecurityScreen(
    currentPrivacyMode: PrivacyMode,
    currentPolicyProfile: PolicyProfile,
    onSelectPrivacyMode: (PrivacyMode) -> Unit,
    onSelectPolicyProfile: (PolicyProfile) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                "PRIVACY ENGINE (AIR-GAP)",
                color = FreedomTextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }

        items(PrivacyMode.entries) { mode ->
            val selected = mode == currentPrivacyMode
            Card(
                colors = CardDefaults.cardColors(containerColor = if (selected) FreedomSurfaceElevated else FreedomSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelectPrivacyMode(mode) }
                    .border(
                        1.dp,
                        if (selected) FreedomGreen else FreedomBorder.copy(alpha = 0.5f),
                        RoundedCornerShape(12.dp)
                    )
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(mode.displayName, color = if (selected) FreedomGreen else FreedomTextPrimary, fontWeight = FontWeight.Bold)
                        if (selected) {
                            Icon(Icons.Default.Lock, contentDescription = "Active", tint = FreedomGreen, modifier = Modifier.size(16.dp))
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(mode.description, color = FreedomTextSecondary, fontSize = 12.sp)
                }
            }
        }

        item {
            Text(
                "POLICY PROFILES & PERMISSIONS",
                color = FreedomTextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }

        items(PolicyProfile.entries) { profile ->
            val selected = profile == currentPolicyProfile
            Card(
                colors = CardDefaults.cardColors(containerColor = if (selected) FreedomSurfaceElevated else FreedomSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelectPolicyProfile(profile) }
                    .border(
                        1.dp,
                        if (selected) FreedomIndigoLight else FreedomBorder.copy(alpha = 0.5f),
                        RoundedCornerShape(12.dp)
                    )
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(profile.profileName, color = if (selected) FreedomIndigoLight else FreedomTextPrimary, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text(profile.description, color = FreedomTextSecondary, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun CreateTaskDialog(
    onDismiss: () -> Unit,
    onLaunch: (String, String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var prompt by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = FreedomSurface,
        title = {
            Text("Launch Autonomous Task", color = FreedomTextPrimary, fontWeight = FontWeight.Bold)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Task Title (Optional)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = FreedomIndigo,
                        unfocusedBorderColor = FreedomBorder,
                        focusedTextColor = FreedomTextPrimary,
                        unfocusedTextColor = FreedomTextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("task_title_input")
                )
                OutlinedTextField(
                    value = prompt,
                    onValueChange = { prompt = it },
                    label = { Text("Mission Prompt") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = FreedomIndigo,
                        unfocusedBorderColor = FreedomBorder,
                        focusedTextColor = FreedomTextPrimary,
                        unfocusedTextColor = FreedomTextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth().height(120.dp).testTag("task_prompt_input")
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onLaunch(title, prompt) },
                enabled = prompt.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = FreedomIndigo),
                modifier = Modifier.testTag("launch_task_submit")
            ) {
                Text("Dispatch Agents")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = FreedomTextMuted)
            }
        }
    )
}
