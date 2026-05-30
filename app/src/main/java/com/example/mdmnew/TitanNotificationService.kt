package com.example.mdmnew

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * v14.0: TITAN ALERT SHIELD
 * This service intercepts and dismisses notifications from MDM apps.
 * It prevents the "Device Locked" or "Payment Reminder" banners from appearing.
 */
class TitanNotificationService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val pkg = sbn.packageName
        val targets = listOf(
            "com.m-kopa.app", "com.mkopa.app", "com.mkopa.sales",
            "com.samsung.android.knox.guard", "com.samsung.android.kgclient",
            "com.google.android.apps.work.clouddpc"
        )

        if (targets.contains(pkg)) {
            // SIRCALLY REMOVE THE THREAT
            cancelNotification(sbn.key)
            Log.d("TitanShield", "Alert from $pkg neutralized.")
        }
    }
}
