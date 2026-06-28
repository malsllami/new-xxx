// ============================================================
// عدّل هذا الرابط بعد نشر Apps Script كـ Web App
// كيف تحصل عليه: Apps Script -> Deploy -> New deployment -> Web app -> Deploy
// ينسخ لك رابط ينتهي بـ /exec ، الصقه هنا
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbwhp8JykKhfrTLVO_3Uz-hWZ2zs4yLRqNenbKS0HbtXGyuR-5gT9_D7LwjWdUx8EvcZ-g/exec';

/**
 * دالة موحّدة لاستدعاء الباك إند
 * نستخدم text/plain لتجنّب مشاكل CORS preflight مع Apps Script
 */
async function callApi(action, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    });
    return await response.json();
  } catch (err) {
    return { success: false, message: 'فشل الاتصال بالخادم، تحقق من الإنترنت أو رابط API' };
  }
}
