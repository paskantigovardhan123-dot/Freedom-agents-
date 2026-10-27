# Proguard rules for Freedom Agent
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.* <methods>;
}
