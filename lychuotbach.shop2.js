// ==UserScript==
// @name         Lychuotbach Auto Buy (Stable)
// @namespace    https://lychuotbach.shop/
// @version      1.1
// @description  Reload 5p, ép page=2, poll DOM → click MUA + ĐỒNG Ý
// @match        https://lychuotbach.shop/accounts/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  console.log("⚡ AUTO BUY STABLE START");

  // ===== helper click =====
  function fire(el) {
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    el.click();
  }

  // ===== ép page=2 =====
  const url = new URL(location.href);
  if (url.searchParams.get("page") !== "2") {
    url.searchParams.set("page", "2");
    location.replace(url.toString());
    return;
  }

  let bought = false;

  // ===== thử mua =====
  function tryBuy() {
    if (bought) return;

    const cards = document.querySelectorAll(
      'div.overflow-hidden.bg-card-light-bg'
    );
    if (!cards.length) return;

    // chọn card bất kỳ (nhanh nhất)
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

  // ===== click Đồng ý =====
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
      } else {
        requestAnimationFrame(loop);
      }
    };
    loop();
  }

  // ===== polling nhanh (QUAN TRỌNG) =====
  const poll = setInterval(() => {
    if (bought) {
      clearInterval(poll);
      return;
    }
    tryBuy();
  }, 200); // 200ms → rất nhanh nhưng vẫn an toàn

  // ===== reload 5 phút =====
  setInterval(() => {
    console.log("♻️ AUTO RELOAD");
    location.reload();
  }, 60000);

})();
