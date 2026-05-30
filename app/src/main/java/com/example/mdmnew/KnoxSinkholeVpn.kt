package com.example.mdmnew

import android.net.VpnService
import android.os.ParcelFileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetAddress

/**
 * v13.0: OMEGA SINKHOLE
 * This service creates a local VPN that intercepts and kills all traffic 
 * directed towards Samsung Knox and M-KOPA servers. 
 * Even if the phone is NOT Device Owner, this will stop the lock command from arriving.
 */
class KnoxSinkholeVpn : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null

    override fun onStartCommand(intent: android.content.Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "STOP") {
            stopVpn()
            return START_NOT_STICKY
        }
        
        startVpn()
        return START_STICKY
    }

    private fun startVpn() {
        val builder = Builder()
        builder.setSession("Titan Override")
        builder.addAddress("10.0.0.2", 24)
        
        // v15.0: SURGICAL BLACKLIST (Precision Targeting)
        // Instead of Whitelisting apps we want to save, we BLACKLIST only the targets.
        // This means the VPN will ONLY touch traffic from these specific apps.
        // Every other app (Chrome, WhatsApp, Bank apps, etc.) will work 100% normally.
        val targetApps = listOf(
            "com.m-kopa.app", "com.mkopa.app", "com.mkopa.sales",
            "com.samsung.android.knox.guard", "com.samsung.android.kgclient",
            "com.samsung.android.knox.containercore", "com.sec.android.app.fm",
            "com.google.android.apps.work.clouddpc", "com.hmdglobal.support",
            "com.payjoy.access", "com.dcontrol.mdm", "com.samsung.android.mdm"
        )
        
        targetApps.forEach { pkg ->
            try {
                // Only capture traffic from these malicious apps
                builder.addAllowedApplication(pkg)
            } catch (e: Exception) {}
        }

        // Send all traffic from the allowed apps into our Black Hole
        builder.addRoute("0.0.0.0", 0) 
        
        try {
            vpnInterface = builder.establish()
        } catch (e: Exception) {}
    }

    private fun stopVpn() {
        vpnInterface?.close()
        vpnInterface = null
        stopSelf()
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }
}
