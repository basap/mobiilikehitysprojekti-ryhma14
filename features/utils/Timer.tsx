type TimerCallback = (elapsed: number) => void;

export class Timer {
  private startTimestamp: number = 0;
  private accumulatedTime: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private running: boolean = false;
  private callback: TimerCallback;
  private intervalMs: number;

  constructor(callback: TimerCallback, intervalMs: number = 10) {
    this.callback = callback;
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startTimestamp = Date.now();

    this.intervalId = setInterval(() => {
      this.callback(this.getElapsed());
    }, this.intervalMs);
  }

  pause(): void {
    if (!this.running) return;
    this.accumulatedTime += Date.now() - this.startTimestamp;
    this.running = false;
    this.clearInterval();
  }

  reset(): void {
    this.accumulatedTime = 0;
    this.startTimestamp = Date.now();
    this.running = false;
    this.clearInterval();
    this.callback(0);
  }

  getElapsed(): number {
    if (this.running) {
      return this.accumulatedTime + (Date.now() - this.startTimestamp);
    }
    return this.accumulatedTime;
  }

  isRunning(): boolean {
    return this.running;
  }

  destroy(): void {
    this.clearInterval();
    this.running = false;
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  static format(ms: number): string {
    const totalCentiseconds = Math.floor(ms / 10);
    const centiseconds = totalCentiseconds % 100;
    const totalSeconds = Math.floor(totalCentiseconds / 100);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);

    return (
      String(minutes).padStart(2, '0') +
      '.' +
      String(seconds).padStart(2, '0') +
      ',' +
      String(centiseconds).padStart(2, '0')
    );
  }
}