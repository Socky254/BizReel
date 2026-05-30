package com.example.mdmnew

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.content.pm.PackageManager
import android.app.admin.DeviceAdminReceiver
import android.os.Build
import android.os.Bundle
import android.os.UserManager
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComponent: ComponentName

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(createLayout())

        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, MyDeviceAdminReceiver::class.java)

        // Start the TITAN REGENERATION STACK
        startTitanShields()
        updateUi()
    }

    private fun startTitanShields() {
        val enforcer = Intent(this, MDMControllerService::class.java)
        val sentinel = Intent(this, TitanSentinelService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(enforcer)
            startForegroundService(sentinel)
        } else {
            startService(enforcer)
            startService(sentinel)
        }
    }

    private fun updateUi(message: String? = null) {
        val infoText = findViewById<TextView>(R.id.info_text)
        val sb = StringBuilder()
        sb.append("== TITAN SUPREMACY v20.0 STATUS ==\n")
        
        val isAdmin = dpm.isAdminActive(adminComponent)
        val isDO = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) dpm.isDeviceOwnerApp(packageName) else false
        val isAccEnabled = isAccessibilityServiceEnabled(this, LoopholeAccessibilityService::class.java)
        val isNotifEnabled = isNotificationServiceEnabled(this)
        val hasUsage = hasUsageStatsPermission(this)
        
        sb.append("SHIELD 1 (ADMIN): ${if (isAdmin) "ACTIVE" else "OFFLINE"}\n")
        sb.append("SHIELD 2 (GHOST): ${if (isAccEnabled) "ACTIVE" else "OFFLINE"}\n")
        sb.append("SHIELD 3 (ALERT): ${if (isNotifEnabled) "ACTIVE" else "OFFLINE"}\n")
        sb.append("SHIELD 4 (INTEL): ${if (hasUsage) "ACTIVE" else "OFFLINE"}\n")
        sb.append("SYSTEM STATUS: ${if (isDO) "MASTER" else "GUEST"}\n")
        
        if (message != null) sb.append("\n> LOG: $message")
        infoText.text = sb.toString()
    }

    private fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
        } else {
            appOps.checkOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
        }
        return mode == android.app.AppOpsManager.MODE_ALLOWED
    }

    private fun isAccessibilityServiceEnabled(context: Context, service: Class<out android.accessibilityservice.AccessibilityService>): Boolean {
        val expectedComponentName = ComponentName(context, service)
        val enabledServices = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
        return enabledServices.contains(expectedComponentName.flattenToString())
    }

    private fun isNotificationServiceEnabled(context: Context): Boolean {
        val packageNames = android.provider.Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
        return packageNames?.contains(context.packageName) == true
    }

    private fun createLayout(): android.view.View {
        val root = android.widget.ScrollView(this).apply {
            addView(LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(40, 40, 40, 40)
                setBackgroundColor(android.graphics.Color.parseColor("#0A0A0A"))
                
                val header = TextView(this@MainActivity).apply {
                    text = "TITAN TERMINAL"
                    textSize = 20f
                    setTextColor(android.graphics.Color.WHITE)
                    typeface = android.graphics.Typeface.MONOSPACE
                    gravity = android.view.Gravity.CENTER
                }
                addView(header)

                val infoText = TextView(this@MainActivity).apply {
                    id = R.id.info_text
                    textSize = 14f
                    setTextColor(android.graphics.Color.parseColor("#00FF00"))
                    setPadding(0, 20, 0, 40)
                    typeface = android.graphics.Typeface.MONOSPACE
                }
                addView(infoText)

                fun createStyledButton(label: String, desc: String, color: Int, onClick: () -> Unit) {
                    val btnContainer = LinearLayout(this@MainActivity).apply {
                        orientation = LinearLayout.VERTICAL
                        setPadding(0, 0, 0, 30)
                    }
                    val btn = Button(this@MainActivity).apply {
                        text = label
                        setBackgroundColor(color)
                        setTextColor(android.graphics.Color.WHITE)
                        setOnClickListener { onClick() }
                    }
                    val subText = TextView(this@MainActivity).apply {
                        text = desc
                        textSize = 10f
                        setTextColor(android.graphics.Color.GRAY)
                        setPadding(10, 0, 0, 0)
                    }
                    btnContainer.addView(btn)
                    btnContainer.addView(subText)
                    addView(btnContainer)
                }

                createStyledButton("1. ACTIVATE ADMIN", "Core system enforcement keys.", android.graphics.Color.DKGRAY) {
                    startActivity(Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent))
                }
                
                createStyledButton("2. ACTIVATE GHOST", "Bypasses grayed-out UI blocks.", android.graphics.Color.DKGRAY) {
                    startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                }

                createStyledButton("3. ACTIVATE ALERTS", "Dismisses MDM/Payment warnings.", android.graphics.Color.DKGRAY) {
                    startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                }

                createStyledButton("4. START SINKHOLE", "Severs MDM internet connectivity.", android.graphics.Color.parseColor("#004488")) {
                    startService(Intent(this@MainActivity, KnoxSinkholeVpn::class.java))
                }

                createStyledButton("5. UNRESTRICTED POWER", "Ignores system power management.", android.graphics.Color.parseColor("#444444")) {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                    intent.data = android.net.Uri.parse("package:$packageName")
                    try { startActivity(intent) } catch (e: Exception) {}
                }

                createStyledButton("6. ENABLE INTEL SCAN", "Detects MDM apps opening (v20.0).", android.graphics.Color.parseColor("#444400")) {
                    startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                }

                createStyledButton("7. HIDE TERMINAL", "Removes icon from launcher.", android.graphics.Color.parseColor("#222222")) {
                    packageManager.setComponentEnabledSetting(
                        ComponentName(this@MainActivity, MainActivity::class.java),
                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                        PackageManager.DONT_KILL_APP
                    )
                    updateUi("Terminal hidden. Reopen via Settings.")
                }

                addView(View(this@MainActivity).apply { 
                    layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 2).apply { setMargins(0, 20, 0, 20) }
                    setBackgroundColor(android.graphics.Color.RED)
                })

                createStyledButton("TITAN OVERRIDE", "FRP-Killing Master Wipe.", android.graphics.Color.parseColor("#880000")) {
                    try { dpm.wipeData(DevicePolicyManager.WIPE_RESET_PROTECTION_DATA) } catch (e: Exception) {}
                    try { dpm.wipeData(0) } catch (e: Exception) {}
                }
            })
        }
        return root
    }

    companion object {
        object R {
            object id {
                const val info_text = 1001
            }
        }
    }
}
