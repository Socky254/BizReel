package com.example.mdmnew

import android.app.ActivityManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log

/**
 * v17.0: THE TITAN SENTINEL
 * This service runs in a separate process (:sentinel).
 * Its only job is to monitor the main MDMControllerService.
 * If the main enforcer is killed, this sentinel resurrects it immediately.
 */
class TitanSentinelService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(2, createSentinelNotification())

        Thread {
            while (true) {
                if (!isMainServiceRunning()) {
                    Log.w("TitanSentinel", "CRITICAL: Enforcer is dead. Resurrecting...")
                    val mainIntent = Intent(this, MDMControllerService::class.java)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(mainIntent)
                    } else {
                        startService(mainIntent)
                    }
                }
                Thread.sleep(5000) // Heartbeat check every 5s
            }
        }.start()

        return START_STICKY
    }

    private fun isMainServiceRunning(): Boolean {
        val manager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        for (service in manager.getRunningServices(Int.MAX_VALUE)) {
            if (MDMControllerService::class.java.name == service.service.className) {
                return true
            }
        }
        return false
    }

    private fun createSentinelNotification(): android.app.Notification {
        val channelId = "sentinel_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(channelId, "Titan Sentinel", android.app.NotificationManager.IMPORTANCE_MIN)
            getSystemService(android.app.NotificationManager::class.java).createNotificationChannel(channel)
        }
        
        return (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.Notification.Builder(this, channelId)
        } else {
            android.app.Notification.Builder(this)
        })
        .setContentTitle("Titan Shield Active")
        .setContentText("Regeneration protocols standing by...")
        .setSmallIcon(android.R.drawable.ic_lock_power_off)
        .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
