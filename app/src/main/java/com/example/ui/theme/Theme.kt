package com.example.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val FreedomColorScheme: ColorScheme = darkColorScheme(
    primary = FreedomIndigo,
    onPrimary = Color.White,
    primaryContainer = FreedomIndigoDark,
    onPrimaryContainer = Color.White,
    secondary = FreedomCyan,
    onSecondary = Color.Black,
    secondaryContainer = FreedomSurfaceVariant,
    onSecondaryContainer = FreedomTextPrimary,
    tertiary = FreedomGreen,
    onTertiary = Color.Black,
    background = FreedomBackground,
    onBackground = FreedomTextPrimary,
    surface = FreedomSurface,
    onSurface = FreedomTextPrimary,
    surfaceVariant = FreedomSurfaceVariant,
    onSurfaceVariant = FreedomTextSecondary,
    outline = FreedomBorder
)

@Composable
fun MyApplicationTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = FreedomColorScheme,
        typography = Typography,
        content = content
    )
}
