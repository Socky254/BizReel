package com.example.mdmnew

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.Toast

class MyDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Toast.makeText(context, "System Controller: Active", Toast.LENGTH_SHORT).show()
        
        // Auto-Neutralize on Enable
        neutralizeCompetitors(context)
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        // This is called when 'adb shell dpm set-device-owner' finishes
        neutralizeCompetitors(context)
    }

    private fun neutralizeCompetitors(context: Context) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(context, MyDeviceAdminReceiver::class.java)
        
        if (dpm.isDeviceOwnerApp(context.packageName)) {
            val targets = listOf(
                "com.m-kopa.app",
                "com.mkopa.app",
                "com.mkopa.sales",
                "com.google.android.apps.work.clouddpc",
                "com.hmdglobal.support",
                "com.samsung.android.knox.guard",
                "com.samsung.android.knox.containercore",
                "com.sec.android.app.fm", // Knox enrollment
                "com.samsung.android.kgclient" // Knox Guard Client
            )
            targets.forEach { pkg ->
                try {
                    // 1. Hide the app (Stops UI and Services)
                    dpm.setApplicationHidden(admin, pkg, true)
                    
                    // 2. Suspend the package
                    dpm.setPackagesSuspended(admin, arrayOf(pkg), true)
                    
                    // 3. Block all permissions
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        dpm.setPermissionPolicy(admin, DevicePolicyManager.PERMISSION_POLICY_PROMPT)
                    }

                    // 4. Block background data (via restrictions)
                    dpm.setApplicationRestrictions(admin, pkg, android.os.Bundle().apply {
                        putBoolean("disable_network", true)
                        putBoolean("block_sync", true)
                    })
                } catch (e: Exception) {}
            }
        }
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Toast.makeText(context, "Device Admin: Disabled", Toast.LENGTH_SHORT).show()
    }
}