// ==UserScript==
// @name         Lychuotbach Auto Check & Buy (Latest 20)
// @namespace    https://lychuotbach.shop/
// @version      3.4
// @description  Auto check available + auto buy 20 acc newest khi shop up acc
// @match        https://lychuotbach.shop/accounts/*
// @match        https://lychuotbach.shop/*
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

      // 🔥 LẤY 20 ACC MỚI NHẤT
      const latest20Accs = sortedByTime.slice(0, 20);
      const latest20Ids = latest20Accs.map(acc => acc.id);

      console.log("🔥 20 ACC MỚI NHẤT:", latest20Ids);

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
              "data-from": "SHOP_LY",
              "origin": "https://lychuotbach.shop",
              "referer": location.href
            },
            body: JSON.stringify({ account_id: id })
          });

        // 🚀 BẮN SONG SONG 20 ACC
        await Promise.all(
          latest20Ids.map(id => apiBuy(id))
        );

        console.log("✅ ĐÃ BẮN XONG 20 ACC");
      } else {
        console.log(`✅ OK | Available: ${available} | ${time}`);
      }

      lastAvailable = available;

    } catch (err) {
      GM_log("❌ Lỗi JS:", err);
    }
  }

  // ⏱️ Hàm lên lịch chạy đúng vào giây :00 của mỗi phút
  function scheduleAtNextMinute() {
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    GM_log(`⏳ Chờ ${(msUntilNextMinute / 1000).toFixed(2)}s đến :00 tiếp theo`);

    setTimeout(() => {
      // 🔹 Reset URL nếu đổi
      if (location.href !== lastUrl) {
        GM_log("🔄 URL đổi → reset trạng thái");
        lastUrl = location.href;
        lastAvailable = null;
        hasBought = false;
      }

      GM_log(`🕐 Chạy đúng :00 | ${new Date().toLocaleTimeString()}`);
      checkNewAcc();

      // 🔁 Lặp lại mỗi 60s chính xác từ đây
      setInterval(() => {
        if (location.href !== lastUrl) {
          GM_log("🔄 URL đổi → reset trạng thái");
          lastUrl = location.href;
          lastAvailable = null;
          hasBought = false;
        }

        GM_log(`🕐 Chạy đúng :00 | ${new Date().toLocaleTimeString()}`);
        checkNewAcc();
      }, 60000);

    }, msUntilNextMinute);
  }

  // ▶️ Chạy ngay khi load trang
  GM_log("🚀 Script khởi động, chạy lần đầu ngay...");
  checkNewAcc();

  // ⏱️ Sau đó đồng bộ theo giây :00
  scheduleAtNextMinute();

})();
