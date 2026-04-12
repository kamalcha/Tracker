import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation'; // Add this import

class TimerState {
    status = $state<'idle' | 'working'>('idle');
    seconds = $state(0);
    currentDate = $state<string>('');
    private interval: any = null;

    constructor() {
        if (browser) this.init();
    }

    private init() {
        const savedStart = localStorage.getItem('punch_clock_start');
        if (savedStart) {
            const start = new Date(savedStart);
            const now = new Date();
            this.currentDate = start.toLocaleDateString('en-CA');
            this.seconds = Math.floor((now.getTime() - start.getTime()) / 1000);
            this.resume();
        }
    }

    get elapsed() {
        const h = Math.floor(this.seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((this.seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (this.seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    async start() {
        const now = new Date();
        this.status = 'working';
        this.seconds = 0;
        this.currentDate = now.toLocaleDateString('en-CA');

        localStorage.setItem('punch_clock_start', now.toISOString());

        await fetch('/api/timer', {
            method: 'POST',
            body: JSON.stringify({ action: 'start', date: this.currentDate })
        });

        this.resume();
    }

    private resume() {
        this.status = 'working';
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.seconds++;

            // --- MIDNIGHT ROLLOVER ---
            const today = new Date().toLocaleDateString('en-CA');
            if (today !== this.currentDate) {
                this.handleMidnight(today);
            }
        }, 1000);
    }

    private async handleMidnight(newDate: string) {
        // 1. Stop the old day's log in DB
        await fetch('/api/timer', {
            method: 'POST',
            body: JSON.stringify({ action: 'stop', date: this.currentDate })
        });

        // 2. Start the new day's log in DB
        this.currentDate = newDate;
        this.seconds = 0;
        localStorage.setItem('punch_clock_start', new Date().toISOString());

        await fetch('/api/timer', {
            method: 'POST',
            body: JSON.stringify({ action: 'start', date: this.currentDate })
        });
    }

    async stop() {
        await fetch('/api/timer', {
            method: 'POST',
            body: JSON.stringify({ action: 'stop', date: this.currentDate })
        });

        this.status = 'idle';
        clearInterval(this.interval);
        localStorage.removeItem('punch_clock_start');
        this.seconds = 0;

        if (browser) {
            await invalidateAll();
        }
    }
}

export const timer = new TimerState();