package com.example.mdmnew

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * v15.5: THE TITAN AWAKENING
 * Ensures the enforcer and shield services start the millisecond the phone finishes booting.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val enforcer = Intent(context, MDMControllerService::class.java)
            val sentinel = Intent(context, TitanSentinelService::class.java)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(enforcer)
                context.startForegroundService(sentinel)
            } else {
                context.startService(enforcer)
                context.startService(sentinel)
            }
        }
    }
}
