    /* ============================================================
       NAVBAR — RENDER
       ============================================================ */
    function renderNavbar(setlistName, showBadge, customRight) {
      const badgeHtml = showBadge && setlistName ? `
        <span class="appbar-badge">
          <span class="appbar-badge-dot"></span>
          <span>${setlistName}</span>
        </span>` : '';

      const defaultRight = `
        <button class="icon-btn" aria-label="Riwayat"><span class="icon">history</span></button>
        <button class="icon-btn" aria-label="Pengaturan"><span class="icon">settings</span></button>`;

      const rightHtml = customRight !== undefined ? customRight : defaultRight;

      return `<header class="appbar">
        <span class="appbar-brand">ROULETTE2SHOT</span>
        <div class="appbar-center">${badgeHtml}</div>
        <div class="appbar-right">${rightHtml}</div>
      </header>`;
    }

    /* ============================================================
       FOOTER — RENDER
       ============================================================ */
    function renderFooter() {
      return `<footer class="appfooter">
        <span class="appfooter-text">JKT48 Theater 2Shot Simulator</span>
      </footer>`;
    }

    /* ============================================================
       NAVBAR + FOOTER — MOUNT INTO SCREEN
       ============================================================ */
    function mountNavbarFooter(screenEl, setlistName, showBadge, customRight) {
      const navSlot    = screenEl.querySelector('.appbar-mount');
      const footerSlot = screenEl.querySelector('.footer-mount');
      if (navSlot)    navSlot.innerHTML    = renderNavbar(setlistName, showBadge, customRight);
      if (footerSlot) footerSlot.innerHTML = renderFooter();
    }
