// Vorka Learn · «Generador de código QR». Todo en el navegador con qrcode-generator (MIT). El QR apunta directo a lo que
// escribes: no pasa por ningún servidor nuestro, así que no caduca ni cuenta escaneos.
import qrcode from './lib/qrcode.js';
import { $, bajar, avisador } from './comun.js';

qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
const raiz = $('qr');
if (raiz) {
  const vista = $('qr-vista'), info = $('qr-info'), aviso = avisador($('qr-aviso')), color = $('qr-color'), fondo = $('qr-fondo'),
    tam = $('qr-tam'), nivel = $('qr-nivel'), png = $('qr-png'), svg = $('qr-svg'), nombre = $('qr-nombre');
  let actual = null;
  const tipo = () => raiz.querySelector('input[name="qr-tipo"]:checked')?.value || 'enlace';
  const v = id => ($(id)?.value || '').trim();
  const esc = t => t.replace(/([\\;,:"])/g, '\\$1');

  function contenido() {
    const t = tipo();
    if (t === 'enlace') {
      let u = v('qr-url');
      if (!u) return { error: 'Escribe o pega el enlace.' };
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
      return { texto: u, etiqueta: u.replace(/^https?:\/\//, '').replace(/\/$/, '') };
    }
    if (t === 'whatsapp') {
      let n = v('qr-tel').replace(/\D/g, '');
      if (n.length === 10) n = '52' + n;
      if (n.length < 11 || n.length > 15) return { error: 'Escribe el número de WhatsApp con 10 dígitos (o con lada de país).' };
      const m = v('qr-msg');
      return { texto: 'https://wa.me/' + n + (m ? '?text=' + encodeURIComponent(m) : ''), etiqueta: 'WhatsApp +' + n };
    }
    if (t === 'wifi') {
      const red = v('qr-red'), clave = $('qr-clave').value, seg = $('qr-seg').value;
      if (!red) return { error: 'Escribe el nombre de la red Wi‑Fi.' };
      if (seg !== 'nopass' && !clave) return { error: 'Escribe la contraseña del Wi‑Fi (o elige «Sin contraseña»).' };
      return { texto: 'WIFI:T:' + seg + ';S:' + esc(red) + ';' + (seg !== 'nopass' ? 'P:' + esc(clave) + ';' : '') + ($('qr-oculta').checked ? 'H:true;' : '') + ';', etiqueta: 'red «' + red + '»' };
    }
    const tx = $('qr-texto').value;
    if (!tx.trim()) return { error: 'Escribe el texto.' };
    return { texto: tx, etiqueta: tx.slice(0, 40) };
  }

  // Luminancia relativa para avisar si el lector no va a distinguir los colores
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

  function hacer() {
    for (const g of raiz.querySelectorAll('[data-tipo]')) g.hidden = g.dataset.tipo !== tipo();
    const c = contenido();
    actual = null; png.disabled = svg.disabled = true;
    if (c.error) { vista.innerHTML = '<p class="qr-vacio">' + c.error + '</p>'; info.textContent = ''; aviso(''); return; }
    let q;
    try { q = qrcode(0, nivel.value); q.addData(c.texto, 'Byte'); q.make(); }
    catch { vista.innerHTML = '<p class="qr-vacio">Es demasiado texto para un QR.</p>'; aviso('Es demasiado texto para un código QR. Acórtalo o usa un enlace.'); return; }
    const n = q.getModuleCount(), l1 = lum(color.value), l2 = lum(fondo.value), contraste = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    aviso(contraste < 3 ? 'Los colores se parecen mucho: algunos celulares no van a poder leer el código. Usa un color oscuro sobre fondo claro.' : l1 > l2 ? 'Ojo: un QR claro sobre fondo oscuro no lo leen todas las cámaras. Lo más seguro es oscuro sobre claro.' : '');
    actual = { q, n, c };
    const cv = dibujar(Math.min(+tam.value, 720));
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Código QR de ' + c.etiqueta);
    vista.replaceChildren(cv);
    const muestra = tipo() === 'wifi' || tipo() === 'texto' ? c.etiqueta : c.texto;
    info.textContent = (tipo() === 'wifi' ? 'Conecta a la ' : tipo() === 'texto' ? 'Muestra: ' : 'Lleva a: ') + (muestra.length > 90 ? muestra.slice(0, 88) + '…' : muestra);
    png.disabled = svg.disabled = false;
  }

  function dibujar(px) {
    const { q, n } = actual, total = n + 8, m = px / total, a = i => Math.round(i * m);
    const cv = document.createElement('canvas'); cv.width = cv.height = px;
    const cx = cv.getContext('2d'); cx.fillStyle = fondo.value; cx.fillRect(0, 0, px, px); cx.fillStyle = color.value;
    // bordes redondeados a píxeles enteros: sin rayas entre módulos y con el tamaño exacto pedido
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) cx.fillRect(a(k + 4), a(r + 4), a(k + 5) - a(k + 4), a(r + 5) - a(r + 4));
    return cv;
  }
  function textoSvg() {
    const { q, n } = actual, total = n + 8;
    let d = '';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) d += 'M' + (k + 4) + ' ' + (r + 4) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="' + fondo.value + '"/><path d="' + d + '" fill="' + color.value + '"/></svg>';
  }
  const archivo = ext => (nombre.value.trim() || 'codigo-qr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) + '.' + ext;

  raiz.addEventListener('input', hacer);
  raiz.addEventListener('change', hacer);
  png.addEventListener('click', () => { if (actual) dibujar(+tam.value).toBlob(b => b && bajar(b, archivo('png')), 'image/png'); });
  svg.addEventListener('click', () => { if (actual) bajar(new Blob([textoSvg()], { type: 'image/svg+xml' }), archivo('svg')); });
  hacer();
  raiz.classList.add('di-listo');
}
