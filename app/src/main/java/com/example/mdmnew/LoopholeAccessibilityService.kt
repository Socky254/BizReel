package com.example.mdmnew

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * v13.0: THE GHOST CLICKER
 * This service monitors the screen for grayed-out buttons or "Device Managed" dialogs.
 * It attempts to programmatically "click" them using Accessibility permissions, 
 * which often bypasses standard UI restrictions.
 */
class LoopholeAccessibilityService : AccessibilityService() {

    private var lastScanTime = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val rootNode = rootInActiveWindow ?: return
        val activePkg = event.packageName?.toString() ?: ""

        // v32.0: MASTER SLEEP CHECK
        // Check if the Controller has set the Sleep flag
        val prefs = getSharedPreferences("titan_prefs", Context.MODE_PRIVATE)
        if (prefs.getBoolean("is_sleeping", false)) return

        // v23.0: SELF-AWARENESS
        if (activePkg == packageName || 
            activePkg == "com.android.settings" || 
            activePkg == "com.android.systemui") return

        val targets = listOf(
            "com.m-kopa.app", "com.mkopa.app", "com.mkopa.sales",
            "com.samsung.android.knox.guard", "com.samsung.android.kgclient",
            "com.google.android.apps.work.clouddpc", "com.payjoy.access"
        )

        // 1. PRECISION HIJACK
        if (targets.contains(activePkg)) {
            performGlobalAction(GLOBAL_ACTION_HOME)
            return
        }

        // 2. THROTTLED AUTO-CLICK
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastScanTime > 2000) { // Check every 2 seconds only
            val safeButtons = listOf("ALLOW", "OK", "INSTALL ANYWAY")
            safeButtons.forEach { findAndClick(rootNode, it) }
            lastScanTime = currentTime
        }
    }

    private fun scanForSpecificToggles(node: AccessibilityNodeInfo?) {
        if (node == null) return
        
        // Only force-click things that look like restricted MDM toggles
        val description = node.contentDescription?.toString()?.lowercase() ?: ""
        val text = node.text?.toString()?.lowercase() ?: ""
        
        if (text.contains("reset") || text.contains("debugging") || text.contains("admin")) {
            if (node.isClickable) {
                node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
        }

        for (i in 0 until node.childCount) {
            scanForSpecificToggles(node.getChild(i))
        }
    }

    private fun scanForHiddenToggles(node: AccessibilityNodeInfo?) {
        if (node == null) return
        if (node.className?.contains("Switch") == true || node.className?.contains("Button") == true) {
            // Programmatic "Forced Click"
            node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        }
        for (i in 0 until node.childCount) {
            scanForHiddenToggles(node.getChild(i))
        }
    }

    private fun findAndClick(node: AccessibilityNodeInfo, text: String) {
        val nodes = node.findAccessibilityNodeInfosByText(text)
        for (n in nodes) {
            if (n.isClickable) {
                n.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            } else {
                // Try clicking the parent if the text label itself isn't clickable
                n.parent?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
        }
    }

    override fun onInterrupt() {}
}
