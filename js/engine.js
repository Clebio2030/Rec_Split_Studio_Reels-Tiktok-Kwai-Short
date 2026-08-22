/**
 * Cs Digital Z Studio - Canvas Compositing & Rendering Engine (60fps)
 */
import { StudioState } from './state.js';

export class StudioEngine {
  constructor(canvasId, rawCamId, rawScreenId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.rawCam = document.getElementById(rawCamId);
    this.rawScreen = document.getElementById(rawScreenId);

    this.isDragging = false;
    this.dragTarget = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.initialPanX = 0;
    this.initialPanY = 0;

    this.initMouseControls();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  setResolution(ratio = '9:16', quality = '1080p') {
    StudioState.aspectRatio = ratio;
    StudioState.videoQuality = quality;

    let baseW = 1080;
    let baseH = 1920;

    if (ratio === '9:16') {
      if (quality === '4k') { baseW = 2160; baseH = 3840; }
      else if (quality === '2k') { baseW = 1440; baseH = 2560; }
      else { baseW = 1080; baseH = 1920; }
    } else if (ratio === '16:9') {
      if (quality === '4k') { baseW = 3840; baseH = 2160; }
      else if (quality === '2k') { baseW = 2560; baseH = 1440; }
      else { baseW = 1920; baseH = 1080; }
    } else if (ratio === '1:1') {
      if (quality === '4k') { baseW = 2160; baseH = 2160; }
      else if (quality === '2k') { baseW = 1440; baseH = 1440; }
      else { baseW = 1080; baseH = 1080; }
    }

    this.canvas.width = baseW;
    this.canvas.height = baseH;
  }

  drawAdjustedCam(video, x, y, w, h) {
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const vAspect = vw / vh;
    const tAspect = w / h;

    let baseSw, baseSh;
    if (vAspect > tAspect) {
      baseSh = vh;
      baseSw = vh * tAspect;
    } else {
      baseSw = vw;
      baseSh = vw / tAspect;
    }

    const sw = baseSw / StudioState.camZoom;
    const sh = baseSh / StudioState.camZoom;

    const sx = Math.max(0, Math.min(vw - sw, (vw - sw) * StudioState.camPanX));
    const sy = Math.max(0, Math.min(vh - sh, (vh - sh) * StudioState.camPanY));

    this.ctx.save();

    // Camera Real-time Filters (Brilho, Contraste, Saturação)
    this.ctx.filter = `brightness(${StudioState.camBrightness}%) contrast(${StudioState.camContrast}%) saturate(${StudioState.camSaturation}%)`;

    if (StudioState.isCamMirrored) {
      this.ctx.translate(x + w, y);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    } else {
      this.ctx.drawImage(video, sx, sy, sw, sh, x, y, w, h);
    }
    this.ctx.restore();
  }

  drawScreenCover(video, x, y, w, h) {
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const vAspect = vw / vh;
    const tAspect = w / h;
    let baseSw, baseSh;

    if (vAspect > tAspect) {
      baseSh = vh;
      baseSw = vh * tAspect;
    } else {
      baseSw = vw;
      baseSh = vw / tAspect;
    }

    const sw = baseSw / StudioState.screenZoom;
    const sh = baseSh / StudioState.screenZoom;

    const sx = Math.max(0, Math.min(vw - sw, (vw - sw) * StudioState.screenPanX));
    const sy = Math.max(0, Math.min(vh - sh, (vh - sh) * StudioState.screenPanY));

    this.ctx.drawImage(video, sx, sy, sw, sh, x, y, w, h);
  }

  drawEmptyState(x, y, w, h, label) {
    this.ctx.fillStyle = '#0a0e17';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = '#475569';
    this.ctx.font = '600 26px Plus Jakarta Sans, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + w / 2, y + h / 2);
    this.ctx.textAlign = 'start';
  }

  render() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const ctx = this.ctx;

    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, W, H);

    const hasCam = StudioState.camStream && this.rawCam.videoWidth > 0;
    const hasScreen = StudioState.screenStream && this.rawScreen.videoWidth > 0;

    const splitH1 = Math.round(H * StudioState.splitRatio);
    const splitH2 = H - splitH1;

    switch (StudioState.currentLayout) {
      case 'split-vertical':
        if (hasCam) this.drawAdjustedCam(this.rawCam, 0, 0, W, splitH1);
        else this.drawEmptyState(0, 0, W, splitH1, '📷 Câmera Web Desativada');

        if (hasScreen) this.drawScreenCover(this.rawScreen, 0, splitH1, W, splitH2);
        else this.drawEmptyState(0, splitH1, W, splitH2, '🖥️ Compartilhe a Tela');

        if (StudioState.dividerColor !== 'transparent') {
          ctx.fillStyle = StudioState.dividerColor;
          ctx.fillRect(0, splitH1 - 3, W, 6);
        }
        break;

      case 'split-vertical-inv':
        if (hasScreen) this.drawScreenCover(this.rawScreen, 0, 0, W, splitH1);
        else this.drawEmptyState(0, 0, W, splitH1, '🖥️ Compartilhe a Tela');

        if (hasCam) this.drawAdjustedCam(this.rawCam, 0, splitH1, W, splitH2);
        else this.drawEmptyState(0, splitH1, W, splitH2, '📷 Câmera Web');

        if (StudioState.dividerColor !== 'transparent') {
          ctx.fillStyle = StudioState.dividerColor;
          ctx.fillRect(0, splitH1 - 3, W, 6);
        }
        break;

      case 'split-horizontal':
        const splitW1 = Math.round(W * StudioState.splitRatio);
        const splitW2 = W - splitW1;

        if (hasCam) this.drawAdjustedCam(this.rawCam, 0, 0, splitW1, H);
        else this.drawEmptyState(0, 0, splitW1, H, '📷 Câmera');

        if (hasScreen) this.drawScreenCover(this.rawScreen, splitW1, 0, splitW2, H);
        else this.drawEmptyState(splitW1, 0, splitW2, H, '🖥️ Tela');

        if (StudioState.dividerColor !== 'transparent') {
          ctx.fillStyle = StudioState.dividerColor;
          ctx.fillRect(splitW1 - 3, 0, 6, H);
        }
        break;

      case 'pip-circle':
        if (hasScreen) this.drawScreenCover(this.rawScreen, 0, 0, W, H);
        else this.drawEmptyState(0, 0, W, H, '🖥️ Compartilhe a Tela de Fundo');

        if (hasCam) {
          const size = Math.min(W, H) * StudioState.pipSize;
          const px = W - size - 40;
          const py = H - size - 40;

          ctx.save();
          ctx.beginPath();
          ctx.arc(px + size / 2, py + size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          this.drawAdjustedCam(this.rawCam, px, py, size, size);
          ctx.restore();

          ctx.beginPath();
          ctx.arc(px + size / 2, py + size / 2, (size / 2) + 2, 0, Math.PI * 2);
          ctx.lineWidth = 8;
          ctx.strokeStyle = StudioState.dividerColor !== 'transparent' ? StudioState.dividerColor : '#f97316';
          ctx.stroke();
        }
        break;

      case 'cam-only':
        if (hasCam) this.drawAdjustedCam(this.rawCam, 0, 0, W, H);
        else this.drawEmptyState(0, 0, W, H, '📷 Câmera Desativada');
        break;

      case 'screen-only':
        if (hasScreen) this.drawScreenCover(this.rawScreen, 0, 0, W, H);
        else this.drawEmptyState(0, 0, W, H, '🖥️ Tela Desativada');
        break;
    }

    // ── CENTRAL SPLIT BANNER (NOME DO QUADRO) ──
    const bannerTextInput = document.getElementById('bannerTextInput');
    const bannerText = bannerTextInput ? bannerTextInput.value.trim() : StudioState.bannerText;
    if (bannerText && (StudioState.currentLayout === 'split-vertical' || StudioState.currentLayout === 'split-vertical-inv')) {
      const centerY = splitH1;
      ctx.save();
      ctx.font = '900 28px Outfit, sans-serif';
      const textMetrics = ctx.measureText(bannerText);
      const textWidth = textMetrics.width;
      const badgeW = textWidth + 60;
      const badgeH = 58;
      const badgeX = (W - badgeW) / 2;
      const badgeY = centerY - (badgeH / 2);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = '#06080f';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 29);
      ctx.fill();

      const strokeColor = StudioState.dividerColor !== 'transparent' ? StudioState.dividerColor : '#f97316';
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bannerText, W / 2, centerY + 1);
      ctx.restore();
    }

    // ── BRAND WATERMARK BADGE (INSTAGRAM @CLEBIOZ - CLEAN & ELEGANTE) ──
    const badgeW = 165;
    const badgeH = 42;
    const badgeX = W - badgeW - 24;
    const badgeY = 24;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 9, 14, 0.72)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 21);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const iconX = badgeX + 14;
    const iconY = badgeY + 11;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, 20, 20, 5.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(iconX + 10, iconY + 10, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(iconX + 15.2, iconY + 4.8, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('@clebioz', badgeX + 44, badgeY + 22);
    ctx.restore();

    requestAnimationFrame(this.render);
  }

  initMouseControls() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickYRatio = (e.clientY - rect.top) / rect.height;

      if ((StudioState.currentLayout === 'split-vertical' || StudioState.currentLayout === 'split-vertical-inv') &&
          Math.abs(clickYRatio - StudioState.splitRatio) < 0.04) {
        this.canvas.style.cursor = 'ns-resize';
      } else if (!this.isDragging) {
        this.canvas.style.cursor = 'grab';
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickYRatio = (e.clientY - rect.top) / rect.height;
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      if ((StudioState.currentLayout === 'split-vertical' || StudioState.currentLayout === 'split-vertical-inv') &&
          Math.abs(clickYRatio - StudioState.splitRatio) < 0.04) {
        this.dragTarget = 'divider';
        this.canvas.style.cursor = 'ns-resize';
        return;
      }

      this.canvas.style.cursor = 'grabbing';

      if (StudioState.currentLayout === 'split-vertical') {
        if (clickYRatio < StudioState.splitRatio) {
          this.dragTarget = 'cam';
          this.initialPanX = StudioState.camPanX;
          this.initialPanY = StudioState.camPanY;
        } else {
          this.dragTarget = 'screen';
          this.initialPanX = StudioState.screenPanX;
          this.initialPanY = StudioState.screenPanY;
        }
      } else if (StudioState.currentLayout === 'split-vertical-inv') {
        if (clickYRatio < StudioState.splitRatio) {
          this.dragTarget = 'screen';
          this.initialPanX = StudioState.screenPanX;
          this.initialPanY = StudioState.screenPanY;
        } else {
          this.dragTarget = 'cam';
          this.initialPanX = StudioState.camPanX;
          this.initialPanY = StudioState.camPanY;
        }
      } else {
        this.dragTarget = clickYRatio < 0.5 ? 'cam' : 'screen';
        this.initialPanX = StudioState.screenPanX;
        this.initialPanY = StudioState.screenPanY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      if (this.dragTarget === 'divider') {
        const rect = this.canvas.getBoundingClientRect();
        const newRatio = Math.max(0.25, Math.min(0.75, (e.clientY - rect.top) / rect.height));
        StudioState.splitRatio = newRatio;
        const splitRatioSlider = document.getElementById('splitRatioSlider');
        const splitRatioVal = document.getElementById('splitRatioVal');
        if (splitRatioSlider) {
          const percent = Math.round(newRatio * 100);
          splitRatioSlider.value = percent;
          splitRatioVal.innerText = `${percent}/${100 - percent}`;
        }
        return;
      }

      const deltaX = (e.clientX - this.dragStartX) / 400;
      const deltaY = (e.clientY - this.dragStartY) / 400;

      if (this.dragTarget === 'cam') {
        StudioState.camPanX = Math.max(0, Math.min(1, this.initialPanX - deltaX));
        StudioState.camPanY = Math.max(0, Math.min(1, this.initialPanY - deltaY));
        const camPanYSlider = document.getElementById('camPanYSlider');
        const camPanYVal = document.getElementById('camPanYVal');
        if (camPanYSlider) {
          camPanYSlider.value = Math.round(StudioState.camPanY * 100);
          camPanYVal.innerText = camPanYSlider.value + '%';
        }
      } else if (this.dragTarget === 'screen') {
        StudioState.screenPanX = Math.max(0, Math.min(1, this.initialPanX - deltaX));
        StudioState.screenPanY = Math.max(0, Math.min(1, this.initialPanY - deltaY));
        const screenPanXSlider = document.getElementById('screenPanXSlider');
        const screenPanXVal = document.getElementById('screenPanXVal');
        const screenPanYSlider = document.getElementById('screenPanYSlider');
        const screenPanYVal = document.getElementById('screenPanYVal');
        if (screenPanXSlider) {
          screenPanXSlider.value = Math.round(StudioState.screenPanX * 100);
          screenPanXVal.innerText = screenPanXSlider.value + '%';
        }
        if (screenPanYSlider) {
          screenPanYSlider.value = Math.round(StudioState.screenPanY * 100);
          screenPanYVal.innerText = screenPanYSlider.value + '%';
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const clickYRatio = (e.clientY - rect.top) / rect.height;
      const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;

      if (StudioState.currentLayout === 'split-vertical') {
        if (clickYRatio < StudioState.splitRatio) {
          StudioState.camZoom = Math.max(1.0, Math.min(2.5, StudioState.camZoom + zoomDelta));
          const slider = document.getElementById('camZoomSlider');
          const val = document.getElementById('camZoomVal');
          if (slider) { slider.value = StudioState.camZoom; val.innerText = StudioState.camZoom.toFixed(2) + 'x'; }
        } else {
          StudioState.screenZoom = Math.max(1.0, Math.min(3.0, StudioState.screenZoom + zoomDelta));
          const slider = document.getElementById('screenZoomSlider');
          const val = document.getElementById('screenZoomVal');
          if (slider) { slider.value = StudioState.screenZoom; val.innerText = StudioState.screenZoom.toFixed(2) + 'x'; }
        }
      } else if (StudioState.currentLayout === 'split-vertical-inv') {
        if (clickYRatio < StudioState.splitRatio) {
          StudioState.screenZoom = Math.max(1.0, Math.min(3.0, StudioState.screenZoom + zoomDelta));
          const slider = document.getElementById('screenZoomSlider');
          const val = document.getElementById('screenZoomVal');
          if (slider) { slider.value = StudioState.screenZoom; val.innerText = StudioState.screenZoom.toFixed(2) + 'x'; }
        } else {
          StudioState.camZoom = Math.max(1.0, Math.min(2.5, StudioState.camZoom + zoomDelta));
          const slider = document.getElementById('camZoomSlider');
          const val = document.getElementById('camZoomVal');
          if (slider) { slider.value = StudioState.camZoom; val.innerText = StudioState.camZoom.toFixed(2) + 'x'; }
        }
      } else {
        StudioState.screenZoom = Math.max(1.0, Math.min(3.0, StudioState.screenZoom + zoomDelta));
        const slider = document.getElementById('screenZoomSlider');
        const val = document.getElementById('screenZoomVal');
        if (slider) { slider.value = StudioState.screenZoom; val.innerText = StudioState.screenZoom.toFixed(2) + 'x'; }
      }
    }, { passive: false });

    this.canvas.addEventListener('dblclick', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickYRatio = (e.clientY - rect.top) / rect.height;

      if (clickYRatio < StudioState.splitRatio) {
        StudioState.camZoom = 1.0;
        StudioState.camPanX = 0.5;
        StudioState.camPanY = 0.5;
        const camZoomSlider = document.getElementById('camZoomSlider');
        const camPanYSlider = document.getElementById('camPanYSlider');
        if (camZoomSlider) { camZoomSlider.value = 1.0; document.getElementById('camZoomVal').innerText = '1.0x'; }
        if (camPanYSlider) { camPanYSlider.value = 50; document.getElementById('camPanYVal').innerText = '50%'; }
      } else {
        StudioState.screenZoom = 1.0;
        StudioState.screenPanX = 0.5;
        StudioState.screenPanY = 0.5;
        const screenZoomSlider = document.getElementById('screenZoomSlider');
        const screenPanXSlider = document.getElementById('screenPanXSlider');
        const screenPanYSlider = document.getElementById('screenPanYSlider');
        if (screenZoomSlider) { screenZoomSlider.value = 1.0; document.getElementById('screenZoomVal').innerText = '1.0x'; }
        if (screenPanXSlider) { screenPanXSlider.value = 50; document.getElementById('screenPanXVal').innerText = '50%'; }
        if (screenPanYSlider) { screenPanYSlider.value = 50; document.getElementById('screenPanYVal').innerText = '50%'; }
      }
    });
  }
}
