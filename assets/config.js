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

// ============================================================
// قائمة أكواد الدول المستخدمة في كل حقول إدخال الجوال
// ============================================================
const COUNTRY_CODES = [
  { code: '966', name: 'السعودية', flag: '🇸🇦' },
  { code: '971', name: 'الإمارات', flag: '🇦🇪' },
  { code: '965', name: 'الكويت', flag: '🇰🇼' },
  { code: '973', name: 'البحرين', flag: '🇧🇭' },
  { code: '974', name: 'قطر', flag: '🇶🇦' },
  { code: '968', name: 'عُمان', flag: '🇴🇲' },
  { code: '20',  name: 'مصر', flag: '🇪🇬' },
  { code: '962', name: 'الأردن', flag: '🇯🇴' },
  { code: '961', name: 'لبنان', flag: '🇱🇧' },
  { code: '963', name: 'سوريا', flag: '🇸🇾' },
  { code: '964', name: 'العراق', flag: '🇮🇶' },
  { code: '967', name: 'اليمن', flag: '🇾🇪' },
  { code: '970', name: 'فلسطين', flag: '🇵🇸' },
];

// يبني عنصر <select> لأكواد الدول، تستخدمه كل صفحة فيها إدخال جوال
function buildCountrySelect(selectEl, defaultCode = '966') {
  COUNTRY_CODES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = `${c.flag} +${c.code}`;
    if (c.code === defaultCode) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

// تحويل الأرقام العربية/الفارسية إلى أرقام إنجليزية (نفس منطق الباك إند)
function toEnglishDigits(str) {
  const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
  const easternArabicIndic = '۰۱۲۳۴۵۶۷۸۹';
  return String(str).replace(/[٠-٩۰-۹]/g, (ch) => {
    let idx = arabicIndic.indexOf(ch);
    if (idx === -1) idx = easternArabicIndic.indexOf(ch);
    return idx !== -1 ? String(idx) : ch;
  });
}

// يدمج كود الدولة + الرقم المحلي في صيغة موحّدة (بدون صفر بداية، أرقام فقط)
function combinePhone(countryCode, localNumber) {
  let local = toEnglishDigits(localNumber).replace(/[^\d]/g, '');
  local = local.replace(/^0+/, ''); // حذف الصفر/الأصفار من البداية
  return countryCode + local;
}

// ── أيقونات العين (SVG) لحقول كلمة المرور ──
const _EYE_ON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const _EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23" stroke-width="1.8"/></svg>';

// تبديل إظهار/إخفاء كلمة المرور مع أيقونة SVG
function togglePw(inputId, btnId) {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  const hidden = inp.type === 'password';
  inp.type   = hidden ? 'text' : 'password';
  btn.innerHTML = hidden ? _EYE_OFF : _EYE_ON;
}

// تفعيل أيقونة إظهار/إخفاء كلمة المرور على أي حقل (محدّث بأيقونات SVG)
function enablePasswordToggle(inputId, toggleId) {
  const toggle = document.getElementById(toggleId);
  if (!toggle) return;
  toggle.innerHTML = _EYE_ON;
  toggle.addEventListener('click', () => togglePw(inputId, toggleId));
}

// ============================================================
// دوال مساعدة للبصمة الحيوية (WebAuthn) في المتصفح
// ============================================================
function isWebAuthnSupported() {
  return !!(window.PublicKeyCredential && navigator.credentials);
}

function base64UrlToBuffer(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const raw = atob(b64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
  return buffer;
}

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// تسجيل بصمة جديدة لهذا الجهاز (يُستدعى بعد دخول عادي بالجوال)
async function registerBiometric(userId) {
  if (!isWebAuthnSupported()) {
    return { success: false, message: 'هذا المتصفح/الجهاز لا يدعم البصمة الحيوية' };
  }

  const challengeRes = await callApi('webauthnRegisterChallenge', { userId });
  if (!challengeRes.success) return challengeRes;

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: base64UrlToBuffer(challengeRes.challenge),
        rp: { id: challengeRes.rpId, name: challengeRes.rpName },
        user: {
          id: new TextEncoder().encode(challengeRes.userId),
          name: challengeRes.userName,
          displayName: challengeRes.userDisplayName
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        attestation: 'none',
        timeout: 60000
      }
    });

    const result = await callApi('webauthnRegisterVerify', {
      userId,
      credentialId: bufferToBase64Url(credential.rawId),
      attestationObject: bufferToBase64Url(credential.response.attestationObject),
      clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
      deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' :
                  navigator.userAgent.includes('Android') ? 'Android' : 'جهاز آخر'
    });
    return result;
  } catch (err) {
    return { success: false, message: 'تم إلغاء العملية أو فشل تفعيل البصمة' };
  }
}

// تسجيل دخول بالبصمة (يُستدعى من صفحة الدخول، يحتاج رقم الجوال أولاً)
async function loginWithBiometric(phone) {
  if (!isWebAuthnSupported()) {
    return { success: false, message: 'هذا المتصفح/الجهاز لا يدعم البصمة الحيوية' };
  }

  const challengeRes = await callApi('webauthnLoginChallenge', { phone });
  if (!challengeRes.success) return challengeRes;

  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: base64UrlToBuffer(challengeRes.challenge),
        rpId: challengeRes.rpId,
        allowCredentials: challengeRes.allowCredentialIds.map(id => ({
          id: base64UrlToBuffer(id), type: 'public-key'
        })),
        userVerification: 'required',
        timeout: 60000
      }
    });

    const result = await callApi('webauthnLoginVerify', {
      phone,
      credentialId: bufferToBase64Url(credential.rawId),
      authenticatorData: bufferToBase64Url(credential.response.authenticatorData),
      signature: bufferToBase64Url(credential.response.signature),
      clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON)
    });
    return result;
  } catch (err) {
    return { success: false, message: 'تم إلغاء العملية أو فشل تسجيل الدخول بالبصمة' };
  }
}
