// ====== MODE: TAMU vs ADMIN ======
  // Buka link + "&admin=1" (atau "?admin=1" kalau belum ada parameter lain) untuk lihat generator ini.
  // Tamu yang buka link biasa (misal ?to=Nama) tetap hanya melihat undangan.
  (function routeView(){
    const params = new URLSearchParams(window.location.search);
    if(params.get('admin') === '1'){
      document.getElementById('guestView').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      wireAdminEvents();
    }
  })();

  function wireAdminEvents(){
    document.getElementById('baseUrl').addEventListener('input', renderBatch);
    document.getElementById('template').addEventListener('input', renderBatch);
    document.getElementById('recipients').addEventListener('input', renderBatch);
  }

  function buildPersonalLink(base, name){
    const url = new URL(base.trim());
    url.searchParams.set('to', name.trim());
    return url.toString();
  }

  function parseRecipients(raw){
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

  function renderBatch(){
    const base = document.getElementById('baseUrl').value.trim();
    const template = document.getElementById('template').value;
    const raw = document.getElementById('recipients').value;
    const out = document.getElementById('batchOut');

    const recipients = parseRecipients(raw);

    if(!base || !template.trim() || !recipients.length){
      out.innerHTML = '<p class="empty-msg">Isi ketiga bagian di atas dulu, hasilnya bakal muncul di sini.</p>';
      return;
    }

    out.innerHTML = '';

    recipients.forEach((r, i) => {
      let personalLink;
      try{
        personalLink = buildPersonalLink(base, r.name);
      }catch(e){
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

  function copyMsg(i){
    const text = document.getElementById('preview'+i).textContent;
    navigator.clipboard.writeText(text);
    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = 'Tersalin ✓';
    setTimeout(()=> btn.textContent = original, 1500);
  }

  // Baca nama penerima dari link, contoh: undangan.html?to=Budi+%26+Keluarga
  (function setRecipientName(){
    const params = new URLSearchParams(window.location.search);
    const name = params.get('to');
    if(name && name.trim().length){
      document.getElementById('recipientName').textContent = name.trim();
    }
  })();

  function openLetter(){
    const wrap = document.getElementById('envWrap');
    const env = document.getElementById('envelope');
    const hint = document.getElementById('hint');
    if(wrap.classList.contains('opened')) return;
    env.classList.add('opened');
    wrap.classList.add('opened');
    hint.style.transition = 'opacity .4s ease';
    hint.style.opacity = '0';
  }
