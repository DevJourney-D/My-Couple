// utils/logViewer.ts
export interface LogEntry {
    timestamp: string;
    page: string;
    action: string;
    details: Record<string, unknown>;
    userAgent: string;
}

export const getAppLogs = (): LogEntry[] => {
    try {
        if (typeof window === 'undefined') return [];
        const logs = localStorage.getItem('appLogs');
        return logs ? JSON.parse(logs) : [];
    } catch (error) {
        console.error('Error reading logs:', error);
        return [];
    }
};

export const clearAppLogs = (): void => {
    try {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('appLogs');
            console.log('✅ App logs cleared successfully');
        }
    } catch (error) {
        console.error('Error clearing logs:', error);
    }
};

export const exportLogs = (): string => {
    const logs = getAppLogs();
    return JSON.stringify(logs, null, 2);
};

export const getLogStats = () => {
    const logs = getAppLogs();
    const stats = {
        total: logs.length,
        byPage: {} as Record<string, number>,
        byAction: {} as Record<string, number>,
        lastWeek: 0,
        today: 0
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    logs.forEach(log => {
        // Count by page
        stats.byPage[log.page] = (stats.byPage[log.page] || 0) + 1;
        
        // Count by action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        
        // Count by time
        const logDate = new Date(log.timestamp);
        if (logDate >= today) {
            stats.today++;
        }
        if (logDate >= lastWeek) {
            stats.lastWeek++;
        }
    });

    return stats;
};
