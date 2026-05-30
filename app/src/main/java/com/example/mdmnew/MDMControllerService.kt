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

        // v20.0: THE TITAN OVERLORD IMMORTALITY LOOP
        Thread {
            while (true) {
                enforceTitanRules()
                checkSentinelHealth()
                scheduleRegenerationAlarm()
                Thread.sleep(2000) // Hyper-aggressive 2s heartbeat
            }
        }.start()

        registerReceiver(smsReceiver, IntentFilter("android.provider.Telephony.SMS_RECEIVED"))
        return START_STICKY
    }

    private fun scheduleRegenerationAlarm() {
        val am = getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        val intent = Intent(this, BootReceiver::class.java).apply { action = Intent.ACTION_BOOT_COMPLETED }
        val pi = android.app.PendingIntent.getBroadcast(this, 0, intent, android.app.PendingIntent.FLAG_IMMUTABLE)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 60000, pi)
        }
    }

    private fun enforceTitanRules() {
        val targets = listOf(
            "com.m-kopa.app", "com.mkopa.app", "com.mkopa.sales",
            "com.google.android.apps.work.clouddpc",
            "com.samsung.android.knox.containercore",
            "com.samsung.android.knox.guard",
            "com.samsung.android.kgclient",
            "com.sec.android.app.fm",
            "com.hmdglobal.support",
            "com.payjoy.access",
            "com.dcontrol.mdm"
        )
        
        val am = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        
        // Android 16: INTEL SCAN (Foreground Hijack)
        try {
            val usm = getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
            val time = System.currentTimeMillis()
            val stats = usm.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, time - 1000*10, time)
            if (stats != null && stats.isNotEmpty()) {
                val sortedStats = stats.sortedByDescending { it.lastTimeUsed }
                val foregroundPkg = sortedStats[0].packageName
                if (targets.contains(foregroundPkg)) {
                    // HIJACK: Kick them to Home or open Terminal
                    val homeIntent = Intent(Intent.ACTION_MAIN)
                    homeIntent.addCategory(Intent.CATEGORY_HOME)
                    homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    startActivity(homeIntent)
                }
            }
        } catch (e: Exception) {}

        targets.forEach { pkg ->
            try {
                if (dpm.isDeviceOwnerApp(packageName)) {
                    // MASTER MODE: HIDE/SUSPEND/RESTRICT
                    dpm.setApplicationHidden(admin, pkg, true)
                    dpm.setPackagesSuspended(admin, arrayOf(pkg), true)
                    dpm.setApplicationRestrictions(admin, pkg, android.os.Bundle().apply {
                        putBoolean("disable_network", true)
                    })
                } else {
                    // GUEST MODE: FORCE CLOSE & USAGE INTERRUPT
                    am.killBackgroundProcesses(pkg)
                }
            } catch (e: Exception) {}
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