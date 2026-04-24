    /* ============================================================
       PHOTO — CONSTANTS
       ============================================================ */
    const BACKDROP_GRADIENTS = {
      passion: ['#1a0510','#2d0620','#0a0510'],
      dream:   ['#050a1a','#0d1535','#080318'],
      love:    ['#150818','#250d30','#100814'],
    };

    /* ============================================================
       PHOTO — MODULE STATE
       ============================================================ */
    let photoStream    = null;
    let photoCaptured  = null;
    let photoCountdown = null; // interval handle
    let preloadedLogo  = null; // pre-loaded logo image
    let selectedCameraId = null; // preferred camera device ID

    /* ============================================================
       PHOTO — INIT
       ============================================================ */
    function initPhoto() {
      photoCaptured = null;
      if (photoCountdown) { clearInterval(photoCountdown); photoCountdown = null; }

      // Randomise which side the member appears on
      state.photoSide = Math.random() < 0.5 ? 'left' : 'right';

      // Stage orientation
      const stage = document.getElementById('photoStage');
      stage.className = 'photo-stage member-' + state.photoSide;

      // Member image (try real asset, fallback to colour silhouette)
      const memberName  = state.selectedMember || '';
      const memberImg   = document.getElementById('photoMemberImg');
      const silhouette  = document.getElementById('photoMemberSilhouette');
      const silColors   = {
        passion: 'linear-gradient(to top, rgba(255,78,120,0.6) 0%, rgba(255,45,107,0.2) 50%, transparent 85%)',
        dream:   'linear-gradient(to top, rgba(100,140,255,0.55) 0%, rgba(80,110,255,0.18) 50%, transparent 85%)',
        love:    'linear-gradient(to top, rgba(200,100,255,0.55) 0%, rgba(180,80,255,0.18) 50%, transparent 85%)',
      };
      silhouette.style.background = silColors[state.selectedTeam] || silColors.passion;

      memberImg.style.display = 'none';
      silhouette.style.display = '';
      memberImg.src = `members/${memberName}.png`;
      memberImg.onload  = () => { memberImg.style.display = ''; silhouette.style.display = 'none'; };
      memberImg.onerror = () => { memberImg.style.display = 'none'; silhouette.style.display = ''; };

      // Date watermark
      const now     = new Date();
      const months  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const dateStr = `${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
      document.getElementById('photoDateWatermark').textContent = dateStr;

      // Reset UI state
      document.getElementById('photoPreviewCanvas').style.display = 'none';
      document.getElementById('photoVideo').style.display = '';
      document.getElementById('photoLiveBadge').style.display = '';
      document.getElementById('photoCountdown').classList.remove('visible');
      closePhotoModal();

      // Pre-load logo so capturePhoto can draw it synchronously
      preloadedLogo = null;
      const logoPreload = new Image();
      logoPreload.onload  = () => { preloadedLogo = logoPreload; };
      logoPreload.onerror = () => { preloadedLogo = null; };
      logoPreload.src = `logos/${state.selectedTeam}.png`;

      startPhotoCamera();
    }

    /* ============================================================
       PHOTO — CAMERA
       ============================================================ */
    function startPhotoCamera() {
      stopPhotoCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        startPhotoCountdown(); return;
      }

      // Build video constraints:
      // - Explicit device selected → use that exact deviceId
      // - Mobile (no selection)   → no facingMode, let device auto-pick
      // - Desktop (no selection)  → prefer user/front camera
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const videoConstraints = selectedCameraId
        ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : isMobile
          ? { width: { ideal: 1280 }, height: { ideal: 720 } }           // auto: device default
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }; // desktop: front cam

      navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      }).then(stream => {
        photoStream = stream;
        const vid = document.getElementById('photoVideo');
        vid.srcObject = stream;
        vid.onloadedmetadata = () => { vid.play(); startPhotoCountdown(); };
      }).catch(() => {
        startPhotoCountdown();
      });
    }

    /* ============================================================
       CAMERA SETTINGS — OPEN SHEET
       ============================================================ */
    async function openCameraSettings() {
      const sheet   = document.getElementById('cameraSheet');
      const listEl  = document.getElementById('cameraSheetList');

      listEl.innerHTML = '<div class="camera-sheet-empty">Memuat daftar kamera...</div>';
      sheet.classList.add('open');

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          throw new Error('API Kamera tidak didukung di browser ini atau koneksi tidak aman (butuh HTTPS/localhost).');
        }

        // Must request permission first so labels are not empty
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');

        if (cameras.length === 0) {
          listEl.innerHTML = '<div class="camera-sheet-empty">Tidak ada kamera yang ditemukan.</div>';
          return;
        }

        listEl.innerHTML = '';
        cameras.forEach((cam, idx) => {
          const isActive = selectedCameraId
            ? cam.deviceId === selectedCameraId
            : idx === 0;     // default: first device highlighted

          const label = cam.label || `Kamera ${idx + 1}`;

          const btn = document.createElement('button');
          btn.className = 'camera-sheet-item' + (isActive ? ' active' : '');
          btn.innerHTML = `
            <span class="icon cam-icon">videocam</span>
            <span class="cam-item-label">${label}</span>
            <span class="icon cam-item-check">check_circle</span>
          `;
          btn.addEventListener('click', () => selectCamera(cam.deviceId));
          listEl.appendChild(btn);
        });

      } catch (err) {
        listEl.innerHTML = `<div class="camera-sheet-empty">Gagal memuat kamera: ${err.message}</div>`;
      }
    }

    /* ============================================================
       CAMERA SETTINGS — SELECT DEVICE
       ============================================================ */
    function selectCamera(deviceId) {
      selectedCameraId = deviceId;
      closeCameraSheet();

      // Update active highlight without re-opening sheet
      document.querySelectorAll('.camera-sheet-item').forEach(btn => {
        const label = btn.querySelector('.cam-item-label')?.textContent || '';
        // We re-render on next open, so just close for now
      });

      // Restart camera with new device (reset countdown)
      if (photoCountdown) { clearInterval(photoCountdown); photoCountdown = null; }
      document.getElementById('photoCountdown').classList.remove('visible');
      startPhotoCamera();
    }

    /* ============================================================
       CAMERA SETTINGS — CLOSE SHEET
       ============================================================ */
    function closeCameraSheet() {
      document.getElementById('cameraSheet').classList.remove('open');
    }

    // Close sheet when clicking backdrop
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'cameraSheet') closeCameraSheet();
    });

    function stopPhotoCamera() {
      if (photoStream) { photoStream.getTracks().forEach(t => t.stop()); photoStream = null; }
      const vid = document.getElementById('photoVideo');
      if (vid) vid.srcObject = null;
    }

    /* ============================================================
       PHOTO — COUNTDOWN
       ============================================================ */
    function startPhotoCountdown() {
      if (photoCountdown) { clearInterval(photoCountdown); photoCountdown = null; }
      const overlay = document.getElementById('photoCountdown');
      const numEl   = document.getElementById('photoCountdownNum');
      let count = 3;
      numEl.textContent = String(count);
      overlay.classList.add('visible');

      photoCountdown = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(photoCountdown); photoCountdown = null;
          overlay.classList.remove('visible');
          setTimeout(capturePhoto, 120);
        } else {
          numEl.textContent = String(count);
        }
      }, 1000);
    }

    /* ============================================================
       PHOTO — CAPTURE
       ============================================================ */
    function capturePhoto() {
      const W = 1280, H = 720;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');

      // 1. Dark base (fallback if camera not available)
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, W, H);

      // 2. Camera feed — full screen, cover fit, mirrored (selfie)
      const vid = document.getElementById('photoVideo');
      if (vid.readyState >= 2 && vid.videoWidth > 0) {
        const vw = vid.videoWidth, vh = vid.videoHeight;
        const scale = Math.max(W / vw, H / vh);
        const dw = vw * scale, dh = vh * scale;
        const ox = (W - dw) / 2, oy = (H - dh) / 2;
        // Mirror horizontally (selfie)
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(vid, W - ox - dw, oy, dw, dh);
        ctx.restore();
      }

      // 3. Member PNG — overlaid, bottom-anchored, on correct side
      const memberImg = document.getElementById('photoMemberImg');
      if (memberImg.complete && memberImg.naturalWidth > 0 && memberImg.style.display !== 'none') {
        const memberH = H;                                          // full height
        const memberW = (memberImg.naturalWidth / memberImg.naturalHeight) * memberH;
        const memberX = (state.photoSide === 'right') ? W - memberW : 0;
        ctx.drawImage(memberImg, memberX, 0, memberW, memberH);
      } else {
        // Silhouette fallback
        const silW  = W * 0.38;
        const silX  = (state.photoSide === 'right') ? W - silW : 0;
        drawPhotoSilhouette(ctx, silX, silW, H, state.selectedTeam);
      }

      // 4. Subtle vignette
      const vig = ctx.createRadialGradient(W/2, H/2, H * 0.14, W/2, H/2, H * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(10,14,26,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // 5. Date watermark
      const now    = new Date();
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const dateStr = `${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
      ctx.font         = '600 14px "Be Vietnam Pro",sans-serif';
      ctx.fillStyle    = 'rgba(255,255,255,0.68)';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(dateStr, W / 2, H - 16);

      // 6. Logo watermark — drawn synchronously (pre-loaded in initPhoto)
      if (preloadedLogo && preloadedLogo.complete && preloadedLogo.naturalWidth > 0) {
        const lh = 72, lw = (preloadedLogo.naturalWidth / preloadedLogo.naturalHeight) * lh;
        ctx.drawImage(preloadedLogo, W - lw - 20, H - lh - 14, lw, lh);
      } else {
        // Fallback: text watermark
        ctx.font      = '700 15px "Space Grotesk",sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(SETLIST_LABELS[state.selectedTeam] || '', W - 20, H - 16);
        ctx.fillText('JKT48 Theater', W - 20, H - 36);
      }

      // Always reached — no async dependency
      finaliseCapture(canvas);
    }

    function drawPhotoSilhouette(ctx, x, w, H, team) {
      const teamCols = {
        passion: ['rgba(255,78,120,0.58)', 'rgba(255,45,107,0.18)', 'rgba(0,0,0,0)'],
        dream:   ['rgba(100,150,255,0.52)', 'rgba(80,120,255,0.15)', 'rgba(0,0,0,0)'],
        love:    ['rgba(200,100,255,0.52)', 'rgba(180,80,255,0.15)', 'rgba(0,0,0,0)'],
      };
      const cols = teamCols[team] || teamCols.passion;
      const sg   = ctx.createLinearGradient(x + w / 2, H, x + w / 2, 0);
      sg.addColorStop(0, cols[0]);
      sg.addColorStop(0.45, cols[1]);
      sg.addColorStop(1,    cols[2]);
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, H, w * 0.32, H * 0.92, 0, Math.PI, 0, true);
      ctx.fill();
    }

    function finaliseCapture(canvas) {
      photoCaptured = canvas.toDataURL('image/jpeg', 0.92);
      stopPhotoCamera();
      openPhotoModal(photoCaptured);
    }

    /* ============================================================
       PHOTO — MODAL OPEN / CLOSE
       ============================================================ */
    function openPhotoModal(dataUrl) {
      const modal     = document.getElementById('photoResultModal');
      const modalImg  = document.getElementById('photoModalImg');
      const nameEl    = document.getElementById('photoModalMemberName');

      modalImg.src    = dataUrl;
      nameEl.textContent = state.selectedMember || '—';

      modal.classList.add('open');

      // Trap focus inside modal for accessibility
      modal.focus && modal.focus();
    }

    function closePhotoModal() {
      document.getElementById('photoResultModal').classList.remove('open');
    }

    /* ============================================================
       PHOTO — ULANGI
       ============================================================ */
    function photoUlangi() {
      photoCaptured = null;
      closePhotoModal();
      // Small delay so modal close animation plays before camera restarts
      setTimeout(() => {
        document.getElementById('photoPreviewCanvas').style.display = 'none';
        document.getElementById('photoVideo').style.display = '';
        document.getElementById('photoLiveBadge').style.display = '';
        startPhotoCamera();
      }, 200);
    }

    /* ============================================================
       PHOTO — DOWNLOAD
       ============================================================ */
    function photoDownload() {
      if (!photoCaptured) return;
      const now  = new Date();
      const ymd     = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      const setlist = (state.selectedSetlist || state.selectedTeam || 'photo').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
      const name    = (state.selectedMember || 'member').toLowerCase().replace(/\s+/g, '_');
      const a       = document.createElement('a');
      a.href        = photoCaptured;
      a.download    = `${setlist}_${ymd}_${name}.jpg`;
      a.click();
    }

    /* ============================================================
       RESULT — INIT
       ============================================================ */
    function initResult() {
      const member  = state.selectedMember  || '—';
      const setlist = state.selectedSetlist || '—';
      const el = document.getElementById('resultMemberName');
      const sl = document.getElementById('resultSetlistLabel');
      if (el) el.textContent = member;
      if (sl) sl.textContent = setlist;
    }

    /* ============================================================
       PHOTO RESULT MODAL — BACKDROP CLICK TO CLOSE
       ============================================================ */
    document.addEventListener('click', function(e) {
      // Only close if clicking the backdrop (not the card itself)
      if (e.target && e.target.id === 'photoResultModal') closePhotoModal();
    });

    // Patch navigateTo to close modal when leaving photo
    const _navTo = navigateTo;
    window.navigateTo = function(key) {
      if (state.currentScreen === 'photo') closePhotoModal();
      _navTo(key);
    };
