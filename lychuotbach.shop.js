// ==UserScript==
// @name         Lychuotbach Auto Check Available (Dynamic URL)
// @namespace    https://lychuotbach.shop/
// @version      1.1
// @description  Auto check available_quantity, luôn lấy ID mới từ URL
// @match        https://lychuotbach.shop/accounts/*
// @grant        GM_log
// ==/UserScript==

(function () {
  'use strict';

  let lastAvailable = null;
  let lastUrl = location.href;

  // 🔹 Lấy ID từ URL HIỆN TẠI
  function getIdFromUrl() {
    const match = location.pathname.match(/\/accounts\/([a-f0-9-]+)/i);
    return match ? match[1] : null;
  }

  async function checkNewAcc() {
    const id = getIdFromUrl();
    if (!id) {
      GM_log("❌ Không lấy được ID từ URL:", location.href);
      return;
    }

    const apiUrl = `https://lychuotbach.shop/api/category/${id}`;

    try {
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "accept": "application/json",
          "data-from": "SHOP_LY",
          "referer": location.href
        }
      });

      if (!res.ok) {
        GM_log(`❌ API lỗi ${res.status} | ${apiUrl}`);
        return;
      }

      const json = await res.json();
      const available = json?.data?.available_quantity;
      if (available === undefined) {
        GM_log("⚠️ Không có available_quantity");
        return;
      }

      const time = new Date().toLocaleTimeString();
      const logMsg = `✅ OK | Available: ${available} | ${time}`;


      if (lastAvailable !== null && available !== lastAvailable) {
        GM_log(
          `🔥 Thay đổi | ${lastAvailable} → ${available} | ${time}`
        );
      } else {
        console.log(logMsg);
        GM_log(
            logMsg
        );
      }

      lastAvailable = available;

    } catch (err) {
      GM_log("❌ Lỗi JS:", err);
    }
  }

  // ▶️ chạy ngay
  checkNewAcc();

  // ⏱️ check mỗi 60s
  setInterval(() => {
    // nếu URL đổi → reset dữ liệu cũ
    if (location.href !== lastUrl) {
      GM_log("🔄 URL đổi:", location.href);
      lastUrl = location.href;
      lastAvailable = null;
    }

    checkNewAcc();
  }, 300000);

})();
