// Pure endpoint detector: silence before speech must never submit an empty turn.
// This energy heuristic needs real microphone/noise calibration; it is not ASR.
export class EndOfTurn {
  started: number;
  lastSpeech: number | null = null;
  voicedMs = 0;
  previous: number;
  constructor(at: number) { this.started = this.previous = at; }
  sample(rms: number, at: number): 'finish' | 'empty' | null {
    const delta = Math.max(0, Math.min(100, at - this.previous));
    this.previous = at;
    if (rms >= 0.018) { this.voicedMs += delta; this.lastSpeech = at; }
    if (at - this.started >= 30000) return this.voicedMs >= 250 ? 'finish' : 'empty';
    if (this.voicedMs < 250) return at - this.started >= 10000 ? 'empty' : null;
    return this.lastSpeech !== null && at - this.lastSpeech >= 1100 ? 'finish' : null;
  }
}

export class VoiceTurn {
  private serial = 0;
  private controller: AbortController | null = null;
  begin() { this.cancel(); this.controller = new AbortController(); return {id:this.serial, signal:this.controller.signal}; }
  current(id:number) { return this.serial === id && !this.controller?.signal.aborted; }
  cancel() { this.serial++; this.controller?.abort(); this.controller = null; }
}
