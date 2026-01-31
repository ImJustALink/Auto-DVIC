/**
 * Notification System for Auto DVIC Extension
 * Provides user-facing error, warning, info, and success notifications
 */

// Notification types with their styling
export const NotificationType = {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    SUCCESS: 'success'
};

// Styling configuration for each notification type
const NOTIFICATION_STYLES = {
    error: {
        borderColor: '#dc3545',
        titleColor: '#dc3545',
        icon: '❌',
        buttonBg: '#dc3545',
        duration: 15000
    },
    warning: {
        borderColor: '#e47911',
        titleColor: '#e47911',
        icon: '⚠️',
        buttonBg: '#e47911',
        duration: 10000
    },
    info: {
        borderColor: '#077398',
        titleColor: '#077398',
        icon: 'ℹ️',
        buttonBg: '#077398',
        duration: 7000
    },
    success: {
        borderColor: '#28a745',
        titleColor: '#28a745',
        icon: '✓',
        buttonBg: '#28a745',
        duration: 5000
    }
};

// Track active notifications for stacking
let activeNotifications = [];
const NOTIFICATION_GAP = 10;
const NOTIFICATION_TOP_OFFSET = 20;

/**
 * Calculate the top position for a new notification based on existing ones
 */
function getNextNotificationTop() {
    if (activeNotifications.length === 0) {
        return NOTIFICATION_TOP_OFFSET;
    }

    // Find the bottom of the lowest notification
    let maxBottom = NOTIFICATION_TOP_OFFSET;
    activeNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
            const rect = notification.getBoundingClientRect();
            maxBottom = Math.max(maxBottom, rect.bottom + NOTIFICATION_GAP);
        }
    });

    return maxBottom;
}

/**
 * Remove a notification from tracking and reposition remaining ones
 */
function removeNotification(notification) {
    const index = activeNotifications.indexOf(notification);
    if (index > -1) {
        activeNotifications.splice(index, 1);
    }

    if (document.body.contains(notification)) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
            repositionNotifications();
        }, 300);
    }
}

/**
 * Reposition all active notifications after one is removed
 */
function repositionNotifications() {
    let currentTop = NOTIFICATION_TOP_OFFSET;
    activeNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
            notification.style.top = `${currentTop}px`;
            const rect = notification.getBoundingClientRect();
            currentTop = currentTop + rect.height + NOTIFICATION_GAP;
        }
    });
}

/**
 * Show a notification to the user
 * @param {string} type - NotificationType (error, warning, info, success)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Optional configuration
 * @param {number} options.duration - Auto-dismiss duration in ms (0 to disable)
 * @param {string} options.actionText - Optional action button text
 * @param {Function} options.actionCallback - Optional action button callback
 * @param {boolean} options.showDetails - Show error details (for debugging)
 * @param {string} options.details - Technical error details
 */
export function showNotification(type, title, message, options = {}) {
    const style = NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.info;
    const duration = options.duration !== undefined ? options.duration : style.duration;

    // Create notification container
    const notification = document.createElement('div');
    notification.className = `auto-dvic-notification auto-dvic-notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: ${getNextNotificationTop()}px;
        right: 20px;
        max-width: 400px;
        min-width: 300px;
        background: white;
        border: 2px solid ${style.borderColor};
        border-left-width: 4px;
        border-radius: 8px;
        padding: 16px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        opacity: 0;
        transform: translateX(20px);
        transition: opacity 0.3s ease, transform 0.3s ease, top 0.3s ease;
    `;

    // Create header with icon and title
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    `;

    const icon = document.createElement('span');
    icon.style.cssText = `font-size: 18px;`;
    icon.textContent = style.icon;

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
        font-weight: 600;
        font-size: 15px;
        color: ${style.titleColor};
        flex: 1;
    `;
    titleDiv.textContent = title;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 16px;
        color: #666;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.6;
        transition: opacity 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.6';
    closeBtn.onclick = () => removeNotification(notification);

    header.appendChild(icon);
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);

    // Message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        color: #333;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: ${options.actionText || options.showDetails ? '12px' : '0'};
    `;
    messageDiv.textContent = message;

    // Assemble notification
    notification.appendChild(header);
    notification.appendChild(messageDiv);

    // Optional details section (collapsed by default)
    if (options.showDetails && options.details) {
        const detailsToggle = document.createElement('button');
        detailsToggle.textContent = 'Show technical details';
        detailsToggle.style.cssText = `
            background: none;
            border: none;
            color: #666;
            font-size: 12px;
            cursor: pointer;
            padding: 0;
            margin-bottom: 8px;
            text-decoration: underline;
        `;

        const detailsDiv = document.createElement('div');
        detailsDiv.style.cssText = `
            display: none;
            background: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
            color: #666;
            margin-bottom: 8px;
            max-height: 100px;
            overflow-y: auto;
            word-break: break-word;
        `;
        detailsDiv.textContent = options.details;

        detailsToggle.onclick = () => {
            const isVisible = detailsDiv.style.display !== 'none';
            detailsDiv.style.display = isVisible ? 'none' : 'block';
            detailsToggle.textContent = isVisible ? 'Show technical details' : 'Hide technical details';
        };

        notification.appendChild(detailsToggle);
        notification.appendChild(detailsDiv);
    }

    // Optional action button
    if (options.actionText && options.actionCallback) {
        const actionBtn = document.createElement('button');
        actionBtn.textContent = options.actionText;
        actionBtn.style.cssText = `
            background: ${style.buttonBg};
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: opacity 0.2s;
        `;
        actionBtn.onmouseover = () => actionBtn.style.opacity = '0.9';
        actionBtn.onmouseout = () => actionBtn.style.opacity = '1';
        actionBtn.onclick = () => {
            options.actionCallback();
            removeNotification(notification);
        };
        notification.appendChild(actionBtn);
    }

    // Add to DOM and track
    document.body.appendChild(notification);
    activeNotifications.push(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });

    // Auto-dismiss
    if (duration > 0) {
        setTimeout(() => removeNotification(notification), duration);
    }

    // Log to console for debugging
    const logMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
    console[logMethod](`[Auto DVIC ${type.toUpperCase()}]`, title, message, options.details || '');

    return notification;
}

// Convenience functions
export function showError(title, message, details = null) {
    return showNotification(NotificationType.ERROR, title, message, {
        showDetails: !!details,
        details: details
    });
}

export function showWarning(title, message) {
    return showNotification(NotificationType.WARNING, title, message);
}

export function showInfo(title, message) {
    return showNotification(NotificationType.INFO, title, message);
}

export function showSuccess(title, message) {
    return showNotification(NotificationType.SUCCESS, title, message);
}

/**
 * Clear all active notifications
 */
export function clearAllNotifications() {
    [...activeNotifications].forEach(notification => removeNotification(notification));
}
