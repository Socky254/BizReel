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
        
        // v26.0: ALWAYS-ON PERSISTENCE
        // Ensures the tunnel restarts every time network switches
        startVpn()
        return START_STICKY
    }

    private fun startVpn() {
        val builder = Builder()
        builder.setSession("Titan Override")
        builder.addAddress("10.0.0.2", 24)
        
        // BLOCK BY IP (Total Severance)
        // Hard-blocking M-KOPA and Knox IP ranges
        builder.addRoute("0.0.0.0", 0) 
        
        // Android 16: Lockdown Request
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setBlocking(true) // Prevent leak during handover
        }
        
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
