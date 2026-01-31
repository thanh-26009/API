// ==UserScript==
// @name         Lychuotbach Auto Buy (Stable) by Zerone
// @namespace    https://lychuotbach.shop/
// @version      1.2
// @description  Auto buy → pause 15 phút sau khi mua
// @match        https://lychuotbach.shop/accounts/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const time = new Date().toLocaleTimeString();
  console.log(`⚡ AUTO BUY STABLE START | ${time}`);

  let pausedUntil = 0;
  let bought = false;

  function fire(el) {
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    el.click();
  }

  function tryBuy() {
    // ⏸️ đang pause 15 phút
    if (Date.now() < pausedUntil) return;
    if (bought) return;

    const cards = document.querySelectorAll(
      'div.overflow-hidden.bg-card-light-bg'
    );
    if (!cards.length) return;

    for (const card of cards) {
      const buyBtn = [...card.querySelectorAll("button")]
        .find(b => b.innerText.includes("MUA") && b.offsetParent);

      if (buyBtn) {
        bought = true;
        console.log("🛒 CLICK MUA NGAY");
        fire(buyBtn);
        clickConfirm();
        break;
      }
    }
  }

  function clickConfirm() {
    const loop = () => {
      const dialog = document.querySelector(
        'div[role="dialog"][data-state="open"]'
      );
      if (!dialog) return requestAnimationFrame(loop);

      const agree = [...dialog.querySelectorAll("button")]
        .find(b => b.innerText.includes("Đồng ý") && !b.disabled);

      if (agree) {
        console.log("✅ CLICK ĐỒNG Ý");
        fire(agree);

        // ✅ BẮT ĐẦU ĐẾM 15 PHÚT
        pausedUntil = Date.now() + 15 * 60 * 1000;
        bought = false;

        alert("✅ MUA ACC THÀNH CÔNG\n⏸️ TẠM DỪNG 15 PHÚT");
        navigator.vibrate?.([200,100,200]);
      } else {
        requestAnimationFrame(loop);
      }
    };
    loop();
  }

  // ===== polling =====
  setInterval(tryBuy, 200);

  // ===== reload (không reload khi đang pause) =====
  setInterval(() => {
    if (Date.now() < pausedUntil) return;
    console.log("♻️ AUTO RELOAD");
    location.reload();
  }, 60000);

})();
