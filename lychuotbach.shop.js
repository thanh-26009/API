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
    console.log("📌 cate_id:", id);
    if (!id) {
      GM_log("❌ Không lấy được ID từ URL:", location.href);
      return;
    }

    const apicategory = `https://lychuotbach.shop/api/category/${id}`;
    const apiid = `https://lychuotbach.shop/api/accounts/public/single?cate_id=${id}&limit=21&page=1`;

    try {
        // 🔥 GỌI SONG SONG – KHÔNG DELAY
        const [cateRes, accRes] = await Promise.all([
        fetch(apicategory, {
            credentials: "include",
            headers: {
            "accept": "*/*",
            "content-type": "application/json",
            "data-from": "SHOP_LY",
            "referer": location.href
            }
        }),
        fetch(apiid, {
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
        console.error("❌ API lỗi",
            cateRes.status,
            accRes.status
        );
        return;
        }

        const cateData = await cateRes.json();
        const idData = await accRes.json();

      const available = cateData?.data?.available_quantity;
      if (available === undefined) {
        GM_log("⚠️ Không có available_quantity");
        return;
      }

      const time = new Date().toLocaleTimeString();
      const logMsg = `✅ OK | Available: ${available} | ${time}`;
      // 🔢 Đếm số acc
      const list =
        idData?.data?.records ??
        idData?.data ??
        [];
      
      // 🧾 In chi tiết từng acc (nếu có)
      if (Array.isArray(list)) {
        console.table(list);
      }

      if (lastAvailable !== null && available !== lastAvailable) {
        GM_log(
          `🔥 Thay đổi | ${lastAvailable} → ${available} | ${time}`
        );
        console.log("✅ SỐ ACC TRẢ VỀ:", list.length);
      } else {
        console.log(logMsg);
        console.log("✅ SỐ ACC TRẢ VỀ:", list.length);
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
  }, 60000);

})();
