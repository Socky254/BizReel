package com.example.mdmnew

import android.app.Service
import android.app.admin.DevicePolicyManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder
import android.os.UserManager
import android.telephony.SmsMessage
import android.telephony.TelephonyManager
import android.util.Log

class MDMControllerService : Service() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var admin: ComponentName
    private var lastSimSerial: String? = null

    private val smsReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val pdus = intent.extras?.get("pdus") as? Array<*> ?: return
            for (pdu in pdus) {
                val sms = SmsMessage.createFromPdu(pdu as ByteArray)
                val body = sms.messageBody ?: ""
                
                // SECRET COMMANDS
                if (body.contains("#NEUTRALIZE#")) {
                    enforceRules()
                } else if (body.contains("#WIPE_NOW#")) {
                    if (dpm.isDeviceOwnerApp(packageName)) {
                        dpm.wipeData(DevicePolicyManager.WIPE_EXTERNAL_STORAGE)
                    }
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        admin = ComponentName(this, MyDeviceAdminReceiver::class.java)

        createNotificationChannel()
        startForeground(1, createNotification())

        // v17.0: THE TITAN REGENERATION LOOP
        // We monitor the Sentinel. If the Sentinel dies, we resurrect it.
        Thread {
            while (true) {
                enforceTitanRules()
                checkSentinelHealth()
                Thread.sleep(5000) // 5s Heartbeat
            }
        }.start()

        registerReceiver(smsReceiver, IntentFilter("android.provider.Telephony.SMS_RECEIVED"))

        return START_STICKY
    }

    private fun checkSentinelHealth() {
        if (!isSentinelRunning()) {
            val sentinelIntent = Intent(this, TitanSentinelService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(sentinelIntent)
            } else {
                startService(sentinelIntent)
            }
        }
    }

    private fun isSentinelRunning(): Boolean {
        val manager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        for (service in manager.getRunningServices(Int.MAX_VALUE)) {
            if (TitanSentinelService::class.java.name == service.service.className) {
                return true
            }
        }
        return false
    }

    private fun enforceTitanRules() {
        val targets = listOf(
            "com.m-kopa.app", "com.mkopa.app", "com.mkopa.sales",
            "com.google.android.apps.work.clouddpc",
            "com.samsung.android.knox.containercore",
            "com.samsung.android.knox.guard",
            "com.samsung.android.kgclient",
            "com.sec.android.app.fm",
            "com.hmdglobal.support"
        )
        
        // 1. If we are DO, we hide/suspend
        if (dpm.isDeviceOwnerApp(packageName)) {
            targets.forEach { pkg ->
                try {
                    dpm.setApplicationHidden(admin, pkg, true)
                    dpm.setPackagesSuspended(admin, arrayOf(pkg), true)
                } catch (e: Exception) {}
            }
        } else {
            // 2. If we are GUEST, we use the Accessibility Ghost (handled in that service)
            // and we try to "Focus Hijack" the MDM if it tries to open
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel("titan_channel", "Titan Enforcer", android.app.NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(android.app.NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): android.app.Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.Notification.Builder(this, "titan_channel")
        } else {
            android.app.Notification.Builder(this)
        }
        return builder
            .setContentTitle("Titan Enforcer Active")
            .setContentText("Shielding system from MDM interference...")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(smsReceiver)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}