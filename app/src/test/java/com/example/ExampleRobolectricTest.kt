package com.example

import com.example.model.PolicyProfile
import com.example.model.PrivacyMode
import com.example.model.TaskState
import com.example.ui.FreedomAgentViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@OptIn(ExperimentalCoroutinesApi::class)
class ExampleRobolectricTest {

    @Test
    fun testInitialUiState() = runTest {
        val viewModel = FreedomAgentViewModel()
        val state = viewModel.uiState.value

        assertEquals(PrivacyMode.LOCAL_ONLY, state.privacyMode)
        assertEquals(PolicyProfile.DEVELOPER, state.policyProfile)
        assertTrue(state.isOllamaConnected)
        assertEquals(8, state.agents.size)
        assertTrue(state.tasks.isNotEmpty())
    }

    @Test
    fun testPrivacyModeChange() = runTest {
        val viewModel = FreedomAgentViewModel()
        viewModel.setPrivacyMode(PrivacyMode.PRIVATE_HYBRID)
        assertEquals(PrivacyMode.PRIVATE_HYBRID, viewModel.uiState.value.privacyMode)
    }

    @Test
    fun testLaunchTaskFlow() = runTest {
        val viewModel = FreedomAgentViewModel()
        val initialCount = viewModel.uiState.value.tasks.size
        viewModel.launchTask("Test Mission", "Inspect zero-egress policies")

        val state = viewModel.uiState.value
        assertEquals(initialCount + 1, state.tasks.size)
        val launchedTask = state.tasks.first()
        assertEquals("Test Mission", launchedTask.title)
        assertEquals(TaskState.PENDING, launchedTask.state)
    }
}
