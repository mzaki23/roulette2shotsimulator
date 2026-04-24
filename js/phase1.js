    /* ============================================================
       PHASE 1 — INIT
       ============================================================ */
    function initPhase1() {
      // Sync inline badge pill (inside p1-body)
      const badgeText = state.selectedSetlist || '—';
      const p1Pill = document.getElementById('p1BadgePill');
      if (p1Pill) p1Pill.textContent = badgeText;

      // Reset phase state
      state.userNumber    = null;

      // Reset stats display
      document.getElementById('p1StatNomor').textContent = '—';
      document.getElementById('p1StatTotal').textContent = '—';

      // Update subtitle with total peserta
      const descEl = document.getElementById('p1TitleDesc');
      if (descEl) descEl.textContent = `Pilih 1 dari ${state.totalPeserta} nomor untuk masuk ke undian 2Shot`;

      // Disable roulette button
      setRouletteBtn(false);

      // Build grid
      buildNumberGrid();

      // Scroll content back to top
      const body = document.getElementById('p1Body');
      if (body) body.scrollTop = 0;
    }

    /* ============================================================
       PHASE 1 — BUILD GRID
       ============================================================ */
    function buildNumberGrid() {
      const grid  = document.getElementById('p1NumberGrid');
      const total = state.totalPeserta || 100;
      grid.innerHTML = '';

      for (let i = 1; i <= total; i++) {
        const tile = document.createElement('button');
        tile.className     = 'num-tile';
        tile.textContent   = i;
        tile.dataset.num   = i;
        tile.setAttribute('aria-label', `Nomor ${i}`);
        // Each tile gets its own stagger delay
        tile.style.animationDelay = `${(i - 1) * 5}ms`;
        tile.addEventListener('click', () => selectNumber(i));
        grid.appendChild(tile);
      }

      // Kick off stagger animation after two frames (ensures initial
      // opacity:0 / scale(0.7) is painted before animation starts)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          grid.querySelectorAll('.num-tile').forEach(t => t.classList.add('tile-enter'));
        });
      });
    }

    /* ============================================================
       PHASE 1 — SELECT NUMBER
       ============================================================ */
    function selectNumber(num) {
      // Deselect previous tile
      const prev = document.querySelector('.num-tile.selected');
      if (prev) prev.classList.remove('selected');

      // Select new tile
      const tile = document.querySelector(`.num-tile[data-num="${num}"]`);
      if (tile) {
        tile.classList.add('selected');
        // Scroll tile into view within grid container
        tile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      state.userNumber = num;

      // totalPeserta is already set by config screen; no override needed

      updatePhase1Stats();
      setRouletteBtn(true);
    }

    /* ============================================================
       PHASE 1 — RANDOM PICK
       ============================================================ */
    function randomPickNumber() {
      const total = state.totalPeserta || 100;
      const num = Math.floor(Math.random() * total) + 1;
      selectNumber(num);
    }

    /* ============================================================
       PHASE 1 — UPDATE STATS
       ============================================================ */
    function updatePhase1Stats() {
      document.getElementById('p1StatNomor').textContent =
        state.userNumber ? String(state.userNumber).padStart(2, '0') : '—';
      document.getElementById('p1StatTotal').textContent =
        state.totalPeserta ? state.totalPeserta.toLocaleString('id-ID') : '—';
    }

    /* ============================================================
       PHASE 1 — TOGGLE ROULETTE BUTTON
       ============================================================ */
    function setRouletteBtn(enabled) {
      const btn = document.getElementById('btnRoulette');
      if (enabled) {
        btn.disabled = false;
        btn.classList.add('enabled');
      } else {
        btn.disabled = true;
        btn.classList.remove('enabled');
      }
    }

    /* ============================================================
       PHASE 1 — START ROULETTE
       ============================================================ */
    function startRoulette() {
      if (!state.userNumber) return;
      navigateTo('phase2');
    }
