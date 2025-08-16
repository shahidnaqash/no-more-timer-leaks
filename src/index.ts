type TimerInfo = {
    createdAt: number;
    delay: number;
    stack: string;
};

declare global {
    interface Window {
        TIMER_TRACKER?: {
            getActiveTimeouts: () => [number, TimerInfo][];
            getActiveIntervals: () => [number, TimerInfo][];
            report: () => void;
            copyReportToClipboard: () => void;
        };
    }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const tracker = {
        timeouts: new Map<number, TimerInfo>(),
        intervals: new Map<number, TimerInfo>(),
    };

    const original = {
        setTimeout: window.setTimeout.bind(window),
        clearTimeout: window.clearTimeout.bind(window),
        setInterval: window.setInterval.bind(window),
        clearInterval: window.clearInterval.bind(window),
    };

    function getStackTag(): string {
        const err = new Error();
        const stack = err.stack?.split('\n') || [];
        return stack[3]?.trim() || 'unknown';
    }

    window.setTimeout = function (
        fn: TimerHandler,
        delay?: number,
        ...args: any[]
    ): number {
        const id = original.setTimeout(fn, delay, ...args);
        tracker.timeouts.set(id, {
            createdAt: Date.now(),
            delay: delay || 0,
            stack: getStackTag(),
        });
        return id;
    } as typeof window.setTimeout;

    window.clearTimeout = function (id: number | undefined): void {
        if (id !== undefined) {
            tracker.timeouts.delete(id);
            original.clearTimeout(id);
        }
    } as typeof window.clearTimeout;

    window.setInterval = function (
        fn: TimerHandler,
        delay?: number,
        ...args: any[]
    ): number {
        const id = original.setInterval(fn, delay, ...args);
        tracker.intervals.set(id, {
            createdAt: Date.now(),
            delay: delay || 0,
            stack: getStackTag(),
        });
        return id;
    } as typeof window.setInterval;

    window.clearInterval = function (id: number | undefined): void {
        if (id !== undefined) {
            tracker.intervals.delete(id);
            original.clearInterval(id);
        }
    } as typeof window.clearInterval;

    window.TIMER_TRACKER = {
        getActiveTimeouts: () => [...tracker.timeouts.entries()],
        getActiveIntervals: () => [...tracker.intervals.entries()],
        report() {
            const now = Date.now();
            const timeouts = [...tracker.timeouts.entries()];
            const intervals = [...tracker.intervals.entries()];

            console.groupCollapsed(`🕵️ Active Timers Report (${new Date().toLocaleTimeString()})`);

            if (timeouts.length === 0 && intervals.length === 0) {
                console.info('✅ No active timeouts or intervals.');
                console.groupEnd();
                return;
            }

            if (timeouts.length > 0) {
                console.group('Timeouts');
                console.table(
                    timeouts.map(([id, info]) => ({
                        id,
                        delay: info.delay,
                        created: new Date(info.createdAt).toLocaleTimeString(),
                        age: ((now - info.createdAt) / 1000).toFixed(1) + 's',
                        origin: info.stack,
                    }))
                );
                console.groupEnd();
            }

            if (intervals.length > 0) {
                console.group('Intervals');
                console.table(
                    intervals.map(([id, info]) => ({
                        id,
                        delay: info.delay,
                        created: new Date(info.createdAt).toLocaleTimeString(),
                        age: ((now - info.createdAt) / 1000).toFixed(1) + 's',
                        origin: info.stack,
                    }))
                );
                console.groupEnd();
            }

            const originMap: Record<string, { count: number; ids: number[] }> = {};

            [...timeouts, ...intervals].forEach(([id, info]) => {
                const origin = info.stack;
                if (!originMap[origin]) {
                    originMap[origin] = { count: 0, ids: [] };
                }
                originMap[origin].count += 1;
                originMap[origin].ids.push(id);
            });

            const duplicates = Object.entries(originMap)
                .filter(([, info]: [string, { count: number; ids: number[] }]) => info.count > 1)
                .map(([origin, info]: [string, { count: number; ids: number[] }]) => ({
                    origin,
                    count: info.count,
                    ids: info.ids.join(', '),
                }));

            if (duplicates.length > 0) {
                console.group('📌 Duplicate Timer Origins');
                console.table(duplicates);
                console.groupEnd();
            }

            console.groupEnd(); // Main group
        },

        copyReportToClipboard() {
            const now = Date.now();
            const data = {
                time: new Date().toLocaleTimeString(),
                timeouts: [...tracker.timeouts.entries()].map(([id, info]) => ({
                    id,
                    delay: info.delay,
                    created: new Date(info.createdAt).toISOString(),
                    ageSeconds: ((now - info.createdAt) / 1000).toFixed(1),
                    origin: info.stack,
                })),
                intervals: [...tracker.intervals.entries()].map(([id, info]) => ({
                    id,
                    delay: info.delay,
                    created: new Date(info.createdAt).toISOString(),
                    ageSeconds: ((now - info.createdAt) / 1000).toFixed(1),
                    origin: info.stack,
                })),
            };

            navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                .then(() => console.info('📋 Timer report copied to clipboard!'))
                .catch(err => {
                    if (err instanceof DOMException && err.name === 'NotAllowedError') {
                        console.warn(
                            '📋 Copy failed: Clipboard access denied. ' +
                            'Use the "📋 Copy Timer Report" button or call this from a user click.'
                        );
                    } else {
                        console.warn('❌ Failed to copy timer report:', err);
                    }
                });
        },
    };

    function createClipboardButton() {
        if (document.getElementById('__timerTrackerCopyButton')) return;

        const button = document.createElement('button');
        button.id = '__timerTrackerCopyButton';
        button.innerText = '📋 Copy Timer Report';
        Object.assign(button.style, {
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            zIndex: '9999',
            padding: '0.5rem 1rem',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            opacity: '0.8',
        });

        button.addEventListener('mouseenter', () => (button.style.opacity = '1'));
        button.addEventListener('mouseleave', () => (button.style.opacity = '0.8'));

        button.onclick = () => {
            window.TIMER_TRACKER?.copyReportToClipboard();
        };

        document.body.appendChild(button);
    }

    createClipboardButton();
}
