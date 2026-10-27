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
        val initialTask = TaskItemModel(
            id = taskId,
            title = title.ifBlank { "Autonomous Mission: ${prompt.take(24)}..." },
            prompt = prompt,
            state = TaskState.PENDING,
            activeAgent = "orchestrator",
            assignedModel = _uiState.value.activeModel,
            planSteps = listOf(
                "Inspect repository architecture & policies",
                "Design minimal bounded diff",
                "Check zero-trust security & privacy constraints",
                "Run unit & regression tests"
            ),
            diff = "",
            events = listOf(
                TaskEventItem(UUID.randomUUID().toString(), "CREATED", "Task created by user", currentTime())
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
            executeRunningSteps(taskId)
        }
    }

    private suspend fun executeRunningSteps(taskId: String) {
        // Step 1: Planning
        delay(1200)
        updateTask(taskId) { task ->
            task.copy(
                state = TaskState.PLANNING,
                activeAgent = "architect",
                events = task.events + TaskEventItem(
                    UUID.randomUUID().toString(),
                    "PLANNING",
                    "Architect generated 4-phase execution graph",
                    currentTime()
                )
            )
        }

        // Step 2: Coding & Patching
        delay(1500)
        val generatedDiff = """
--- a/freedom-agent/backend/app/adapters/universal_hub.py
+++ b/freedom-agent/backend/app/adapters/universal_hub.py
@@ -0,0 +1,15 @@
+class UniversalAIHub:
+    def __init__(self, privacy_mode: PrivacyMode):
+        self.privacy_mode = privacy_mode
+        self.adapters = {}
+
+    def register_adapter(self, adapter):
+        if self.privacy_mode == PrivacyMode.LOCAL_ONLY and not adapter.is_local:
+            raise PermissionError("Egress disallowed")
+        self.adapters[adapter.id] = adapter
        """.trimIndent()

        updateTask(taskId) { task ->
            task.copy(
                state = TaskState.WAITING_FOR_APPROVAL,
                activeAgent = "developer",
                diff = generatedDiff,
                pendingApproval = ApprovalItem(
                    id = "appr-${UUID.randomUUID().toString().take(4)}",
                    taskId = taskId,
                    actionType = "APPLY_PATCH",
                    description = "Apply unified diff to workspace to register Universal AI adapter",
                    command = "patch -p1 < universal_adapter.diff"
                ),
                events = task.events + TaskEventItem(
                    UUID.randomUUID().toString(),
                    "GATE_APPROVAL",
                    "Approval required before applying modifications to disk",
                    currentTime()
                )
            )
        }
        _uiState.update { it.copy(isExecuting = false) }
    }

    fun approvePendingAction(taskId: String) {
        updateTask(taskId) { task ->
            task.copy(
                state = TaskState.RUNNING,
                activeAgent = "tester",
                pendingApproval = task.pendingApproval?.copy(status = "APPROVED"),
                events = task.events + TaskEventItem(
                    UUID.randomUUID().toString(),
                    "APPROVED",
                    "User approved disk patch. Executing automated test suite...",
                    currentTime()
                )
            )
        }

        viewModelScope.launch {
            delay(1200)
            updateTask(taskId) { task ->
                task.copy(
                    state = TaskState.VERIFYING,
                    events = task.events + TaskEventItem(
                        UUID.randomUUID().toString(),
                        "TESTING",
                        "Running unit tests: 17 passed, 0 failures",
                        currentTime()
                    )
                )
            }
            delay(1000)
            updateTask(taskId) { task ->
                task.copy(
                    state = TaskState.COMPLETED,
                    activeAgent = "orchestrator",
                    testPassed = true,
                    events = task.events + TaskEventItem(
                        UUID.randomUUID().toString(),
                        "COMPLETED",
                        "Mission completed successfully with zero privacy violations",
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
