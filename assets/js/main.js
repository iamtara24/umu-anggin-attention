// Fungsi memuat data JSON
async function loadInvitationData() {
  try {
    const response = await fetch('assets/data/invitation.json');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    renderInvitation(data);
  } catch (err) {
    console.error('Gagal memuat data invitation.json:', err);
  }
}

// Render data ke elemen HTML
function renderInvitation(data) {
  if (!data) return;

  // Title halaman
  if (data.meta?.pageTitle) {
    document.title = data.meta.pageTitle;
  }

  // Eyebrow
  const eyebrowEl = document.getElementById('letterEyebrow');
  if (eyebrowEl && data.letter?.eyebrow) {
    eyebrowEl.textContent = data.letter.eyebrow;
  }

  // Nama Penerima dari URL (?to=Nama) atau default dari JSON
  const recipientEl = document.getElementById('recipientName');
  let currentRecipient = data.letter?.defaultRecipient || 'Teman & Keluarga Tersayang';
  if (recipientEl) {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    if (toParam && toParam.trim().length) {
      currentRecipient = toParam.trim();
      recipientEl.textContent = currentRecipient;
    } else if (data.letter?.defaultRecipient) {
      recipientEl.textContent = data.letter.defaultRecipient;
    }
  }

  // Nama Mempelai di Judul Surat
  const coupleNamesEl = document.getElementById('coupleNames');
  if (coupleNamesEl && data.couple?.groom && data.couple?.bride) {
    coupleNamesEl.innerHTML = `${data.couple.groom.name} <br /><em>&</em><br /> ${data.couple.bride.name}`;
  }

  // Pesan Paragraf Surat
  const letterMsgEl = document.getElementById('letterMsg');
  if (letterMsgEl && Array.isArray(data.letter?.messages)) {
    letterMsgEl.innerHTML = data.letter.messages
      .map(msg => `<p>${msg.replaceAll('{nama}', currentRecipient).replaceAll('{recipient}', currentRecipient)}</p>`)
      .join('');
  }

  // Detail Tanggal & Lokasi
  const eventDateEl = document.getElementById('eventDate');
  if (eventDateEl && data.letter?.event?.date) {
    eventDateEl.textContent = data.letter.event.date;
  }
  const eventLocEl = document.getElementById('eventLocation');
  if (eventLocEl && data.letter?.event?.location) {
    eventLocEl.textContent = data.letter.event.location;
  }

  // Penutup & Tanda Tangan
  const closingGreetingEl = document.getElementById('closingGreeting');
  if (closingGreetingEl && data.letter?.closing?.greeting) {
    closingGreetingEl.textContent = data.letter.closing.greeting;
  }
  const closingSignEl = document.getElementById('closingSignature');
  if (closingSignEl && data.letter?.closing?.signature) {
    closingSignEl.textContent = data.letter.closing.signature;
  }

  // Teks Petunjuk Buka Amplop
  const hintEl = document.getElementById('hint');
  if (hintEl && data.ui?.hintText) {
    hintEl.textContent = data.ui.hintText;
  }

  // Tombol WhatsApp (Menggunakan Nama Panggilan / shortName)
  const wishText = encodeURIComponent(data.letter?.whatsappWish || "Selamat ya!");
  const btnGroom = document.getElementById('btnGroom');
  if (btnGroom && data.couple?.groom) {
    const groomNickname = data.couple.groom.shortName || data.couple.groom.nickname || data.couple.groom.name.split(' ')[0];
    btnGroom.href = `https://wa.me/${data.couple.groom.phone}?text=${wishText}`;
    btnGroom.textContent = `Ucapan untuk ${groomNickname}`;
  }

  const btnBride = document.getElementById('btnBride');
  if (btnBride && data.couple?.bride) {
    const brideNickname = data.couple.bride.shortName || data.couple.bride.nickname || data.couple.bride.name.split(' ')[0];
    btnBride.href = `https://wa.me/${data.couple.bride.phone}?text=${wishText}`;
    btnBride.textContent = `Ucapan untuk ${brideNickname}`;
  }
}

// Inisialisasi saat dokumen dimuat
document.addEventListener('DOMContentLoaded', () => {
  loadInvitationData();
});

// ====== INTERAKSI BUKA AMPLOP ======
function openLetter() {
  const wrap = document.getElementById('envWrap');
  const env = document.getElementById('envelope');
  const hint = document.getElementById('hint');
  if (wrap.classList.contains('opened')) return;
  env.classList.add('opened');
  wrap.classList.add('opened');
  if (hint) {
    hint.style.transition = 'opacity .4s ease';
    hint.style.opacity = '0';
  }
}

// ====== MODE: TAMU vs ADMIN ======
(function routeView() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === '1') {
    const guestView = document.getElementById('guestView');
    const adminPanel = document.getElementById('adminPanel');
    if (guestView) guestView.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    wireAdminEvents();
  }
})();

function wireAdminEvents() {
  const baseUrlEl = document.getElementById('baseUrl');
  const templateEl = document.getElementById('template');
  const recipientsEl = document.getElementById('recipients');
  if (baseUrlEl) baseUrlEl.addEventListener('input', renderBatch);
  if (templateEl) templateEl.addEventListener('input', renderBatch);
  if (recipientsEl) recipientsEl.addEventListener('input', renderBatch);
}

function buildPersonalLink(base, name) {
  const url = new URL(base.trim());
  url.searchParams.set('to', name.trim());
  return url.toString();
}

function parseRecipients(raw) {
  return raw.split('\n')
    .map(line => line.trim())
    .filter(line => line.length)
    .map(line => {
      const parts = line.split(',');
      const number = parts.pop().trim().replace(/[^0-9]/g, '');
      const name = parts.join(',').trim();
      return { name, number };
    })
    .filter(r => r.name && r.number);
}

function renderBatch() {
  const base = document.getElementById('baseUrl').value.trim();
  const template = document.getElementById('template').value;
  const raw = document.getElementById('recipients').value;
  const out = document.getElementById('batchOut');

  const recipients = parseRecipients(raw);

  if (!base || !template.trim() || !recipients.length) {
    out.innerHTML = '<p class="empty-msg">Isi ketiga bagian di atas dulu, hasilnya bakal muncul di sini.</p>';
    return;
  }

  out.innerHTML = '';

  recipients.forEach((r, i) => {
    let personalLink;
    try {
      personalLink = buildPersonalLink(base, r.name);
    } catch (e) {
      personalLink = '(link dasar belum valid, pastikan diawali https://)';
    }

    const finalMessage = template
      .replaceAll('{nama}', r.name)
      .replaceAll('{link}', personalLink);

    const waUrl = `https://wa.me/${r.number}?text=${encodeURIComponent(finalMessage)}`;

    const row = document.createElement('div');
    row.className = 'batch-row';
    row.innerHTML = `
      <div class="name">${r.name} <span style="color:#8b9184; font-weight:400; font-size:11.5px;">· ${r.number}</span></div>
      <div class="preview" id="preview${i}">${finalMessage}</div>
      <div class="btns">
        <button class="btn-copy" onclick="copyMsg(${i})">Salin Pesan</button>
        <button class="btn-send" onclick="window.open('${waUrl}', '_blank')">Kirim ke WA</button>
      </div>
    `;
    out.appendChild(row);
  });
}

function copyMsg(i) {
  const text = document.getElementById('preview' + i).textContent;
  navigator.clipboard.writeText(text);
  const btn = event.target;
  const original = btn.textContent;
  btn.textContent = 'Tersalin ✓';
  setTimeout(() => btn.textContent = original, 1500);
}
