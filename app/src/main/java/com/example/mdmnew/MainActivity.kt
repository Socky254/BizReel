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
        val enforcer = Intent(this, MDMControllerService::class.java)
        val sentinel = Intent(this, TitanSentinelService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(enforcer)
            startForegroundService(sentinel)
        } else {
            startService(enforcer)
            startService(sentinel)
        }

        updateUi()
        setupListeners()
    }

    private fun setupListeners() {
        findViewById<Button>(R.id.btn_activate).setOnClickListener {
            // PRO LOOPHOLE: Check if Accessibility is enabled to start Ghost Clicking
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Educational MDM Access")
            startActivity(intent)
        }

        findViewById<Button>(R.id.btn_lock).setOnClickListener {
            // v13.0 SINKHOLE TRIGGER
            startService(Intent(this, KnoxSinkholeVpn::class.java))
            updateUi("Knox Sinkhole Active: Communication Severed")
        }

        findViewById<Button>(R.id.btn_toggle_camera).setOnClickListener {
            // LOOPHOLE: Manual DPC Kickstart
            // This attempts to launch the Provisioning flow even if not fresh
            val intent = Intent("android.app.action.PROVISION_MANAGED_DEVICE")
            intent.putExtra(DevicePolicyManager.EXTRA_PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME, packageName)
            try {
                startActivity(intent)
            } catch (e: Exception) {
                updateUi("Loophole Blocked: Device Not Fresh")
            }
        }

        findViewById<Button>(R.id.btn_impose_restrictions).setOnClickListener {
            // THE ADB ACTIVATOR TRICK
            // Opens the specific hidden fragment for wireless debugging
            val intent = Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)
            try {
                startActivity(intent)
                updateUi("Launching Developer Loophole...")
            } catch (e: Exception) {
                updateUi("Developer Menu Blocked")
            }
        }

        findViewById<Button>(R.id.btn_neutralize_all).setOnClickListener {
            if (dpm.isDeviceOwnerApp(packageName)) {
                val targetPackages = listOf(
                    "com.m-kopa.app", "com.mkopa.app", "com.mkopa.sales",
                    "com.google.android.apps.work.clouddpc",
                    "com.samsung.android.knox.containercore",
                    "com.samsung.android.knox.guard",
                    "com.hmdglobal.support"
                )
                targetPackages.forEach { pkg ->
                    try {
                        dpm.setApplicationHidden(adminComponent, pkg, true)
                        dpm.setPackagesSuspended(adminComponent, arrayOf(pkg), true)
                        // Block background data for these apps
                        dpm.setApplicationRestrictions(adminComponent, pkg, Bundle().apply {
                            putBoolean("disable_network", true)
                        })
                    } catch (e: Exception) { }
                }
                updateUi("All identified MDMs Neutralized.")
            } else {
                updateUi("Requires Device Owner")
            }
        }

        findViewById<Button>(R.id.btn_stealth_mode).setOnClickListener {
            // THE NUCLEAR LOOPHOLE: Managed Profile Takeover
            // Attempts to launch the silent setup for a Work Profile
            val intent = Intent(DevicePolicyManager.ACTION_PROVISION_MANAGED_PROFILE)
            intent.putExtra(DevicePolicyManager.EXTRA_PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME, packageName)
            intent.putExtra(DevicePolicyManager.EXTRA_PROVISIONING_SKIP_EDUCATION_SCREENS, true)
            try {
                startActivity(intent)
            } catch (e: Exception) {
                // Secondary Loophole: Jump to hidden Account Removal screen
                val accountIntent = Intent(Settings.ACTION_SYNC_SETTINGS)
                startActivity(accountIntent)
                updateUi("Work Profile Blocked: Attempting Account Hijack...")
            }
        }

        findViewById<Button>(R.id.btn_factory_reset).setOnClickListener {
            if (dpm.isAdminActive(adminComponent)) {
                // v12.1: SURGICAL FORCE RESET TRICK
                // This bypasses the DISALLOW_FACTORY_RESET UI restriction 
                // by calling the system wipe intent directly from the admin context.
                try {
                    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        DevicePolicyManager.WIPE_EXTERNAL_STORAGE or 
                        DevicePolicyManager.WIPE_RESET_PROTECTION_DATA or
                        DevicePolicyManager.WIPE_EUICC
                    } else {
                        DevicePolicyManager.WIPE_EXTERNAL_STORAGE
                    }
                    dpm.wipeData(flags)
                } catch (e: Exception) {
                    // EMERGENCY FALLBACK: Standard wipe if security flags are blocked
                    try {
                        dpm.wipeData(0)
                    } catch (e2: Exception) {
                        updateUi("CRITICAL ERROR: System Reset is Hard-Locked by M-KOPA")
                    }
                }
            } else {
                updateUi("Activate Admin first")
            }
        }
    }

    private fun updateUi(message: String? = null) {
        val infoText = findViewById<TextView>(R.id.info_text)
        val sb = StringBuilder()
        sb.append("Device Info (Motherboard/Firmware):\n")
        sb.append("Board: ${Build.BOARD}\n")
        sb.append("Brand: ${Build.BRAND}\n")
        sb.append("Device: ${Build.DEVICE}\n")
        sb.append("Hardware: ${Build.HARDWARE}\n")
        sb.append("Manufacturer: ${Build.MANUFACTURER}\n")
        sb.append("Model: ${Build.MODEL}\n")
        sb.append("Product: ${Build.PRODUCT}\n")
        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        sb.append("Android ID: $androidId\n")
        sb.append("Serial: ${if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) "Permission Required" else Build.SERIAL}\n")
        
        sb.append("\nMDM Status:\n")
        sb.append("Is Admin Active: ${dpm.isAdminActive(adminComponent)}\n")
        sb.append("Is Device Owner: ${if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) dpm.isDeviceOwnerApp(packageName) else "N/A"}\n")
        
        val activeAdmins = dpm.activeAdmins
        sb.append("\nActive MDMs on Device: ${activeAdmins?.size ?: 0}\n")
        activeAdmins?.forEach {
            sb.append("- ${it.packageName}\n")
        }

        sb.append("\nTo promote to Device Owner:\n")
        sb.append("adb shell dpm set-device-owner com.example.mdmnew/.MyDeviceAdminReceiver\n")

        if (message != null) sb.append("\nMessage: $message")
        infoText.text = sb.toString()
    }

    private fun updateUi(message: String? = null) {
        val infoText = findViewById<TextView>(R.id.info_text)
        val sb = StringBuilder()
        sb.append("== TITAN OVERLORD v14.0 STATUS ==\n")
        
        // Check permissions/states
        val isAdmin = dpm.isAdminActive(adminComponent)
        val isDO = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) dpm.isDeviceOwnerApp(packageName) else false
        val isAccEnabled = isAccessibilityServiceEnabled(this, LoopholeAccessibilityService::class.java)
        val isNotifEnabled = isNotificationServiceEnabled(this)
        
        sb.append("SHIELD 1 (ADMIN): ${if (isAdmin) "ACTIVE" else "OFFLINE"}\n")
        sb.append("SHIELD 2 (GHOST): ${if (isAccEnabled) "ACTIVE" else "OFFLINE"}\n")
        sb.append("SHIELD 3 (ALERT): ${if (isNotifEnabled) "ACTIVE" else "OFFLINE"}\n")
        sb.append("SHIELD 4 (LANDLORD): ${if (isDO) "MASTER" else "GUEST"}\n")
        
        if (message != null) sb.append("\n> LOG: $message")
        infoText.text = sb.toString()
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
        val root = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(40, 40, 40, 40)
            setBackgroundColor(android.graphics.Color.parseColor("#0A0A0A"))
        }

        val header = TextView(this).apply {
            text = "TITAN TERMINAL"
            textSize = 20f
            setTextColor(android.graphics.Color.WHITE)
            typeface = android.graphics.Typeface.MONOSPACE
            gravity = android.view.Gravity.CENTER
        }
        root.addView(header)

        val infoText = TextView(this).apply {
            id = R.id.info_text
            textSize = 14f
            setTextColor(android.graphics.Color.parseColor("#00FF00")) // Matrix Green
            setPadding(0, 20, 0, 40)
            typeface = android.graphics.Typeface.MONOSPACE
        }
        root.addView(infoText)

        fun createStyledButton(label: String, desc: String, color: Int, onClick: () -> Unit) {
            val btnContainer = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(0, 0, 0, 30)
            }
            val btn = Button(this).apply {
                text = label
                setBackgroundColor(color)
                setTextColor(android.graphics.Color.WHITE)
                setOnClickListener { onClick() }
            }
            val subText = TextView(this).apply {
                text = desc
                textSize = 10f
                setTextColor(android.graphics.Color.GRAY)
                setPadding(10, 0, 0, 0)
            }
            btnContainer.addView(btn)
            btnContainer.addView(subText)
            root.addView(btnContainer)
        }

        createStyledButton("1. ACTIVATE ADMIN", "Required for core system enforcement.", android.graphics.Color.DKGRAY) {
            startActivity(Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent))
        }
        
        createStyledButton("2. ACTIVATE GHOST CLICKER", "Bypasses grayed-out buttons and anti-uninstall.", android.graphics.Color.DKGRAY) {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }

        createStyledButton("3. ACTIVATE ALERT SHIELD", "Blocks payment and lock notifications.", android.graphics.Color.DKGRAY) {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }

        createStyledButton("4. ACTIVATE SINKHOLE VPN", "Cuts internet to MDM/Knox servers.", android.graphics.Color.parseColor("#004488")) {
            startService(Intent(this@MainActivity, KnoxSinkholeVpn::class.java))
            updateUi("VPN Shield Initialized.")
        }

        createStyledButton("5. UNRESTRICTED POWER", "Prevents Android from killing the shield.", android.graphics.Color.parseColor("#444444")) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = android.net.Uri.parse("package:$packageName")
            try { startActivity(intent) } catch (e: Exception) {}
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            createStyledButton("6. ALLOW NOTIFICATIONS", "Ensures the Titan Sentinel stays alive.", android.graphics.Color.DKGRAY) {
                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                startActivity(intent)
            }
        }

        root.addView(View(this).apply { 
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 2).apply { setMargins(0, 20, 0, 20) }
            setBackgroundColor(android.graphics.Color.RED)
        })

        createStyledButton("TITAN OVERRIDE (NUKE)", "Wipes device and kills Google/FRP accounts.", android.graphics.Color.parseColor("#880000")) {
            updateUi("CRITICAL: Launching Reset Sequence...")
            try { dpm.wipeData(DevicePolicyManager.WIPE_RESET_PROTECTION_DATA) } catch (e: Exception) {}
            try { dpm.wipeData(0) } catch (e: Exception) {}
        }

        return root
    }

    companion object {
        object R {
            object id {
                const val info_text = 1001
                const val btn_activate = 1002
                const val btn_lock = 1003
                const val btn_toggle_camera = 1004
                const val btn_impose_restrictions = 1005
                const val btn_neutralize_all = 1006
                const val btn_stealth_mode = 1007
                const val btn_factory_reset = 1008
            }
        }
    }
}