    /* ============================================================
       APP STATE
       ============================================================ */
    const state = {
      currentScreen:   'setup',
      selectedTeam:    null,
      selectedSetlist: null,
      selectedMembers: [],   // 12 random members
      userNumber:      null,
      totalPeserta:    100,  // set by config screen
      calledNumbers:   [],
      userCalled:      false,
      groups:          [],   // 12 groups of 4 member names
      groupOrder:      [],   // randomised display order (indices 0–11)
      groupResults:    {},   // { groupIdx: memberName }
      userGroupIndex:  null,
      selectedMember:  null,
      photoSide:       null, // 'left' | 'right'
    };

    /* ============================================================
       UTILITIES
       ============================================================ */
    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function pickRandom(arr, n) {
      return shuffle(arr).slice(0, n);
    }

    /* ============================================================
       SCREEN ENTER HOOKS
       ============================================================ */
    const ON_SCREEN_ENTER = {
      setup:  initSetup,
      config: initConfig,
      phase1: initPhase1,
      phase2: initPhase2,
      phase3: initPhase3,
      result: initResult,
      photo:  initPhoto,
    };

    /* ============================================================
       NAVIGATION
       ============================================================ */
    async function loadScreenHtml(key) {
      const existingEl = document.getElementById(SCREEN_IDS[key]);
      if (existingEl) return existingEl;

      try {
        const res = await fetch(`./screens/${key}.html`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const html = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = html.trim();
        const screenEl = temp.firstElementChild; 
        document.getElementById('app').appendChild(screenEl);
        return screenEl;
      } catch (e) {
        console.error('Failed to load screen:', key, e);
        return null;
      }
    }

    async function navigateTo(key) {
      if (state.currentScreen === key && document.getElementById(SCREEN_IDS[key])) return;

      // Stop camera when leaving photo screen
      if (state.currentScreen === 'photo' && typeof stopPhotoCamera === 'function') stopPhotoCamera();

      const nextEl = await loadScreenHtml(key);
      if (!nextEl) return;

      const currEl = document.querySelector('.screen.active');

      if (currEl && currEl.id !== SCREEN_IDS[key]) {
        currEl.classList.add('leaving');
        setTimeout(() => currEl.classList.remove('active', 'leaving'), 350);
      }

      const delay = (currEl && currEl.id !== SCREEN_IDS[key]) ? 260 : 0;
      setTimeout(() => {
        nextEl.classList.add('active');
        state.currentScreen = key;

        // Re-render navbar and footer for the incoming screen
        const setlistName = state.selectedSetlist || '—';
        const showBadge   = key !== 'setup';
        let customRight;
        if (key === 'config') {
          customRight = `<button class="icon-btn" onclick="navigateTo('setup')" aria-label="Kembali"><span class="icon">arrow_back</span></button>`;
        } else if (key === 'photo') {
          customRight = `
            <button class="icon-btn" id="btnCameraSettings" onclick="openCameraSettings()" aria-label="Pengaturan Kamera"><span class="icon">settings</span></button>
            <button class="icon-btn" onclick="navigateTo('result')" aria-label="Kembali"><span class="icon">arrow_back</span></button>`;
        }
        mountNavbarFooter(nextEl, setlistName, showBadge, customRight);

        if (ON_SCREEN_ENTER[key]) ON_SCREEN_ENTER[key]();
      }, delay);
    }

    /* ============================================================
       SETUP — SELECT SETLIST
       ============================================================ */
    function selectSetlist(cardEl, team) {
      // Deselect all
      document.querySelectorAll('.setlist-card').forEach(c => c.classList.remove('selected'));

      // Select clicked card
      cardEl.classList.add('selected');
      state.selectedTeam    = team;
      state.selectedSetlist = SETLIST_LABELS[team];

      // Reveal roster
      renderRoster(team);

      // Enable start button
      const btn  = document.getElementById('btnStart');
      const hint = document.getElementById('btnHint');
      btn.disabled = false;
      btn.classList.add('enabled');
      hint.classList.add('hidden');
    }

    /* ============================================================
       SETUP — RENDER ROSTER
       ============================================================ */
    function renderRoster(team) {
      const roster  = ROSTERS[team];
      const grid    = document.getElementById('rosterGrid');
      const title   = document.getElementById('rosterTitle');
      const meta    = document.getElementById('rosterMeta');
      const section = document.getElementById('rosterSection');

      title.textContent = `Member ${SETLIST_LABELS[team]}`;
      meta.textContent  = `${roster.length} members`;

      grid.innerHTML = '';

      roster.forEach((name, i) => {
        const pill = document.createElement('div');
        pill.className   = 'member-pill';
        pill.textContent = name;
        grid.appendChild(pill);

        // Staggered animate-in
        setTimeout(() => pill.classList.add('in'), i * 40);
      });

      // Show section
      section.classList.add('visible');
    }

    /* ============================================================
       SETUP — START SIMULATION
       ============================================================ */
    function startSimulation() {
      if (!state.selectedTeam) return;

      // Pick 12 random members from roster
      state.selectedMembers = pickRandom(ROSTERS[state.selectedTeam], 12);

      navigateTo('config'); // config screen → user sets total peserta
    }

    /* ============================================================
       CONFIG SCREEN — MODULE STATE
       ============================================================ */
    const STEPPER_MIN = 49;
    const STEPPER_MAX = 999;
    let   stepperVal  = 100;

    /* ============================================================
       CONFIG SCREEN — INIT
       ============================================================ */
    function initConfig() {
      stepperVal = 100;
      renderStepper();
      updateConfigPresets();
    }

    /* ============================================================
       CONFIG SCREEN — STEPPER
       ============================================================ */
    function stepperChange(delta) {
      // Allow big jumps: shift/ctrl held → ±10
      stepperVal = Math.min(STEPPER_MAX, Math.max(STEPPER_MIN, stepperVal + delta));
      renderStepper();
      updateConfigPresets();
    }

    function setStepperValue(val) {
      stepperVal = Math.min(STEPPER_MAX, Math.max(STEPPER_MIN, val));
      renderStepper();
      updateConfigPresets();
    }

    function renderStepper() {
      const valEl = document.getElementById('stepperValue');
      const maxEl = document.getElementById('configMaxLabel');
      const minusBtn = document.getElementById('stepperMinus');
      if (valEl) valEl.textContent = stepperVal;
      if (maxEl) maxEl.textContent = stepperVal;
      if (minusBtn) minusBtn.disabled = (stepperVal <= STEPPER_MIN);
    }

    function updateConfigPresets() {
      document.querySelectorAll('.config-preset-btn').forEach(btn => {
        const v = parseInt(btn.dataset.val, 10);
        btn.classList.toggle('active', v === stepperVal);
      });
    }

    /* ============================================================
       CONFIG SCREEN — CONFIRM
       ============================================================ */
    function confirmConfig() {
      state.totalPeserta = stepperVal;
      navigateTo('phase1');
    }

    /* ============================================================
       SETUP SCREEN — INIT (Keyboard support etc)
       ============================================================ */
    function initSetup() {
      document.querySelectorAll('.setlist-card').forEach(card => {
        // Prevent adding multiple listeners if initSetup is called again
        if (!card.dataset.hasListener) {
          card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              card.click();
            }
          });
          card.dataset.hasListener = "true";
        }
      });
    }

    /* ============================================================
       UNLUCKY — RESET AND RETRY
       ============================================================ */
    function resetAndRetry() {
      // Cancel any ongoing timers / media
      if (p2SpinInterval)  { clearInterval(p2SpinInterval);  p2SpinInterval  = null; }
      if (photoCountdown)  { clearInterval(photoCountdown);  photoCountdown  = null; }
      stopPhotoCamera();

      // Full state wipe
      state.selectedTeam     = null;
      state.selectedSetlist  = null;
      state.selectedMembers  = [];
      state.userNumber       = null;
      state.totalPeserta     = 100;
      state.calledNumbers    = [];
      state.userCalled       = false;
      state.groups           = [];
      state.groupOrder       = [];
      state.groupResults     = {};
      state.userGroupIndex   = null;
      state.selectedMember   = null;
      state.photoSide        = null;

      // Reset Phase 2 module flags
      p2IsSpinning    = false;
      p2SpinAllActive = false;

      // Reset Phase 3 module state
      p3CurrentStep      = 0;
      p3AvailableMembers = [];
      p3WheelMembers     = [];
      p3TotalDeg         = 0;
      p3IsSpinning       = false;

      // Reset Setup screen UI back to pristine state
      document.querySelectorAll('.setlist-card').forEach(c => c.classList.remove('selected'));
      const btnStart = document.getElementById('btnStart');
      btnStart.disabled = true;
      btnStart.classList.remove('enabled');
      document.getElementById('btnHint').classList.remove('hidden');
      document.getElementById('rosterSection').classList.remove('visible');
      document.getElementById('rosterGrid').innerHTML = '';

      navigateTo('setup');
    }

    /* ============================================================
       INITIAL RENDER
       ============================================================ */
    document.addEventListener('DOMContentLoaded', () => {
      navigateTo('setup');
    });