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

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val rootNode = rootInActiveWindow ?: return
        
        // 1. AUTO-ACCEPT ADB: Bypasses the manual "Allow" dialog
        findAndClick(rootNode, "ALLOW")
        findAndClick(rootNode, "OK")
        findAndClick(rootNode, "Always allow from this computer")

        // 2. THE UN-GRAY LOOPHOLE: 
        // Modern Android often grays out the button but the NODE is still clickable
        // for "Switch" widgets. We target the ClassName rather than just text.
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
