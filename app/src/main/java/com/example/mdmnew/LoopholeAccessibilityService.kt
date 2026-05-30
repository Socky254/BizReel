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
        
        // v22.0: SCALPEL PRECISION
        // Throttling to 1 second to ensure system stability
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastScanTime < 1000) return
        lastScanTime = currentTime

        val activePkg = event.packageName?.toString() ?: ""
        val targets = listOf(
            "com.m-kopa.app", "com.mkopa.app", "com.mkopa.sales",
            "com.samsung.android.knox.guard", "com.samsung.android.kgclient",
            "com.google.android.apps.work.clouddpc", "com.payjoy.access"
        )

        // 1. SELECTIVE FOCUS HIJACK
        // Only kick to home if one of the MALICIOUS apps is in front
        if (targets.contains(activePkg)) {
            performGlobalAction(GLOBAL_ACTION_HOME)
            return
        }

        // 2. PRECISION AUTO-CLICK
        // Only click these specific safety-critical buttons
        val safeButtons = listOf("ALLOW", "OK", "ALWAYS ALLOW", "INSTALL ANYWAY", "CONTINUE")
        safeButtons.forEach { findAndClick(rootNode, it) }

        // 3. TARGETED UN-GRAY (Only on Settings screens)
        if (activePkg.contains("settings")) {
            scanForSpecificToggles(rootNode)
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
