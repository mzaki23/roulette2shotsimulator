    /* ============================================================
       PHASE 3 — MODULE STATE
       ============================================================ */
    let p3CurrentStep      = 0;
    let p3AvailableMembers = [];
    let p3WheelMembers     = [];
    let p3TotalDeg         = 0;
    let p3IsSpinning       = false;
    let p3AutoMode         = false;

    const P3_COLORS = [
      '#ff4e78','#ffdb3c','#62de86','#1ca655',
      '#ffb2bc','#e9c400','#7ffba0','#bd0047',
      '#ff8fab','#ffd166','#06d6a0','#ef233c',
    ];

    /* ============================================================
       PHASE 3 — INIT
       ============================================================ */
    function initPhase3() {
      p3CurrentStep      = 0;
      p3TotalDeg         = 0;
      p3IsSpinning       = false;
      p3AutoMode         = false;
      p3AvailableMembers = [...state.selectedMembers];

      // Build 12 fan groups from calledNumbers (chunks of 4)
      state.groups = [];
      const nums = [...(state.calledNumbers || [])];
      while (nums.length < 48) nums.push(0);
      for (let i = 0; i < 12; i++) state.groups.push(nums.slice(i * 4, i * 4 + 4));

      state.groupOrder   = shuffle([...Array(12).keys()]);
      state.groupResults = {};

      // Find user's group
      state.userGroupIndex = null;
      for (let i = 0; i < state.groups.length; i++) {
        if (state.userNumber && state.groups[i].includes(state.userNumber)) {
          state.userGroupIndex = i;
          break;
        }
      }
      if (state.userGroupIndex === null) {
        state.userGroupIndex = state.groupOrder[Math.floor(Math.random() * 12)];
      }

      // Reset spinner without transition
      const spinner = document.getElementById('p3WheelSpinner');
      if (spinner) { spinner.style.transition = 'none'; spinner.style.transform = 'rotate(0deg)'; }

      renderP3Groups();
      loadP3Group(state.groupOrder[0]);
      updateAutoBtn();
    }

    /* ============================================================
       PHASE 3 — LOAD GROUP
       ============================================================ */
    function loadP3Group(groupIdx) {
      p3WheelMembers = [...p3AvailableMembers];
      p3TotalDeg     = 0;

      const spinner = document.getElementById('p3WheelSpinner');
      spinner.style.transition = 'none';
      spinner.style.transform  = 'rotate(0deg)';

      document.getElementById('p3TurnName').textContent    = `Grup ${groupIdx + 1}`;
      document.getElementById('p3MembersLeft').textContent = `${p3WheelMembers.length} member tersisa`;
      document.getElementById('p3ResultBadge').classList.remove('visible');

      drawP3Wheel(p3WheelMembers);
      setP3Btns(p3WheelMembers.length > 0);
      renderP3Groups();
    }

    /* ============================================================
       PHASE 3 — DRAW WHEEL
       ============================================================ */
    function drawP3Wheel(members) {
      const canvas = document.getElementById('p3Canvas');
      const ctx    = canvas.getContext('2d');
      const n      = members.length;
      if (!n) return;
      const size = canvas.width;
      const cx = size / 2, cy = size / 2, r = size / 2 - 2;
      const slice = (2 * Math.PI) / n;

      ctx.clearRect(0, 0, size, size);

      for (let i = 0; i < n; i++) {
        const sa = -Math.PI / 2 + i * slice;
        const ea = sa + slice;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, sa, ea);
        ctx.closePath();
        ctx.fillStyle   = P3_COLORS[i % P3_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // Member label
        const mid = sa + slice / 2;
        const tx  = cx + Math.cos(mid) * r * 0.64;
        const ty  = cy + Math.sin(mid) * r * 0.64;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(mid + Math.PI / 2);
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(255,255,255,0.95)';
        ctx.shadowColor  = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur   = 4;
        ctx.font = `700 ${Math.max(10, Math.min(15, 190 / n))}px "Space Grotesk",sans-serif`;
        ctx.fillText(members[i], 0, 0);
        ctx.restore();
      }

      // Center hub
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
      ctx.fillStyle   = '#2c1b1d';
      ctx.fill();
      ctx.strokeStyle = '#ff4e78';
      ctx.lineWidth   = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffb2bc';
      ctx.fill();
    }

    /* ============================================================
       PHASE 3 — SPIN WHEEL (CSS rotation)
       ============================================================ */
    function spinWheel() {
      if (p3IsSpinning || !p3WheelMembers.length) return;
      p3IsSpinning = true;
      setP3Btns(false);

      const n          = p3WheelMembers.length;
      const sliceDeg   = 360 / n;
      const targetIdx  = Math.floor(Math.random() * n);

      // Segment i's center lands at pointer (top) when spinner is at:
      // X = -(targetIdx + 0.5) * sliceDeg  (mod 360)
      const targetLanding = ((-(targetIdx + 0.5) * sliceDeg) % 360 + 360) % 360;
      const currentMod    = ((p3TotalDeg % 360) + 360) % 360;
      let delta = targetLanding - currentMod;
      if (delta <= 0) delta += 360;
      const finalDeg   = p3TotalDeg + delta + (5 + Math.floor(Math.random() * 3)) * 360;
      const durationMs = 3000 + Math.random() * 2000;

      const spinner = document.getElementById('p3WheelSpinner');
      spinner.style.transition = `transform ${(durationMs / 1000).toFixed(2)}s cubic-bezier(0.1, 0.7, 0.5, 1.0)`;
      void spinner.offsetWidth; // force reflow
      spinner.style.transform  = `rotate(${finalDeg}deg)`;
      p3TotalDeg = finalDeg;

      setTimeout(() => {
        spinner.style.transition = 'none';
        p3IsSpinning = false;
        onP3WheelLand(targetIdx);
      }, durationMs + 120);
    }

    /* ============================================================
       PHASE 3 — QUICK PICK (no animation)
       ============================================================ */
    function quickPickMember() {
      if (p3IsSpinning || !p3WheelMembers.length) return;
      setP3Btns(false);
      onP3WheelLand(Math.floor(Math.random() * p3WheelMembers.length));
    }

    /* ============================================================
       PHASE 3 — ON WHEEL LAND
       ============================================================ */
    function onP3WheelLand(idx) {
      const member   = p3WheelMembers[idx];
      const groupIdx = state.groupOrder[p3CurrentStep];

      state.groupResults[groupIdx] = member;
      if (groupIdx === state.userGroupIndex) state.selectedMember = member;

      // Remove from pool
      const mi = p3AvailableMembers.indexOf(member);
      if (mi >= 0) p3AvailableMembers.splice(mi, 1);

      // Show result badge
      document.getElementById('p3ResultGroup').textContent  = `Grup ${groupIdx + 1}`;
      document.getElementById('p3ResultMember').textContent = member;
      document.getElementById('p3ResultBadge').classList.add('visible');

      renderP3Groups();
      p3CurrentStep++;

      if (p3CurrentStep >= 12) {
        p3AutoMode = false;
        updateAutoBtn();
        setTimeout(() => navigateTo('result'), 1200);
      } else {
        setTimeout(() => {
          loadP3Group(state.groupOrder[p3CurrentStep]);
          if (p3AutoMode) setTimeout(() => spinWheel(), 350);
        }, 800);
      }
    }

    /* ============================================================
       PHASE 3 — RENDER GROUP LIST
       ============================================================ */
    function renderP3Groups() {
      const list = document.getElementById('p3GroupList');
      if (!list) return;
      list.innerHTML = '';

      state.groupOrder.forEach((groupIdx, step) => {
        const isDone   = groupIdx in state.groupResults;
        const isActive = step === p3CurrentStep && !isDone;

        const card = document.createElement('div');
        card.className = 'p3-group-card' +
          (isActive ? ' active' : isDone ? ' done' : '');

        const tagText = isActive ? 'GILIRAN SEKARANG' : isDone ? 'SELESAI' : `#${step + 1}`;
        const iconHtml = isActive
          ? `<span class="icon" style="font-size:14px;color:var(--primary);font-variation-settings:'FILL' 1;">play_arrow</span>`
          : isDone
          ? `<span class="icon" style="font-size:13px;color:var(--tertiary);font-variation-settings:'FILL' 1;">check_circle</span>`
          : '';

        const group    = state.groups[groupIdx] || [];
        const numsHtml = group.map(n => `<div class="p3-card-num">${n ? '#' + n : '—'}</div>`).join('');
        const resHtml  = isDone ? `<div class="p3-card-result">→ ${state.groupResults[groupIdx]}</div>` : '';

        card.innerHTML = `
          <div class="p3-card-header">
            <span class="p3-card-label">${tagText}</span>${iconHtml}
          </div>
          <div class="p3-card-nums">${numsHtml}</div>${resHtml}`;

        list.appendChild(card);
        if (isActive) setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
      });
    }

    /* ============================================================
       PHASE 3 — BUTTON STATE
       ============================================================ */
    function setP3Btns(enabled) {
      document.getElementById('btnPutarWheel').disabled    = !enabled;
      document.getElementById('btnLangsungPilih').disabled = !enabled;
      const autoBtn = document.getElementById('btnAutoSpin');
      // Keep auto button clickable while auto mode is running so user can stop it
      if (autoBtn) autoBtn.disabled = !enabled && !p3AutoMode;
    }

    /* ============================================================
       PHASE 3 — AUTO SPIN
       ============================================================ */
    function toggleAutoSpin() {
      if (p3AutoMode) {
        p3AutoMode = false;
        updateAutoBtn();
        // Re-enable manual buttons if not currently spinning
        if (!p3IsSpinning) setP3Btns(p3WheelMembers.length > 0);
      } else {
        if (p3IsSpinning || p3WheelMembers.length === 0) return;
        p3AutoMode = true;
        updateAutoBtn();
        spinWheel();
      }
    }

    function updateAutoBtn() {
      const btn = document.getElementById('btnAutoSpin');
      if (!btn) return;
      if (p3AutoMode) {
        btn.classList.add('active');
        btn.innerHTML = '<span class="icon" style="font-size:16px;vertical-align:-2px;">stop_circle</span> Stop Auto';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span class="icon" style="font-size:16px;vertical-align:-2px;">fast_forward</span> Auto Semua';
      }
    }
