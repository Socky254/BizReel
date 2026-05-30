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
        
        // v14.5: SELECTIVE BYPASS (Split-Tunneling)
        // We tell the VPN to IGNORE common apps so you can use them normally.
        val bypassApps = listOf(
            "com.android.chrome", 
            "com.whatsapp", 
            "com.google.android.youtube",
            "com.facebook.katana",
            "com.instagram.android"
        )
        
        bypassApps.forEach { pkg ->
            try {
                builder.addDisallowedApplication(pkg)
            } catch (e: Exception) {}
        }

        // The rest of the system (including M-KOPA and Knox) 
        // remains trapped in the Sinkhole.
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
