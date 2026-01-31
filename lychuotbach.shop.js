// ==UserScript==
// @name         Lychuotbach Auto Check Available
// @namespace    https://lychuotbach.shop/
// @version      1.0
// @description  Auto check available_quantity mỗi 60s, notify không cần F12
// @match        https://lychuotbach.shop/accounts/*
// @grant        GM_notification
// @grant        GM_log
// ==/UserScript==

(function () {
  'use strict';

  // 🔹 Lấy ID từ URL
  function getIdFromUrl() {
    const path = window.location.pathname.split("/");
    return path[path.length - 1];
  }

  // 🔹 Hàm check API
  async function checkNewAcc() {
    const id = getIdFromUrl();
    if (!id) {
      GM_log("❌ Không lấy được ID");
      return;
    }

    const apiUrl = `https://lychuotbach.shop/api/category/${id}`;

    try {
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include", // gửi cookie
        headers: {
          "accept": "application/json",
          "data-from": "SHOP_LY",
          "referer": window.location.href
        }
      });

      if (!res.ok) {
        GM_log("❌ API lỗi:", res.status);
        GM_notification({
          title: "Lychuotbach",
          text: `API lỗi ${res.status}`,
          timeout: 3000
        });
        return;
      }

      const json = await res.json();
      const available = json?.data?.available_quantity;

      if (available === undefined) {
        GM_log("⚠️ Không có available_quantity");
        return;
      }

      const msg = `Available: ${available}`;
      GM_log("✅", msg);

      GM_notification({
        title: "Lychuotbach Check",
        text: msg,
        timeout: 3000
      });

    } catch (err) {
      GM_log("❌ Lỗi JS:", err);
    }
  }

  // ▶️ chạy ngay khi vào trang
  checkNewAcc();

  // ⏱️ refresh mỗi 60s
  setInterval(checkNewAcc, 60000);

})();
