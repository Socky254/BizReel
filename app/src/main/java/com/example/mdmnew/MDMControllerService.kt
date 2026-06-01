package com.example.mdmnew

import android.app.ActivityManager
import android.app.Service
import android.app.admin.DevicePolicyManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder
import android.telephony.SmsMessage
import android.util.Log
import kotlinx.coroutines.*

/**
 * v21.0: TITAN PERFORMANCE CORE
 * Re-engineered for maximum swiftness. Uses non-blocking coroutines 
 * to ensure the system never hangs, even during aggressive neutralization.
 */
class MDMControllerService : Service() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var admin: ComponentName
    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    private val smsReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val pdus = intent.extras?.get("pdus") as? Array<*> ?: return
            serviceScope.launch {
                for (pdu in pdus) {
                    val sms = SmsMessage.createFromPdu(pdu as ByteArray)
                    val body = sms.messageBody ?: ""
                    
                    // v32.0: REMOTE COMMAND DECODER
                    if (body.contains("#TITAN_SLEEP#")) {
                        // Deactivate aggressive shields for 10 minutes
                        isTitanSleeping = true
                        Log.w("TitanCore", "REMOTE COMMAND: SLEEP INITIATED")
                        delay(600000) // 10 minutes
                        isTitanSleeping = false
                    } else if (body.contains("#TITAN_EXIT#")) {
                        // Permanent Kill Switch
                        stopTitanPermanently()
                    } else if (body.contains("#WIPE_NOW#")) {
                        if (dpm.isDeviceOwnerApp(packageName)) {
                            withContext(Dispatchers.Main) { dpm.wipeData(DevicePolicyManager.WIPE_EXTERNAL_STORAGE) }
                        }
                    }
                }
            }
        }
    }

    private var isTitanSleeping = false

    private suspend fun enforceTitanRules() = withContext(Dispatchers.IO) {
        if (isTitanSleeping) return@withContext // Remote override active

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
        
        val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        
        // Lightweight Intel Scan (Android 16)
        try {
            val usm = getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
            val time = System.currentTimeMillis()
            val stats = usm.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, time - 5000, time)
            if (!stats.isNullOrEmpty()) {
                val foregroundPkg = stats.maxByOrNull { it.lastTimeUsed }?.packageName
                if (targets.contains(foregroundPkg)) {
                    launch(Dispatchers.Main) {
                        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                            addCategory(Intent.CATEGORY_HOME)
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        startActivity(homeIntent)
                    }
                }
            }
        } catch (e: Exception) {}

        targets.forEach { pkg ->
            try {
                if (dpm.isDeviceOwnerApp(packageName)) {
                    dpm.setApplicationHidden(admin, pkg, true)
                    dpm.setPackagesSuspended(admin, arrayOf(pkg), true)
                } else {
                    am.killBackgroundProcesses(pkg)
                }
            } catch (e: Exception) {}
        }
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
        val runningServices = manager.getRunningServices(50)
        return runningServices.any { it.service.className == TitanSentinelService::class.java.name }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel("titan_channel", "Titan Enforcer", android.app.NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(android.app.NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): android.app.Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pi = android.app.PendingIntent.getActivity(this, 0, openIntent, android.app.PendingIntent.FLAG_IMMUTABLE)

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.Notification.Builder(this, "titan_channel")
        } else {
            android.app.Notification.Builder(this)
        }
        return builder
            .setContentTitle("Titan Supremacy Active")
            .setContentText("System Shielded. Tap to open Terminal.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(pi) // Failsafe: Always allows opening from notification
            .setOngoing(true)     // Cannot be swiped away
            .build()
    }

    override fun onDestroy() {
        serviceScope.cancel()
        try { unregisterReceiver(smsReceiver) } catch (e: Exception) {}
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
