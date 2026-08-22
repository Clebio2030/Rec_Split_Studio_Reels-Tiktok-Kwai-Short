/**
 * Cs Digital Z Studio - Teleprompter & Custom Script Builder
 */
import { StudioState, saveStoredScripts } from './state.js';

export class StudioPrompter {
  constructor() {
    this.scriptSelector = document.getElementById('scriptSelector');
    this.prompterTextBody = document.getElementById('prompterTextBody');
    this.prompterScrollBox = document.getElementById('prompterScrollBox');
    this.btnPrompterToggle = document.getElementById('btnPrompterToggle');
    this.btnPrompterTop = document.getElementById('btnPrompterTop');
    this.prompterSpeed = document.getElementById('prompterSpeed');
    this.prompterFontSize = document.getElementById('prompterFontSize');

    this.mainLayout = document.getElementById('mainLayout');
    this.btnTogglePrompterView = document.getElementById('btnTogglePrompterView');
    this.btnClosePrompter = document.getElementById('btnClosePrompter');

    this.modalNewScript = document.getElementById('modalNewScript');
    this.btnOpenNewScriptModal = document.getElementById('btnOpenNewScriptModal');
    this.btnCloseScriptModal = document.getElementById('btnCloseScriptModal');
    this.btnSaveNewScript = document.getElementById('btnSaveNewScript');

    this.init();
  }

  init() {
    this.refreshSelector('2');

    this.scriptSelector.addEventListener('change', (e) => {
      this.renderScript(e.target.value);
    });

    this.btnPrompterToggle.addEventListener('click', () => {
      StudioState.isPrompterScrolling = !StudioState.isPrompterScrolling;
      if (StudioState.isPrompterScrolling) {
        this.btnPrompterToggle.innerHTML = '⏸️ Pausar';
        this.startAutoScroll();
      } else {
        this.btnPrompterToggle.innerHTML = '▶️ Rolar';
        clearInterval(StudioState.prompterScrollTimer);
      }
    });

    this.btnPrompterTop.addEventListener('click', () => {
      this.prompterScrollBox.scrollTop = 0;
    });

    this.prompterFontSize.addEventListener('input', (e) => {
      this.prompterTextBody.style.fontSize = e.target.value + 'px';
    });

    // Open / Close Prompter Panel
    this.btnTogglePrompterView.addEventListener('click', () => this.togglePanel());
    this.btnClosePrompter.addEventListener('click', () => this.togglePanel(false));

    // Restore saved visibility
    if (localStorage.getItem('csdigital_show_prompter') === 'false') {
      this.togglePanel(false);
    }

    // Modal New Script
    this.btnOpenNewScriptModal.addEventListener('click', () => {
      this.modalNewScript.classList.add('active');
    });

    this.btnCloseScriptModal.addEventListener('click', () => {
      this.modalNewScript.classList.remove('active');
    });

    this.btnSaveNewScript.addEventListener('click', () => this.saveNewScript());
  }

  refreshSelector(selectedId = '2') {
    this.scriptSelector.innerHTML = StudioState.allScripts.map(s => 
      `<option value="${s.id}">${s.titulo}</option>`
    ).join('');
    this.scriptSelector.value = selectedId;
    this.renderScript(selectedId);
  }

  renderScript(id) {
    const s = StudioState.allScripts.find(x => x.id === id) || StudioState.allScripts[0];
    if (!s) return;
    this.prompterTextBody.innerHTML = `
      <div class="script-block block-hook">
        <span class="block-badge badge-hook">🎣 Gancho (0 a 3s)</span>
        <p><strong>"${s.hook}"</strong></p>
      </div>
      <div class="script-block block-data">
        <span class="block-badge badge-data">📊 Dado / Autoridade</span>
        <p>"${s.dado}"</p>
      </div>
      <div class="script-block block-sol">
        <span class="block-badge badge-sol">💡 Solução ZapRun</span>
        <p>"${s.solucao}"</p>
      </div>
      <div class="script-block block-cta">
        <span class="block-badge badge-cta">🎯 Chamada para Ação</span>
        <p><strong>"${s.cta}"</strong></p>
      </div>
    `;
    this.prompterScrollBox.scrollTop = 0;
  }

  startAutoScroll() {
    clearInterval(StudioState.prompterScrollTimer);
    StudioState.prompterScrollTimer = setInterval(() => {
      const speed = parseInt(this.prompterSpeed.value, 10);
      this.prompterScrollBox.scrollTop += speed * 0.9;
    }, 30);
  }

  togglePanel(show) {
    if (show === undefined) {
      this.mainLayout.classList.toggle('no-prompter');
    } else if (show) {
      this.mainLayout.classList.remove('no-prompter');
    } else {
      this.mainLayout.classList.add('no-prompter');
    }
    const isHidden = this.mainLayout.classList.contains('no-prompter');
    this.btnTogglePrompterView.style.background = isHidden ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.06)';
    this.btnTogglePrompterView.style.borderColor = isHidden ? 'var(--primary)' : 'var(--border-subtle)';
    this.btnTogglePrompterView.querySelector('span').innerText = isHidden ? '📜 Mostrar Roteiro' : '📜 Roteiro';
    localStorage.setItem('csdigital_show_prompter', isHidden ? 'false' : 'true');
  }

  saveNewScript() {
    const title = document.getElementById('newScriptTitle').value.trim();
    const hook = document.getElementById('newScriptHook').value.trim();
    const dado = document.getElementById('newScriptData').value.trim();
    const sol = document.getElementById('newScriptSol').value.trim();
    const cta = document.getElementById('newScriptCta').value.trim();

    if (!title || !hook) {
      alert('Por favor, preencha pelo menos o título e o gancho.');
      return;
    }

    const newId = String(Date.now());
    StudioState.allScripts.push({ id: newId, titulo: title, hook, dado, solucao: sol, cta });
    saveStoredScripts(StudioState.allScripts);
    this.modalNewScript.classList.remove('active');
    this.refreshSelector(newId);
  }
}
