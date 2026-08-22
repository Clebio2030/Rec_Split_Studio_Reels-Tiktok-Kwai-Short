/**
 * Cs Digital Z Studio - MediaRecorder & Session Controller
 */
import { StudioState } from './state.js';

export class StudioRecorder {
  constructor(canvas, onVideoReady) {
    this.canvas = canvas;
    this.onVideoReady = onVideoReady;

    this.btnStartRecord = document.getElementById('btnStartRecord');
    this.btnPauseRecord = document.getElementById('btnPauseRecord');
    this.btnStopRecord = document.getElementById('btnStopRecord');
    this.recBadge = document.getElementById('recBadge');
    this.recTimerText = document.getElementById('recTimerText');
    this.hookBadge = document.getElementById('hookBadge');
    this.hookCountdownVal = document.getElementById('hookCountdownVal');

    this.initListeners();
  }

  initListeners() {
    this.btnStartRecord.addEventListener('click', () => this.start());
    this.btnPauseRecord.addEventListener('click', () => this.togglePause());
    this.btnStopRecord.addEventListener('click', () => this.stop());
  }

  start() {
    StudioState.recordedChunks = [];
    StudioState.isRecordingPaused = false;
    StudioState.pausedDuration = 0;

    const canvasStream = this.canvas.captureStream(60);

    // Merge Audio Tracks
    if (StudioState.audioStream && StudioState.audioStream.getAudioTracks().length > 0) {
      canvasStream.addTrack(StudioState.audioStream.getAudioTracks()[0]);
    }
    if (StudioState.screenStream && StudioState.screenStream.getAudioTracks().length > 0) {
      canvasStream.addTrack(StudioState.screenStream.getAudioTracks()[0]);
    }

    let bitrate = 10_000_000; // 10 Mbps (Full HD)
    if (StudioState.videoQuality === '2k') bitrate = 18_000_000; // 18 Mbps (2K)
    if (StudioState.videoQuality === '4k') bitrate = 30_000_000; // 30 Mbps (4K)

    let options = { 
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: bitrate
    };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm', videoBitsPerSecond: bitrate };
    }

    StudioState.mediaRecorder = new MediaRecorder(canvasStream, options);

    StudioState.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) StudioState.recordedChunks.push(e.data);
    };

    StudioState.mediaRecorder.onstop = () => {
      const blob = new Blob(StudioState.recordedChunks, { type: 'video/webm' });
      const videoURL = URL.createObjectURL(blob);
      if (this.onVideoReady) this.onVideoReady(videoURL);
    };

    StudioState.mediaRecorder.start(250);
    StudioState.recordStartTime = Date.now();

    this.btnStartRecord.style.display = 'none';
    this.btnPauseRecord.style.display = 'flex';
    this.btnPauseRecord.innerHTML = '<span>⏸️ Pausar (Espaço)</span>';
    this.btnPauseRecord.style.background = '#d97706';
    this.btnStopRecord.style.display = 'flex';
    this.recBadge.classList.add('active');
    this.recBadge.classList.remove('paused');
    this.recBadge.querySelector('span:nth-child(2)').innerText = 'GRAVANDO';

    // Hook 3-Second Visual Countdown
    this.hookBadge.style.display = 'flex';
    this.hookBadge.style.borderColor = 'var(--gold)';
    let hookSecs = 3.0;
    this.hookCountdownVal.innerText = '3.0s';
    const hookTimer = setInterval(() => {
      if (StudioState.isRecordingPaused) return;
      hookSecs -= 0.1;
      if (hookSecs <= 0) {
        clearInterval(hookTimer);
        this.hookCountdownVal.innerText = '✓ Gancho Feito!';
        this.hookBadge.style.borderColor = 'var(--success)';
        setTimeout(() => { this.hookBadge.style.display = 'none'; }, 1800);
      } else {
        this.hookCountdownVal.innerText = hookSecs.toFixed(1) + 's';
      }
    }, 100);

    // Record Timer Display
    clearInterval(StudioState.recordTimerInterval);
    StudioState.recordTimerInterval = setInterval(() => {
      if (StudioState.isRecordingPaused) return;
      const elapsed = Math.floor((Date.now() - StudioState.recordStartTime - StudioState.pausedDuration) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      this.recTimerText.innerText = `${mins}:${secs}`;
    }, 500);

    // Trigger prompter auto-scroll
    const btnPrompterToggle = document.getElementById('btnPrompterToggle');
    if (!StudioState.isPrompterScrolling && btnPrompterToggle) {
      btnPrompterToggle.click();
    }
  }

  togglePause() {
    if (!StudioState.mediaRecorder || StudioState.mediaRecorder.state === 'inactive') return;

    const btnPrompterToggle = document.getElementById('btnPrompterToggle');

    if (!StudioState.isRecordingPaused) {
      StudioState.mediaRecorder.pause();
      StudioState.isRecordingPaused = true;
      StudioState.pauseStartTime = Date.now();
      this.btnPauseRecord.innerHTML = '<span>▶️ Continuar (Espaço)</span>';
      this.btnPauseRecord.style.background = '#10b981';
      this.recBadge.classList.add('paused');
      this.recBadge.querySelector('span:nth-child(2)').innerText = 'PAUSADO';
      if (StudioState.isPrompterScrolling && btnPrompterToggle) {
        clearInterval(StudioState.prompterScrollTimer);
      }
    } else {
      StudioState.mediaRecorder.resume();
      StudioState.isRecordingPaused = false;
      StudioState.pausedDuration += (Date.now() - StudioState.pauseStartTime);
      this.btnPauseRecord.innerHTML = '<span>⏸️ Pausar (Espaço)</span>';
      this.btnPauseRecord.style.background = '#d97706';
      this.recBadge.classList.remove('paused');
      this.recBadge.querySelector('span:nth-child(2)').innerText = 'GRAVANDO';
    }
  }

  stop() {
    if (StudioState.mediaRecorder && StudioState.mediaRecorder.state !== 'inactive') {
      StudioState.mediaRecorder.stop();
    }
    clearInterval(StudioState.recordTimerInterval);
    const btnPrompterToggle = document.getElementById('btnPrompterToggle');
    if (StudioState.isPrompterScrolling && btnPrompterToggle) {
      btnPrompterToggle.click();
    }

    this.btnStartRecord.style.display = 'flex';
    this.btnPauseRecord.style.display = 'none';
    this.btnStopRecord.style.display = 'none';
    this.recBadge.classList.remove('active');
    this.recBadge.classList.remove('paused');
    this.recTimerText.innerText = '00:00';
  }
}
