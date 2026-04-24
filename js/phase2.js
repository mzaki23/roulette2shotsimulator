    /* ============================================================
       PHASE 2 — MODULE STATE
       ============================================================ */
    let p2IsSpinning    = false;
    let p2SpinAllActive = false;
    let p2SpinInterval  = null;

    /* ============================================================
       PHASE 2 — INIT
       ============================================================ */
    function initPhase2() {
      state.calledNumbers = [];
      state.userCalled    = false;
      p2IsSpinning        = false;
      p2SpinAllActive     = false;

      document.getElementById('p2StatUserNum').textContent =
        state.userNumber != null ? String(state.userNumber).padStart(2, '0') : '—';
      document.getElementById('p2StatCalled').textContent = '0/48';

      const statusEl = document.getElementById('p2StatStatus');
      statusEl.textContent  = '⏳';
      statusEl.style.color  = '';

      const numEl  = document.getElementById('p2Num');
      const circle = document.getElementById('p2Circle');
      numEl.textContent = '—';
      numEl.classList.remove('gold', 'tick-pop');
      circle.classList.remove('gold-pulse');

      document.getElementById('p2ProgressFill').style.width   = '0%';
      document.getElementById('p2ProgressLabel').textContent  = '0 / 48 terpanggil';
      document.getElementById('p2ProgressPct').textContent    = '0%';

      document.getElementById('p2Pills').innerHTML =
        '<span style="font-size:12px;color:var(--outline);font-style:italic;">Belum ada nomor terpanggil</span>';

      document.getElementById('p2Banner').classList.remove('visible');
      document.getElementById('btnLanjut').classList.remove('visible');

      setP2Btns(true);
    }

    /* ============================================================
       PHASE 2 — BUTTON STATE
       ============================================================ */
    function setP2Btns(enabled) {
      document.getElementById('btnPutarSatu').disabled  = !enabled;
      document.getElementById('btnPutarSemua').disabled = !enabled;
    }

    /* ============================================================
       PHASE 2 — BUILD POOL OF UNCALLED NUMBERS
       ============================================================ */
    function p2GetPool() {
      const total  = state.totalPeserta || 100;
      const called = new Set(state.calledNumbers);
      const pool   = [];
      for (let i = 1; i <= total; i++) {
        if (!called.has(i)) pool.push(i);
      }
      return pool;
    }

    /* ============================================================
       PHASE 2 — SPIN ONE
       ============================================================ */
    function spinOne() {
      if (p2IsSpinning || p2SpinAllActive) return;
      if (state.calledNumbers.length >= 48) return;
      const pool = p2GetPool();
      if (!pool.length) return;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      p2DoSpin(chosen, false, () => p2Land(chosen));
    }

    /* ============================================================
       PHASE 2 — SPIN ALL
       ============================================================ */
    function spinAll() {
      if (p2IsSpinning || p2SpinAllActive) return;
      if (state.calledNumbers.length >= 48) return;
      p2SpinAllActive = true;
      setP2Btns(false);

      function next() {
        if (!p2SpinAllActive || state.calledNumbers.length >= 48) {
          p2SpinAllActive = false;
          checkP2Complete();
          return;
        }
        const pool = p2GetPool();
        if (!pool.length) { p2SpinAllActive = false; checkP2Complete(); return; }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        p2DoSpin(chosen, true, () => {
          p2Land(chosen);
          if (p2SpinAllActive && state.calledNumbers.length < 48) {
            setTimeout(next, 120);
          } else {
            p2SpinAllActive = false;
            checkP2Complete();
          }
        });
      }

      next();
    }

    /* ============================================================
       PHASE 2 — SPIN ANIMATION
       fast = true → fewer ticks (for spinAll)
       ============================================================ */
    function p2DoSpin(chosen, fast, onDone) {
      p2IsSpinning = true;
      const numEl     = document.getElementById('p2Num');
      const TICKS     = fast ? 6 : 14;
      const TICK_MS   = fast ? 42 : 55;
      const total     = state.totalPeserta || 100;
      const calledSet = new Set(state.calledNumbers);
      calledSet.add(chosen); // keep chosen out of cycling display

      let tick = 0;
      p2SpinInterval = setInterval(() => {
        tick++;
        if (tick >= TICKS) {
          clearInterval(p2SpinInterval);
          p2SpinInterval = null;
          p2IsSpinning = false;
          numEl.textContent = String(chosen);
          numEl.classList.remove('tick-pop');
          void numEl.offsetWidth;
          numEl.classList.add('tick-pop');
          onDone();
          return;
        }
        // Rapid cycling: pick random number not yet called
        let rnd = Math.floor(Math.random() * total) + 1;
        for (let a = 0; a < 12 && calledSet.has(rnd); a++) {
          rnd = Math.floor(Math.random() * total) + 1;
        }
        numEl.textContent = String(rnd);
        numEl.classList.remove('tick-pop');
        void numEl.offsetWidth;
        numEl.classList.add('tick-pop');
      }, TICK_MS);
    }

    /* ============================================================
       PHASE 2 — LAND A NUMBER
       ============================================================ */
    function p2Land(num) {
      state.calledNumbers.push(num);

      if (num === state.userNumber && !state.userCalled) {
        state.userCalled = true;
        document.getElementById('p2Num').classList.add('gold');
        document.getElementById('p2Circle').classList.add('gold-pulse');
        document.getElementById('p2Banner').classList.add('visible');
        const statusEl = document.getElementById('p2StatStatus');
        statusEl.textContent = '✅';
        statusEl.style.color = 'var(--tertiary)';
      }

      updateP2UI();
      if (!p2SpinAllActive) checkP2Complete();
    }

    /* ============================================================
       PHASE 2 — UPDATE UI
       ============================================================ */
    function updateP2UI() {
      const count = state.calledNumbers.length;

      document.getElementById('p2StatCalled').textContent = `${count}/48`;

      const pct = Math.min(Math.round((count / 48) * 100), 100);
      document.getElementById('p2ProgressFill').style.width  = `${pct}%`;
      document.getElementById('p2ProgressLabel').textContent = `${count} / 48 terpanggil`;
      document.getElementById('p2ProgressPct').textContent   = `${pct}%`;

      const container = document.getElementById('p2Pills');
      container.innerHTML = '';
      state.calledNumbers.forEach((num, i) => {
        const pill = document.createElement('span');
        pill.className = 'p2-pill';
        if (i === state.calledNumbers.length - 1) pill.classList.add('latest');
        if (num === state.userNumber) pill.classList.add('is-user');
        pill.textContent = String(num).padStart(2, '0');
        container.appendChild(pill);
      });
      container.scrollTop = container.scrollHeight;
    }

    /* ============================================================
       PHASE 2 — CHECK COMPLETION
       ============================================================ */
    function checkP2Complete() {
      if (state.calledNumbers.length < 48) return;
      setP2Btns(false);
      if (state.userCalled) {
        document.getElementById('btnLanjut').classList.add('visible');
      } else {
        const statusEl = document.getElementById('p2StatStatus');
        statusEl.textContent = '❌';
        statusEl.style.color = 'var(--error, #ffb4ab)';
        setTimeout(() => navigateTo('unlucky'), 1500);
      }
    }
