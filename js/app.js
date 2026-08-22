/**
 * Cs Digital Z Studio - Main App Controller
 */
import { StudioState } from './state.js';
import { StudioEngine } from './engine.js';
import { StudioRecorder } from './recorder.js';
import { StudioPrompter } from './prompter.js';

document.addEventListener('DOMContentLoaded', () => {
  const engine = new StudioEngine('studioCanvas', 'rawCam', 'rawScreen');
  const prompter = new StudioPrompter();
  const recorder = new StudioRecorder(engine.canvas, showPreviewModal);

  // ── TABS NAVIGATION ──
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // ── DEVICE SELECTION & ENUMERATION ──
  const cameraSelect = document.getElementById('cameraSelect');
  const micSelect = document.getElementById('micSelect');
  const btnToggleCam = document.getElementById('btnToggleCam');
  const rawCam = document.getElementById('rawCam');

  async function listDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const audioInputs = devices.filter(d => d.kind === 'audioinput');

      const targetCamId = StudioState.savedCameraId || cameraSelect.value;
      const targetMicId = StudioState.savedMicId || micSelect.value;

      if (videoInputs.length > 0) {
        cameraSelect.innerHTML = videoInputs.map((d, i) => 
          `<option value="${d.deviceId}" ${d.deviceId === targetCamId ? 'selected' : ''}>${d.label || `Câmera ${i+1}`}</option>`
        ).join('');
        if (targetCamId && videoInputs.some(d => d.deviceId === targetCamId)) {
          cameraSelect.value = targetCamId;
        }
      }

      if (audioInputs.length > 0) {
        micSelect.innerHTML = audioInputs.map((d, i) => 
          `<option value="${d.deviceId}" ${d.deviceId === targetMicId ? 'selected' : ''}>${d.label || `Microfone ${i+1}`}</option>`
        ).join('');
        if (targetMicId && audioInputs.some(d => d.deviceId === targetMicId)) {
          micSelect.value = targetMicId;
        }
      }
    } catch (err) {
      console.warn('Erro listando dispositivos:', err);
    }
  }

  navigator.mediaDevices.addEventListener('devicechange', listDevices);

  async function startCamera(deviceId) {
    if (StudioState.camStream) {
      StudioState.camStream.getTracks().forEach(t => t.stop());
      StudioState.camStream = null;
    }
    try {
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: false
      };

      StudioState.camStream = await navigator.mediaDevices.getUserMedia(constraints);
      rawCam.srcObject = StudioState.camStream;
      rawCam.onloadedmetadata = () => { rawCam.play().catch(() => {}); };
      await rawCam.play().catch(() => {});

      btnToggleCam.classList.add('active');
      btnToggleCam.querySelector('span:first-child').innerText = '📷 Câmera Ativa';
      await listDevices();
      if (deviceId && cameraSelect) cameraSelect.value = deviceId;
    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      if (deviceId) {
        try {
          StudioState.camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          rawCam.srcObject = StudioState.camStream;
          rawCam.play();
          btnToggleCam.classList.add('active');
          btnToggleCam.querySelector('span:first-child').innerText = '📷 Câmera Ativa';
          await listDevices();
        } catch (e2) {}
      }
    }
  }

  cameraSelect.addEventListener('change', () => {
    if (cameraSelect.value) {
      StudioState.savedCameraId = cameraSelect.value;
      startCamera(cameraSelect.value);
    }
  });

  btnToggleCam.addEventListener('click', async () => {
    if (StudioState.camStream) {
      StudioState.camStream.getTracks().forEach(t => t.stop());
      StudioState.camStream = null;
      rawCam.srcObject = null;
      btnToggleCam.classList.remove('active');
      btnToggleCam.querySelector('span:first-child').innerText = '📷 Câmera Desativada (Clique p/ Ativar)';
    } else {
      await startCamera(cameraSelect.value || undefined);
    }
  });

  // ── SCREEN SHARE ──
  const btnToggleScreen = document.getElementById('btnToggleScreen');
  const rawScreen = document.getElementById('rawScreen');

  btnToggleScreen.addEventListener('click', async () => {
    if (StudioState.screenStream) {
      StudioState.screenStream.getTracks().forEach(t => t.stop());
      StudioState.screenStream = null;
      rawScreen.srcObject = null;
      btnToggleScreen.classList.remove('active');
    } else {
      try {
        StudioState.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 60 } },
          audio: true
        });
        rawScreen.srcObject = StudioState.screenStream;
        rawScreen.play();
        btnToggleScreen.classList.add('active');

        StudioState.screenStream.getVideoTracks()[0].onended = () => {
          StudioState.screenStream = null;
          rawScreen.srcObject = null;
          btnToggleScreen.classList.remove('active');
        };
      } catch (err) {
        console.log('Compartilhamento cancelado:', err);
      }
    }
  });

  // ── AUDIO & VU METER ──
  const vuFill = document.getElementById('vuFill');
  const vuPercent = document.getElementById('vuPercent');

  async function startMicrophone(deviceId) {
    if (StudioState.audioStream) {
      StudioState.audioStream.getTracks().forEach(t => t.stop());
    }
    try {
      StudioState.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setupAudioAnalyzer(StudioState.audioStream);
      if (deviceId && micSelect) micSelect.value = deviceId;
    } catch (err) {
      console.warn('Erro ao conectar microfone:', err);
    }
  }

  function setupAudioAnalyzer(stream) {
    if (StudioState.audioContext) StudioState.audioContext.close();
    StudioState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = StudioState.audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = StudioState.audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    setInterval(() => {
      analyser.getByteFrequencyData(buffer);
      let total = 0;
      for (let i = 0; i < buffer.length; i++) total += buffer[i];
      let avg = total / buffer.length;
      let p = Math.min(100, Math.round((avg / 128) * 100));
      if (vuFill) vuFill.style.width = p + '%';
      if (vuPercent) vuPercent.innerText = p + '%';
    }, 50);
  }

  micSelect.addEventListener('change', () => {
    if (micSelect.value) {
      StudioState.savedMicId = micSelect.value;
      startMicrophone(micSelect.value);
    }
  });

  // ── CAMERA & SCREEN LIVE ADJUSTMENT CONTROLS ──
  // Camera Zoom
  const camZoomSlider = document.getElementById('camZoomSlider');
  const camZoomVal = document.getElementById('camZoomVal');
  camZoomSlider.addEventListener('input', (e) => {
    StudioState.camZoom = parseFloat(e.target.value);
    camZoomVal.innerText = StudioState.camZoom.toFixed(2) + 'x';
  });

  // Camera Pan X & Pan Y
  const camPanXSlider = document.getElementById('camPanXSlider');
  const camPanXVal = document.getElementById('camPanXVal');
  if (camPanXSlider) {
    camPanXSlider.addEventListener('input', (e) => {
      StudioState.camPanX = parseInt(e.target.value, 10) / 100;
      if (camPanXVal) camPanXVal.innerText = e.target.value + '%';
    });
  }

  const camPanYSlider = document.getElementById('camPanYSlider');
  const camPanYVal = document.getElementById('camPanYVal');
  camPanYSlider.addEventListener('input', (e) => {
    StudioState.camPanY = parseInt(e.target.value, 10) / 100;
    camPanYVal.innerText = e.target.value + '%';
  });

  // Camera Filters (Brightness, Contrast, Saturation)
  const camBrightSlider = document.getElementById('camBrightSlider');
  const camBrightVal = document.getElementById('camBrightVal');
  if (camBrightSlider) {
    camBrightSlider.addEventListener('input', (e) => {
      StudioState.camBrightness = parseInt(e.target.value, 10);
      if (camBrightVal) camBrightVal.innerText = StudioState.camBrightness + '%';
    });
  }

  const camContrastSlider = document.getElementById('camContrastSlider');
  const camContrastVal = document.getElementById('camContrastVal');
  if (camContrastSlider) {
    camContrastSlider.addEventListener('input', (e) => {
      StudioState.camContrast = parseInt(e.target.value, 10);
      if (camContrastVal) camContrastVal.innerText = StudioState.camContrast + '%';
    });
  }

  const camSatSlider = document.getElementById('camSatSlider');
  const camSatVal = document.getElementById('camSatVal');
  if (camSatSlider) {
    camSatSlider.addEventListener('input', (e) => {
      StudioState.camSaturation = parseInt(e.target.value, 10);
      if (camSatVal) camSatVal.innerText = StudioState.camSaturation + '%';
    });
  }

  const camMirrorSelect = document.getElementById('camMirrorSelect');
  camMirrorSelect.addEventListener('change', (e) => {
    StudioState.isCamMirrored = e.target.value === 'true';
  });

  // Screen Adjustments
  const screenZoomSlider = document.getElementById('screenZoomSlider');
  const screenZoomVal = document.getElementById('screenZoomVal');
  screenZoomSlider.addEventListener('input', (e) => {
    StudioState.screenZoom = parseFloat(e.target.value);
    screenZoomVal.innerText = StudioState.screenZoom.toFixed(2) + 'x';
  });

  const screenPanXSlider = document.getElementById('screenPanXSlider');
  const screenPanXVal = document.getElementById('screenPanXVal');
  screenPanXSlider.addEventListener('input', (e) => {
    StudioState.screenPanX = parseInt(e.target.value, 10) / 100;
    screenPanXVal.innerText = e.target.value + '%';
  });

  const screenPanYSlider = document.getElementById('screenPanYSlider');
  const screenPanYVal = document.getElementById('screenPanYVal');
  screenPanYSlider.addEventListener('input', (e) => {
    StudioState.screenPanY = parseInt(e.target.value, 10) / 100;
    screenPanYVal.innerText = e.target.value + '%';
  });

  // Split Ratio, Divider & PiP Size
  const splitRatioSlider = document.getElementById('splitRatioSlider');
  const splitRatioVal = document.getElementById('splitRatioVal');
  splitRatioSlider.addEventListener('input', (e) => {
    const v = parseInt(e.target.value, 10);
    StudioState.splitRatio = v / 100;
    splitRatioVal.innerText = `${v}/${100 - v}`;
  });

  const dividerColorSelect = document.getElementById('dividerColorSelect');
  dividerColorSelect.addEventListener('change', (e) => {
    StudioState.dividerColor = e.target.value;
  });

  const pipSizeSlider = document.getElementById('pipSizeSlider');
  const pipSizeVal = document.getElementById('pipSizeVal');
  pipSizeSlider.addEventListener('input', (e) => {
    StudioState.pipSize = parseInt(e.target.value, 10) / 100;
    pipSizeVal.innerText = e.target.value + '%';
  });

  // Aspect Ratio, Quality & Layout
  const aspectSelect = document.getElementById('aspectSelect');
  const qualitySelect = document.getElementById('qualitySelect');
  const qualityBadgeVal = document.getElementById('qualityBadgeVal');

  function updateResolution() {
    const aspect = aspectSelect ? aspectSelect.value : '9:16';
    const quality = qualitySelect ? qualitySelect.value : '1080p';
    StudioState.aspectRatio = aspect;
    StudioState.videoQuality = quality;
    if (qualityBadgeVal) qualityBadgeVal.innerText = quality.toUpperCase();
    engine.setResolution(aspect, quality);
  }

  aspectSelect.addEventListener('change', updateResolution);
  if (qualitySelect) qualitySelect.addEventListener('change', updateResolution);

  document.querySelectorAll('.btn-layout').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-layout').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StudioState.currentLayout = btn.dataset.layout;
    });
  });

  // Preview Scale Controls
  const studioCanvas = document.getElementById('studioCanvas');
  const previewScaleVal = document.getElementById('previewScaleVal');
  const btnZoomInPreview = document.getElementById('btnZoomInPreview');
  const btnZoomOutPreview = document.getElementById('btnZoomOutPreview');
  const btnResetPreview = document.getElementById('btnResetPreview');

  function updatePreviewScale() {
    studioCanvas.style.transform = `scale(${StudioState.previewScale})`;
    studioCanvas.style.transformOrigin = 'center center';
    if (previewScaleVal) previewScaleVal.innerText = Math.round(StudioState.previewScale * 100) + '%';
  }

  btnZoomInPreview.addEventListener('click', () => {
    StudioState.previewScale = Math.min(1.5, StudioState.previewScale + 0.1);
    updatePreviewScale();
  });

  btnZoomOutPreview.addEventListener('click', () => {
    StudioState.previewScale = Math.max(0.6, StudioState.previewScale - 0.1);
    updatePreviewScale();
  });

  btnResetPreview.addEventListener('click', () => {
    StudioState.previewScale = 1.0;
    updatePreviewScale();
  });

  // ── TECH EMOJI PICKER LISTENERS ──
  document.querySelectorAll('.btn-emoji-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      const input = document.getElementById('bannerTextInput');
      if (!input) return;
      const current = input.value.trim();
      if (current) {
        const withoutInitialEmoji = current.replace(/^[\p{Emoji}\s]+/u, '').trim();
        input.value = `${emoji} ${withoutInitialEmoji}`.trim();
      } else {
        input.value = `${emoji} ZAPRUN`;
      }
    });
  });

  // ── SAVE & LOAD USER DEFAULTS ──
  const btnSaveDefaults = document.getElementById('btnSaveDefaults');
  const saveStatusMsg = document.getElementById('saveStatusMsg');

  function saveAllDefaults() {
    const bannerTextInput = document.getElementById('bannerTextInput');
    const prompterSpeed = document.getElementById('prompterSpeed');
    const prompterFontSize = document.getElementById('prompterFontSize');

    const defaults = {
      cameraId: cameraSelect.value,
      micId: micSelect.value,
      aspect: aspectSelect.value,
      quality: qualitySelect ? qualitySelect.value : '1080p',
      layout: StudioState.currentLayout,
      camZoom: StudioState.camZoom,
      camPanX: StudioState.camPanX,
      camPanY: StudioState.camPanY,
      camBrightness: StudioState.camBrightness,
      camContrast: StudioState.camContrast,
      camSaturation: StudioState.camSaturation,
      screenZoom: StudioState.screenZoom,
      screenPanX: StudioState.screenPanX,
      screenPanY: StudioState.screenPanY,
      splitRatio: StudioState.splitRatio,
      isCamMirrored: StudioState.isCamMirrored,
      dividerColor: StudioState.dividerColor,
      pipSize: StudioState.pipSize,
      bannerText: bannerTextInput ? bannerTextInput.value : '',
      prompterSpeed: prompterSpeed ? prompterSpeed.value : '2',
      prompterFontSize: prompterFontSize ? prompterFontSize.value : '18',
      previewScale: StudioState.previewScale
    };
    localStorage.setItem('csdigital_user_defaults', JSON.stringify(defaults));

    if (saveStatusMsg) {
      saveStatusMsg.style.display = 'block';
      setTimeout(() => { saveStatusMsg.style.display = 'none'; }, 3000);
    }
  }

  function loadAllDefaults() {
    const stored = localStorage.getItem('csdigital_user_defaults');
    if (!stored) return;
    try {
      const d = JSON.parse(stored);
      if (d.cameraId) StudioState.savedCameraId = d.cameraId;
      if (d.micId) StudioState.savedMicId = d.micId;
      if (d.quality && qualitySelect) {
        StudioState.videoQuality = d.quality;
        qualitySelect.value = d.quality;
      }
      if (d.aspect) {
        StudioState.aspectRatio = d.aspect;
        aspectSelect.value = d.aspect;
      }
      updateResolution();

      if (d.layout) {
        StudioState.currentLayout = d.layout;
        document.querySelectorAll('.btn-layout').forEach(b => {
          b.classList.toggle('active', b.dataset.layout === StudioState.currentLayout);
        });
      }
      if (d.camZoom !== undefined) { StudioState.camZoom = d.camZoom; camZoomSlider.value = d.camZoom; camZoomVal.innerText = d.camZoom.toFixed(2) + 'x'; }
      if (d.camPanX !== undefined && camPanXSlider) { StudioState.camPanX = d.camPanX; camPanXSlider.value = Math.round(d.camPanX * 100); if (camPanXVal) camPanXVal.innerText = camPanXSlider.value + '%'; }
      if (d.camPanY !== undefined) { StudioState.camPanY = d.camPanY; camPanYSlider.value = Math.round(d.camPanY * 100); camPanYVal.innerText = camPanYSlider.value + '%'; }
      if (d.camBrightness !== undefined && camBrightSlider) { StudioState.camBrightness = d.camBrightness; camBrightSlider.value = d.camBrightness; if (camBrightVal) camBrightVal.innerText = d.camBrightness + '%'; }
      if (d.camContrast !== undefined && camContrastSlider) { StudioState.camContrast = d.camContrast; camContrastSlider.value = d.camContrast; if (camContrastVal) camContrastVal.innerText = d.camContrast + '%'; }
      if (d.camSaturation !== undefined && camSatSlider) { StudioState.camSaturation = d.camSaturation; camSatSlider.value = d.camSaturation; if (camSatVal) camSatVal.innerText = d.camSaturation + '%'; }
      if (d.screenZoom !== undefined) { StudioState.screenZoom = d.screenZoom; screenZoomSlider.value = d.screenZoom; screenZoomVal.innerText = d.screenZoom.toFixed(2) + 'x'; }
      if (d.screenPanX !== undefined) { StudioState.screenPanX = d.screenPanX; screenPanXSlider.value = Math.round(d.screenPanX * 100); screenPanXVal.innerText = screenPanXSlider.value + '%'; }
      if (d.screenPanY !== undefined) { StudioState.screenPanY = d.screenPanY; screenPanYSlider.value = Math.round(d.screenPanY * 100); screenPanYVal.innerText = screenPanYSlider.value + '%'; }
      if (d.splitRatio !== undefined) { StudioState.splitRatio = d.splitRatio; splitRatioSlider.value = Math.round(d.splitRatio * 100); splitRatioVal.innerText = `${splitRatioSlider.value}/${100 - splitRatioSlider.value}`; }
      if (d.isCamMirrored !== undefined) { StudioState.isCamMirrored = d.isCamMirrored; camMirrorSelect.value = String(d.isCamMirrored); }
      if (d.dividerColor) { StudioState.dividerColor = d.dividerColor; dividerColorSelect.value = d.dividerColor; }
      if (d.pipSize !== undefined) { StudioState.pipSize = d.pipSize; pipSizeSlider.value = Math.round(d.pipSize * 100); pipSizeVal.innerText = pipSizeSlider.value + '%'; }
      const bannerTextInput = document.getElementById('bannerTextInput');
      if (d.bannerText !== undefined && bannerTextInput) { bannerTextInput.value = d.bannerText; }
      const prompterSpeed = document.getElementById('prompterSpeed');
      const prompterFontSize = document.getElementById('prompterFontSize');
      if (d.prompterSpeed && prompterSpeed) { prompterSpeed.value = d.prompterSpeed; }
      if (d.prompterFontSize && prompterFontSize) { prompterFontSize.value = d.prompterFontSize; document.getElementById('prompterTextBody').style.fontSize = d.prompterFontSize + 'px'; }
      if (d.previewScale) { StudioState.previewScale = d.previewScale; updatePreviewScale(); }
    } catch (e) {
      console.warn('Erro ao carregar defaults:', e);
    }
  }

  if (btnSaveDefaults) btnSaveDefaults.addEventListener('click', saveAllDefaults);

  // Initial Auto-load & Device Initialization
  loadAllDefaults();

  listDevices().then(() => {
    const camToStart = StudioState.savedCameraId || cameraSelect.value;
    const micToStart = StudioState.savedMicId || micSelect.value;
    startCamera(camToStart || undefined);
    if (micToStart) startMicrophone(micToStart);
  });

  // ── KEYBOARD SHORTCUTS ──
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.code === 'Space' || e.key.toLowerCase() === 'p') {
      e.preventDefault();
      recorder.togglePause();
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      if (!StudioState.mediaRecorder || StudioState.mediaRecorder.state === 'inactive') {
        recorder.start();
      } else {
        recorder.stop();
      }
    }
  });

  // ── PREVIEW MODAL & DOWNLOAD ──
  const modalPreview = document.getElementById('modalPreview');
  const previewPlayer = document.getElementById('previewPlayer');
  const downloadVideoBtn = document.getElementById('downloadVideoBtn');

  function showPreviewModal(url) {
    previewPlayer.src = url;
    const selected = StudioState.allScripts.find(s => s.id === prompter.scriptSelector.value);
    const filename = selected ? `CsDigital_${selected.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.webm` : 'CsDigital_Video.webm';
    downloadVideoBtn.href = url;
    downloadVideoBtn.download = filename;
    modalPreview.classList.add('active');
  }

  document.getElementById('btnClosePreview').addEventListener('click', () => {
    modalPreview.classList.remove('active');
    previewPlayer.pause();
  });
});
