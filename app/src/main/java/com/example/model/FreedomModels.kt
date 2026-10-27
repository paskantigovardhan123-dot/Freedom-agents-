package com.example.model

data class AgentRole(
    val id: String,
    val name: String,
    val roleTitle: String,
    val description: String,
    val allowedTools: List<String>,
    val iconEmoji: String
)

enum class PrivacyMode(val displayName: String, val description: String) {
    LOCAL_ONLY(
        "Local Only",
        "Air-gapped; all prompts route to local Ollama on 127.0.0.1. Network egress blocked."
    ),
    PRIVATE_HYBRID(
        "Private Hybrid",
        "Local models prioritized; explicit prompt consent required before remote transmission."
    ),
    HOSTED(
        "Hosted Providers",
        "Connects to authorized hosted endpoints with automatic secret redaction."
    )
}

enum class PolicyProfile(val profileName: String, val description: String) {
    DEVELOPER(
        "Developer",
        "Balanced local workflow with standard workspace permissions; isolated test runner; approvals for risky commands."
    ),
    RESEARCH(
        "Research",
        "Documentation inspection, architecture planning, and safe exploration."
    ),
    LOCAL_EXPERIMENTATION(
        "Local Experimentation",
        "Fast local iterations with extended retry budget."
    )
}

enum class TaskState(val label: String) {
    PENDING("Queued"),
    PLANNING("Planning"),
    WAITING_FOR_APPROVAL("Approval Required"),
    RUNNING("Executing"),
    VERIFYING("Verifying Tests"),
    COMPLETED("Completed"),
    FAILED("Failed"),
    CANCELLED("Cancelled")
}

data class TaskEventItem(
    val id: String,
    val eventType: String,
    val message: String,
    val timestamp: String
)

data class ApprovalItem(
    val id: String,
    val taskId: String,
    val actionType: String,
    val description: String,
    val command: String,
    val status: String = "PENDING"
)

data class TaskItemModel(
    val id: String,
    val title: String,
    val prompt: String,
    val state: TaskState,
    val activeAgent: String,
    val assignedModel: String,
    val planSteps: List<String> = emptyList(),
    val diff: String = "",
    val events: List<TaskEventItem> = emptyList(),
    val pendingApproval: ApprovalItem? = null,
    val testPassed: Boolean = false,
    val createdAt: String
)
