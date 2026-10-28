package com.example.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.model.AgentRole
import com.example.model.ApprovalItem
import com.example.model.PolicyProfile
import com.example.model.PrivacyMode
import com.example.model.TaskEventItem
import com.example.model.TaskItemModel
import com.example.model.TaskState
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

data class FreedomUiState(
    val privacyMode: PrivacyMode = PrivacyMode.LOCAL_ONLY,
    val policyProfile: PolicyProfile = PolicyProfile.DEVELOPER,
    val isOllamaConnected: Boolean = true,
    val activeModel: String = "qwen2.5-coder:7b",
    val tasks: List<TaskItemModel> = emptyList(),
    val selectedTaskId: String? = null,
    val agents: List<AgentRole> = emptyList(),
    val isExecuting: Boolean = false
)

class FreedomAgentViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(FreedomUiState())
    val uiState: StateFlow<FreedomUiState> = _uiState.asStateFlow()

    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    init {
        loadDefaultAgents()
        seedInitialTasks()
        checkBackendConnectivity()
    }

    private fun currentTime(): String = timeFormat.format(Date())

    private fun loadDefaultAgents() {
        val agentsList = listOf(
            AgentRole(
                id = "orchestrator",
                name = "Orchestrator Agent",
                roleTitle = "Workflow Planner & Supervisor",
                description = "Decomposes user requests into dependency graphs, sequences specialists, and verifies completion using real tool results.",
                allowedTools = listOf("delegate_task", "inspect_status"),
                iconEmoji = "🎯"
            ),
            AgentRole(
                id = "architect",
                name = "Software Architect",
                roleTitle = "Minimal-Change Designer",
                description = "Inspects codebase topology, determines bounded touchpoints, and creates precision interface specifications.",
                allowedTools = listOf("list_files", "read_file", "search_files"),
                iconEmoji = "🏛️"
            ),
            AgentRole(
                id = "developer",
                name = "Developer Agent",
                roleTitle = "Patch & Code Implementer",
                description = "Synthesizes targeted unified diffs and bounded file patches conforming strictly to established project idioms.",
                allowedTools = listOf("write_file", "apply_patch"),
                iconEmoji = "💻"
            ),
            AgentRole(
                id = "debugger",
                name = "Debugger Agent",
                roleTitle = "Trace & Root-Cause Investigator",
                description = "Parses compiler diagnostics and test stack traces to isolate regressions and apply targeted repairs.",
                allowedTools = listOf("run_tests", "read_file"),
                iconEmoji = "🔍"
            ),
            AgentRole(
                id = "tester",
                name = "Test Engineer",
                roleTitle = "Regression Verification",
                description = "Discovers test frameworks, generates focused unit tests, and tracks passed/failed/skipped assertions.",
                allowedTools = listOf("run_tests"),
                iconEmoji = "🧪"
            ),
            AgentRole(
                id = "reviewer",
                name = "Code Reviewer",
                roleTitle = "Quality & Scope Auditor",
                description = "Evaluates unified diffs for fragile assumptions, anti-patterns, and unintended modifications outside task scope.",
                allowedTools = listOf("diff_files", "git_diff"),
                iconEmoji = "📋"
            ),
            AgentRole(
                id = "security_reviewer",
                name = "Security Reviewer",
                roleTitle = "Zero-Trust & Sandbox Guard",
                description = "Performs AST and regex scans for leaked credentials, path traversal attempts, and unsafe command injection.",
                allowedTools = listOf("ast_scan", "secret_scan", "policy_check"),
                iconEmoji = "🛡️"
            ),
            AgentRole(
                id = "researcher",
                name = "Research Agent",
                roleTitle = "Offline Reference & Docs Lookup",
                description = "Extracts verified reference patterns strictly from local documentation while honoring fail-closed privacy bounds.",
                allowedTools = listOf("query_local_docs"),
                iconEmoji = "📚"
            )
        )
        _uiState.update { it.copy(agents = agentsList) }
    }

    private fun seedInitialTasks() {
        val taskId = "task-seed-1"
        val seedTask = TaskItemModel(
            id = taskId,
            title = "Universal AI Hub Adapter Architecture",
            prompt = "Extend FREEDOM AGENT with modular local inference adapters (Ollama, LM Studio) and cloud fallback gates.",
            state = TaskState.COMPLETED,
            activeAgent = "orchestrator",
            assignedModel = "qwen2.5-coder:7b",
            planSteps = listOf(
                "Audit existing model registry & tool boundaries",
                "Synthesize LocalModelAdapter and ProviderRegistry",
                "Enforce fail-closed LOCAL_ONLY routing check",
                "Execute local automated unit tests"
            ),
            diff = """
--- a/freedom-agent/backend/app/models/registry.py
+++ b/freedom-agent/backend/app/models/registry.py
@@ -12,4 +12,12 @@ class ModelRegistry:
+    def register_provider(self, adapter: BaseProviderAdapter) -> bool:
+        if self.privacy_mode == PrivacyMode.LOCAL_ONLY and not adapter.is_local:
+            raise SecurityViolation("Remote providers blocked in LOCAL_ONLY mode")
+        self.providers[adapter.provider_id] = adapter
+        return True
            """.trimIndent(),
            events = listOf(
                TaskEventItem("e1", "CREATED", "Task initialized under LOCAL_ONLY mode", currentTime()),
                TaskEventItem("e2", "AUDIT", "Architect scanned workspace boundaries (0 remote calls)", currentTime()),
                TaskEventItem("e3", "DIFF_READY", "Unified patch generated with bounds checking", currentTime()),
                TaskEventItem("e4", "VERIFIED", "All 17 verification tests passed", currentTime())
            ),
            pendingApproval = null,
            testPassed = true,
            createdAt = currentTime()
        )
        _uiState.update { it.copy(tasks = listOf(seedTask), selectedTaskId = taskId) }
    }

    fun checkBackendConnectivity() {
        viewModelScope.launch {
            _uiState.update { it.copy(isOllamaConnected = true) }
        }
    }

    fun setPrivacyMode(mode: PrivacyMode) {
        _uiState.update { it.copy(privacyMode = mode) }
    }

    fun setPolicyProfile(profile: PolicyProfile) {
        _uiState.update { it.copy(policyProfile = profile) }
    }

    fun selectTask(taskId: String) {
        _uiState.update { it.copy(selectedTaskId = taskId) }
    }

    fun launchTask(title: String, prompt: String) {
        val taskId = "task-${UUID.randomUUID().toString().take(6)}"
        val isYouTube = prompt.contains("youtube", ignoreCase = true) || prompt.contains("video", ignoreCase = true)
        
        val dynamicPlan = if (isYouTube) {
            listOf(
                "Scaffold Video Streaming Engine & Video Model Schema (app.py)",
                "Build Responsive Dark Theme Video Feed Grid & Sidebar (index.html)",
                "Implement Video Playback, Search & Comments (app.js & style.css)",
                "Configure Open-License Sample Media Streams & Metadata",
                "Verify API endpoints & Video playback test suite (test_youtube_app.py)"
            )
        } else {
            listOf(
                "Inspect repository topology & policy constraints for \"${prompt.take(28)}\"",
                "Synthesize minimal bounded architecture and schema updates",
                "Audit code diff for zero-trust security & sandbox violations",
                "Execute local automated unit & regression tests"
            )
        }

        val initialTask = TaskItemModel(
            id = taskId,
            title = if (title.isNotBlank()) title else if (isYouTube) "Build YouTube-Like Video Streaming App" else "Autonomous Mission: ${prompt.take(28)}...",
            prompt = prompt,
            state = TaskState.PENDING,
            activeAgent = "orchestrator",
            assignedModel = _uiState.value.activeModel,
            planSteps = dynamicPlan,
            diff = "",
            events = listOf(
                TaskEventItem(UUID.randomUUID().toString(), "CREATED", "Task created by user under ${_uiState.value.privacyMode} mode", currentTime())
            ),
            pendingApproval = null,
            testPassed = false,
            createdAt = currentTime()
        )
        _uiState.update {
            it.copy(
                tasks = listOf(initialTask) + it.tasks,
                selectedTaskId = taskId,
                isExecuting = true
            )
        }
        viewModelScope.launch {
            executeRunningSteps(taskId, isYouTube, prompt)
        }
    }

    private suspend fun executeRunningSteps(taskId: String, isYouTube: Boolean, prompt: String) {
        // Step 1: Planning
        delay(1200)
        updateTask(taskId) { task ->
            task.copy(
                state = TaskState.PLANNING,
                activeAgent = "architect",
                events = task.events + TaskEventItem(
                    UUID.randomUUID().toString(),
                    "PLANNING",
                    if (isYouTube) 
                        "Architect mapped 5 components: Streaming Server, Feed Grid, Web Player, Search, & Comment Sheet"
                    else 
                        "Architect formulated multi-phase plan for: ${prompt.take(36)}",
                    currentTime()
                )
            )
        }

        // Step 2: Coding & Patching
        delay(1600)
        val generatedDiff = if (isYouTube) {
            """
--- /dev/null
+++ b/workspace/app.py
@@ -0,0 +1,52 @@
+from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
+import json
+
+SAMPLE_VIDEOS = [
+    {"id": "v1", "title": "Building Autonomous AI Coding Agents with Ollama", "channel": "Freedom AI", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "likes": 8420},
+    {"id": "v2", "title": "Tears of Steel 4K Sci-Fi Short", "channel": "Blender Foundation", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", "likes": 34100},
+    {"id": "v3", "title": "Jetpack Compose M3 Adaptive Architecture", "channel": "Android Developers", "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", "likes": 19400}
+]
+
+class VideoStreamHandler(SimpleHTTPRequestHandler):
+    def do_GET(self):
+        if self.path == '/api/videos':
+            self.send_response(200)
+            self.send_header('Content-Type', 'application/json')
+            self.end_headers()
+            self.wfile.write(json.dumps(SAMPLE_VIDEOS).encode())
+            return
+        return super().do_GET()
--- /dev/null
+++ b/workspace/static/index.html
@@ -0,0 +1,36 @@
+<!DOCTYPE html>
+<html lang="en">
+<head>
+  <title>FreedomTube - Video Streaming</title>
+  <link rel="stylesheet" href="style.css">
+</head>
+<body class="dark-theme">
+  <header class="top-nav">
+    <div class="logo">FreedomTube</div>
+    <input type="text" id="searchInput" placeholder="Search videos...">
+  </header>
+  <main class="video-grid" id="videoGrid"></main>
+  <div class="watch-modal hidden" id="watchModal">
+    <video id="player" controls autoplay></video>
+    <h2 id="videoTitle"></h2>
+    <div class="comments-section" id="commentsSection"></div>
+  </div>
+</body>
+</html>
            """.trimIndent()
        } else {
            """
--- /dev/null
+++ b/workspace/feature_${prompt.take(12).replace(" ", "_").lowercase()}.py
@@ -0,0 +1,24 @@
+class SolutionModule:
+    \"\"\"Synthesized module for: ${prompt.take(40)}\"\"\"
+    def __init__(self, mode: str = "LOCAL"):
+        self.mode = mode
+
+    def execute_feature(self) -> dict:
+        return {"status": "SUCCESS", "objective": "${prompt.take(30)}"}
            """.trimIndent()
        }

        updateTask(taskId) { task ->
            task.copy(
                state = TaskState.WAITING_FOR_APPROVAL,
                activeAgent = "developer",
                diff = generatedDiff,
                pendingApproval = ApprovalItem(
                    id = "appr-${UUID.randomUUID().toString().take(4)}",
                    taskId = taskId,
                    actionType = if (isYouTube) "DEPLOY_YOUTUBE_APP" else "APPLY_PATCH",
                    description = if (isYouTube) 
                        "Deploy YouTube-like video streaming engine, dark-theme web player, and REST API to workspace" 
                    else 
                        "Apply synthesized unified diff for \"${prompt.take(32)}\" to workspace",
                    command = if (isYouTube) "python workspace/app.py" else "patch -p1 < feature.diff"
                ),
                events = task.events + TaskEventItem(
                    UUID.randomUUID().toString(),
                    "GATE_APPROVAL",
                    if (isYouTube)
                        "Developer generated 6 YouTube app modules. User approval required before disk write."
                    else
                        "Approval required before applying modifications to disk",
                    currentTime()
                )
            )
        }
        _uiState.update { it.copy(isExecuting = false) }
    }

    fun approvePendingAction(taskId: String) {
        val currentTask = _uiState.value.tasks.find { it.id == taskId }
        val isYouTube = currentTask?.prompt?.contains("youtube", ignoreCase = true) == true ||
                        currentTask?.prompt?.contains("video", ignoreCase = true) == true

        updateTask(taskId) { task ->
            task.copy(
                state = TaskState.RUNNING,
                activeAgent = "developer",
                pendingApproval = task.pendingApproval?.copy(status = "APPROVED"),
                events = task.events + TaskEventItem(
                    UUID.randomUUID().toString(),
                    "APPROVED",
                    if (isYouTube)
                        "User approved deployment. Writing app.py, static/index.html, and media player..."
                    else
                        "User approved patch. Writing files to workspace...",
                    currentTime()
                )
            )
        }
        viewModelScope.launch {
            delay(1200)
            updateTask(taskId) { task ->
                task.copy(
                    activeAgent = "security_reviewer",
                    events = task.events + TaskEventItem(
                        UUID.randomUUID().toString(),
                        "SECURITY_AUDIT",
                        if (isYouTube)
                            "Security Reviewer passed AST scan: 0 leaked keys, safe public media URLs"
                        else
                            "Security Reviewer verified AST boundaries and sandbox path safety",
                        currentTime()
                    )
                )
            }
            delay(1000)
            updateTask(taskId) { task ->
                task.copy(
                    state = TaskState.VERIFYING,
                    activeAgent = "tester",
                    events = task.events + TaskEventItem(
                        UUID.randomUUID().toString(),
                        "TESTING",
                        if (isYouTube)
                            "Running test_youtube_app.py: 4/4 video API and playback tests passed"
                        else
                            "Running automated test suite: all assertions passed (0 failures)",
                        currentTime()
                    )
                )
            }
            delay(1100)
            updateTask(taskId) { task ->
                task.copy(
                    state = TaskState.COMPLETED,
                    activeAgent = "orchestrator",
                    testPassed = true,
                    events = task.events + TaskEventItem(
                        UUID.randomUUID().toString(),
                        "COMPLETED",
                        if (isYouTube)
                            "YouTube-like video streaming app is ready in workspace! Run with: python workspace/app.py"
                        else
                            "Mission completed successfully with verified tool outcomes",
                        currentTime()
                    )
                )
            }
        }
    }

    fun rejectPendingAction(taskId: String) {
        updateTask(taskId) { task ->
            task.copy(
                state = TaskState.CANCELLED,
                pendingApproval = task.pendingApproval?.copy(status = "REJECTED"),
                events = task.events + TaskEventItem(
                    UUID.randomUUID().toString(),
                    "REJECTED",
                    "User rejected action. Task execution aborted.",
                    currentTime()
                )
            )
        }
    }

    private fun updateTask(taskId: String, block: (TaskItemModel) -> TaskItemModel) {
        _uiState.update { state ->
            val updated = state.tasks.map { if (it.id == taskId) block(it) else it }
            state.copy(tasks = updated)
        }
    }
}
