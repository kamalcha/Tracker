import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation'; // Add this import

class TimerState {
    status = $state<'idle' | 'working'>('idle');
    seconds = $state(0);
    currentDate = $state<string>('');
    private interval: any = null;

    // Derived state for the Visual Nudge
    isOverTime = $derived(this.seconds > 12 * 3600);

    private tickInterval: any = null;
    private heartbeatInterval: any = null;
    private intentTimeout: any = null;

    constructor() {
        if (browser) this.init();
    }

    private async init() {
        const savedStart = localStorage.getItem('punch_clock_start');
        if (!savedStart) return;

        const start = new Date(savedStart);
        const now = new Date();
        const startDay = start.toLocaleDateString('en-CA');
        const today = now.toLocaleDateString('en-CA');

        // --- THE MIDNIGHT CATCH-UP ---
        // If the browser was closed over one or more midnights
        if (startDay !== today) {
            await this.catchUpMissingDays(start, now);
        } else {
            this.currentDate = startDay;
            this.seconds = Math.floor((now.getTime() - start.getTime()) / 1000);
            this.resume(this.seconds, startDay);
        }

        // if (savedStart) {
        //     const start = new Date(savedStart);
        //     const now = new Date();
        //     this.currentDate = start.toLocaleDateString('en-CA');
        //     this.seconds = Math.floor((now.getTime() - start.getTime()) / 1000);
        //     this.resume();
        // }
    }

    private async catchUpMissingDays(startDate: Date, endDate: Date) {
        let current = new Date(startDate);

        while (current.toLocaleDateString('en-CA') !== endDate.toLocaleDateString('en-CA')) {
            const dateStr = current.toLocaleDateString('en-CA');

            // Sync this full or partial day to the DB
            await fetch('/api/timer', {
                method: 'POST',
                body: JSON.stringify({ action: 'stop', date: dateStr })
            });

            // Move to the next day at 00:00:00
            current.setDate(current.getDate() + 1);
            current.setHours(0, 0, 0, 0);

            // Start the next day in the DB
            await fetch('/api/timer', {
                method: 'POST',
                body: JSON.stringify({ action: 'start', date: current.toLocaleDateString('en-CA') })
            });
        }

        // Finalize state for the current day
        this.currentDate = endDate.toLocaleDateString('en-CA');
        this.seconds = Math.floor((endDate.getTime() - current.getTime()) / 1000);
        localStorage.setItem('punch_clock_start', current.toISOString());
        this.resume(this.seconds, this.currentDate);
    }

    // Reset logic for "Hard Starts" and "Day Wipes"
    // reset() {
    //     if (this.interval) clearInterval(this.interval);
    //     this.status = 'idle';
    //     this.seconds = 0;
    //     localStorage.removeItem('punch_clock_start');
    // }

    get elapsed() {
        const h = Math.floor(this.seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((this.seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (this.seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    async start() {
        // this.reset();
        const now = new Date();
        // this.status = 'working';
        // this.seconds = 0;
        this.currentDate = now.toLocaleDateString('en-CA');

        localStorage.setItem('punch_clock_start', now.toISOString());

        await fetch('/api/timer', {
            method: 'POST',
            body: JSON.stringify({ action: 'start', date: this.currentDate })
        });

        this.resume(0, this.currentDate);
    }

    // private resume() {
    //     this.status = 'working';
    //     // if (this.interval) clearInterval(this.interval);
    //     if (this.tickInterval) clearInterval(this.tickInterval);
    //     if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    //     if (this.intentTimeout) clearTimeout(this.intentTimeout);

    //     // 1. The Ticker (UI update)
    //     this.tickInterval = setInterval(() => {
    //         this.seconds++;

    //         // --- MIDNIGHT ROLLOVER ---
    //         const today = new Date().toLocaleDateString('en-CA');
    //         if (today !== this.currentDate) {
    //             this.handleMidnight(today);
    //         }
    //     }, 1000);
    resume(initialSeconds: number, date: string) {
        this.seconds = initialSeconds;
        this.currentDate = date;
        this.status = 'working';

        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.intentTimeout) clearTimeout(this.intentTimeout);

        // 1. THE TICKER: Updates the UI every second
        this.tickInterval = setInterval(() => {
            this.seconds++;
            const today = new Date().toLocaleDateString('en-CA');
            if (today !== this.currentDate) this.handleMidnight(today);
        }, 1000);

        // 2. The Heartbeat
        // Stage 1: Wait 10 seconds to confirm user intent [cite: 26, 27]
        this.intentTimeout = setTimeout(async () => {
            await this.silentSync();

            // Stage 2: Only start the 60s heartbeat after the first 10s pulse [cite: 26, 27]
            this.heartbeatInterval = setInterval(() => {
                this.silentSync();
            }, 60000);
        }, 5000);
        // this.heartbeatInterval = setInterval(() => {
        //     this.silentSync();
        // }, 60000);
    }

    private async silentSync() {
        if (!this.currentDate) return;
        try {
            await fetch('/api/timer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync',
                    date: this.currentDate,
                    seconds: this.seconds,
                    lastSeen: new Date().toISOString()
                })
            });
        } catch (e) {
            // Silently fail to keep the console clean; local storage is the backup
        }

        // Send a pulse without refreshing the UI (no invalidateAll)
        // await fetch('/api/timer', {
        //     method: 'POST',
        //     body: JSON.stringify({
        //         action: 'sync',
        //         date: this.currentDate,
        //         seconds: this.seconds,
        //         lastSeen: new Date().toISOString()
        //     })
        // });
    }

    async stop() {
        await fetch('/api/timer', {
            method: 'POST',
            body: JSON.stringify({ action: 'stop', date: this.currentDate })
        });
        this.reset();
        if (browser) await invalidateAll();
    }

    reset() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.intentTimeout) clearTimeout(this.intentTimeout);
        this.status = 'idle';
        this.seconds = 0;
        localStorage.removeItem('punch_clock_start');
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

    // async stop() {
    //     await fetch('/api/timer', {
    //         method: 'POST',
    //         body: JSON.stringify({ action: 'stop', date: this.currentDate })
    //     });

    //     this.reset(); // Use the shared reset logic here
    //     // this.status = 'idle';
    //     // clearInterval(this.interval);
    //     // localStorage.removeItem('punch_clock_start');
    //     // this.seconds = 0;

    //     if (browser) {
    //         await invalidateAll();
    //     }
    // }
}

export const timer = new TimerState();