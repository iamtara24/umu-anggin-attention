// Baca nama penerima dari link, contoh: undangan.html?to=Budi+%26+Keluarga
(function setRecipientName() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('to');
  if (name && name.trim().length) {
    document.getElementById('recipientName').textContent = name.trim();
  }
})();

function openLetter() {
  const wrap = document.getElementById('envWrap');
  const env = document.getElementById('envelope');
  const hint = document.getElementById('hint');
  if (wrap.classList.contains('opened')) return;
  env.classList.add('opened');
  wrap.classList.add('opened');
  hint.style.transition = 'opacity .4s ease';
  hint.style.opacity = '0';
}
