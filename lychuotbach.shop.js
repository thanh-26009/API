// ==UserScript==
// @name         Lychuotbach Auto Check & Buy (Latest 10)
// @namespace    https://lychuotbach.shop/
// @version      3.1
// @description  Auto check available + auto buy 10 acc newest khi shop up acc
// @match        https://lychuotbach.shop/accounts/*
// @grant        GM_log
// ==/UserScript==

(function () {
  'use strict';

  let lastAvailable = null;
  let lastUrl = location.href;
  let hasBought = false; // tránh bắn lại nhiều lần

  // 🔹 Lấy cate_id từ URL
  function getIdFromUrl() {
    const match = location.pathname.match(/\/accounts\/([a-f0-9-]+)/i);
    return match ? match[1] : null;
  }

  async function checkNewAcc() {
    const cateId = getIdFromUrl();
    if (!cateId) {
      GM_log("❌ Không lấy được cate_id");
      return;
    }

    const apiCategory = `https://lychuotbach.shop/api/category/${cateId}`;
    const apiAccounts =
      `https://lychuotbach.shop/api/accounts/public/single?cate_id=${cateId}&limit=21&page=1`;

    try {
      // 🔥 GỌI SONG SONG
      const [cateRes, accRes] = await Promise.all([
        fetch(apiCategory, {
          credentials: "include",
          headers: {
            "accept": "*/*",
            "content-type": "application/json",
            "data-from": "SHOP_LY",
            "referer": location.href
          }
        }),
        fetch(apiAccounts, {
          credentials: "include",
          headers: {
            "accept": "*/*",
            "content-type": "application/json",
            "data-from": "SHOP_LY",
            "referer": location.href
          }
        })
      ]);

      if (!cateRes.ok || !accRes.ok) {
        console.error("❌ API lỗi", cateRes.status, accRes.status);
        return;
      }

      const cateData = await cateRes.json();
      const accData = await accRes.json();

      const available = cateData?.data?.available_quantity;
      if (available === undefined) return;

      const time = new Date().toLocaleTimeString();

      // 🔹 LẤY LIST ACC
      const list =
        accData?.data?.records ??
        accData?.data ??
        [];

      if (!Array.isArray(list) || list.length === 0) {
        console.log(`⚠️ Không có acc | ${time}`);
        return;
      }

      console.log(`📦 Tổng acc trả về: ${list.length}`);

      // 🔥 SORT THEO created_at (MỚI → CŨ)
      const sortedByTime = [...list].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // 🔥 LẤY 10 ACC MỚI NHẤT
      const latest10Accs = sortedByTime.slice(0, 10);
      const latest10Ids = latest10Accs.map(acc => acc.id);

      console.log("🔥 10 ACC MỚI NHẤT:", latest10Ids);

      // 🔥 PHÁT HIỆN SHOP UP ACC → BẮN
      if (available > 0 && !hasBought) {
        GM_log(`🔥 PHÁT HIỆN ACC > 0 → BẮN NGAY | Available: ${available} | ${time}`);
        hasBought = true; // khóa không cho bắn lại

        const apiBuy = (id) =>
          fetch("https://lychuotbach.shop/api/account-transaction/buy-by-id", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "data-from": "SHOP_LY"
            },
            body: JSON.stringify({ account_id: id })
          });

        // 🚀 BẮN SONG SONG 10 ACC
        await Promise.all(
          latest10Ids.map(id => apiBuy(id))
        );

        console.log("✅ ĐÃ BẮN XONG 10 ACC");
      } else {
        console.log(`✅ OK | Available: ${available} | ${time}`);
      }

      lastAvailable = available;

    } catch (err) {
      GM_log("❌ Lỗi JS:", err);
    }
  }

  // ▶️ chạy ngay khi load trang
  checkNewAcc();

  // ⏱️ check mỗi 60s
  setInterval(() => {
    if (location.href !== lastUrl) {
      GM_log("🔄 URL đổi → reset trạng thái");
      lastUrl = location.href;
      lastAvailable = null;
      hasBought = false;
    }
    checkNewAcc();
  }, 60000);

})();
