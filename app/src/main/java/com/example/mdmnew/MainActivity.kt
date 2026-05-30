package com.example.mdmnew

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

/**
 * v24.0: TITAN SUPREMACY - FINAL SURGICAL SUITE
 * Optimized for Android 16. Fixed bracing and compilation errors.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComponent: ComponentName
    private lateinit var infoText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(createLayout())

        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, MyDeviceAdminReceiver::class.java)

        startTitanShields()
        refreshStatus()
    }

    private fun startTitanShields() {
        val enforcer = Intent(this, MDMControllerService::class.java)
        val sentinel = Intent(this, TitanSentinelService::class.java)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(enforcer)
                startForegroundService(sentinel)
            } else {
                startService(enforcer)
                startService(sentinel)
            }
        } catch (e: Exception) {}
    }

    private fun refreshStatus(log: String? = null) {
        val sb = StringBuilder()
        sb.append("== TITAN SUPREMACY v24.0 ==\n")
        
        val isAdminActive = dpm.isAdminActive(adminComponent)
        val isDO = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) dpm.isDeviceOwnerApp(packageName) else false
        val isAcc = isServiceEnabled(LoopholeAccessibilityService::class.java)
        val isNotif = isNotifServiceEnabled()
        val hasUsage = hasUsageStatsPermission(this)
        
        sb.append("SHIELD 1 (ADMIN):  ${status(isAdminActive)}\n")
        sb.append("SHIELD 2 (GHOST):  ${status(isAcc)}\n")
        sb.append("SHIELD 3 (ALERTS): ${status(isNotif)}\n")
        sb.append("SHIELD 4 (INTEL):  ${status(hasUsage)}\n")
        sb.append("POWER LEVEL: ${if (isDO) "MASTER" else "GUEST"}\n")
        
        if (log != null) sb.append("\n> $log")
        infoText.text = sb.toString()
    }

    private fun status(active: Boolean) = if (active) "ONLINE" else "OFFLINE"

    private fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
        } else {
            appOps.checkOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
        }
        return mode == android.app.AppOpsManager.MODE_ALLOWED
    }

    private fun isServiceEnabled(service: Class<*>): Boolean {
        val expected = ComponentName(this, service).flattenToString()
        val setting = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        return setting?.contains(expected) == true
    }

    private fun isNotifServiceEnabled(): Boolean {
        val setting = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        return setting?.contains(packageName) == true
    }

    private fun createLayout(): View {
        val scroller = ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#050505"))
            isFillViewport = true
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 60, 50, 50)
        }

        val header = TextView(this).apply {
            text = "TITAN OVERLORD"
            textSize = 24f
            setTextColor(Color.WHITE)
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 40)
        }
        container.addView(header)

        infoText = TextView(this).apply {
            textSize = 14f
            setTextColor(Color.parseColor("#00FF00"))
            typeface = Typeface.MONOSPACE
            setPadding(20, 20, 20, 40)
            setBackgroundColor(Color.parseColor("#111111"))
        }
        container.addView(infoText)

        fun addButton(label: String, desc: String, color: String, onClick: () -> Unit) {
            val v = LinearLayout(this).apply { 
                orientation = LinearLayout.VERTICAL
                setPadding(0, 0, 0, 40)
            }
            val b = Button(this).apply {
                text = label
                setTextColor(Color.WHITE)
                setBackgroundColor(Color.parseColor(color))
                setOnClickListener { onClick(); refreshStatus() }
            }
            val t = TextView(this).apply {
                text = desc
                textSize = 10f
                setTextColor(Color.GRAY)
                setPadding(10, 5, 0, 0)
            }
            v.addView(b)
            v.addView(t)
            container.addView(v)
        }

        addButton("1. CORE ADMIN", "Unlocks system-level enforcement.", "#333333") {
            startActivity(Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent))
        }

        addButton("2. GHOST MODE", "Bypasses grayed-out buttons.", "#333333") {
            if (dpm.isAdminActive(adminComponent)) startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            else refreshStatus("Must Activate Shield 1 First")
        }

        addButton("3. ALERT SHIELD", "Blocks all MDM popups/alerts.", "#333333") {
            if (dpm.isAdminActive(adminComponent)) startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            else refreshStatus("Must Activate Shield 1 First")
        }

        addButton("4. SINKHOLE VPN", "Severs server links permanently.", "#0055AA") {
            startService(Intent(this, KnoxSinkholeVpn::class.java))
        }

        addButton("5. INFINITE POWER", "Prevents system from killing app.", "#444444") {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = android.net.Uri.parse("package:$packageName")
            try { startActivity(intent) } catch (e: Exception) {}
        }

        addButton("6. INTEL SCAN", "Detects MDM apps opening.", "#444400") {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }

        addButton("7. RESTORE ICON", "Brings back terminal to home screen.", "#222222") {
            packageManager.setComponentEnabledSetting(
                ComponentName(this, MainActivity::class.java),
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            refreshStatus("Terminal Icon Restored.")
        }

        addButton("8. GO STEALTH", "Hides terminal from home screen.", "#111111") {
            packageManager.setComponentEnabledSetting(
                ComponentName(this, MainActivity::class.java),
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )
            refreshStatus("Icon Hidden. Tap notification to return.")
        }

        val sep = View(this).apply { 
            layoutParams = LinearLayout.LayoutParams(-1, 2).apply { setMargins(0, 20, 0, 40) }
            setBackgroundColor(Color.RED)
        }
        container.addView(sep)

        addButton("TITAN OVERRIDE", "FRP-Killing Master Wipe Sequence.", "#AA0000") {
            try { dpm.wipeData(DevicePolicyManager.WIPE_RESET_PROTECTION_DATA) } catch (e: Exception) {}
            try { dpm.wipeData(0) } catch (e: Exception) {}
        }

        scroller.addView(container)
        return scroller
    }
}
