(function(){
  'use strict';

  var PHONE = '528117804869';
  var EMAIL = 'vorkamexico@gmail.com';
  var FORMSUBMIT = 'https://formsubmit.co/ajax/' + EMAIL;
  var serviceLabel = document.documentElement.getAttribute('data-service') || 'general';
  var serviceMap = {
    'estrategia':'Estrategia y Dirección',
    'liderazgo':'Liderazgo y Talento',
    'comunicacion':'Comunicación e Influencia'
  };
  var serviceName = serviceMap[serviceLabel] || 'Vorka';
  var WA_MSG = 'Hola Vorka, quiero avanzar con el servicio de ' + serviceName + '.';

  function waURL(){ return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(WA_MSG); }

  var wa = document.getElementById('cta-wa'); if(wa) wa.href = waURL();
  var footWa = document.getElementById('foot-wa'); if(footWa) footWa.href = waURL();
  var footMail = document.getElementById('foot-mail'); if(footMail) footMail.href = 'mailto:' + EMAIL;

  function validEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }
  function setErr(field, on){
    var wrap = field.closest('.field');
    if(wrap) wrap.classList.toggle('has-error', !!on);
  }

  var form = document.getElementById('lead-form');
  var success = document.getElementById('lead-success');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var d = {
      nombre: form.elements['nombre'].value.trim(),
      correo: form.elements['correo'].value.trim(),
      organizacion: form.elements['organizacion'].value.trim(),
      telefono: form.elements['telefono'].value.trim(),
      mensaje: form.elements['mensaje'].value.trim()
    };
    var errs = 0;
    if(!d.nombre){ setErr(form.elements['nombre'], true); errs++; } else setErr(form.elements['nombre'], false);
    if(!d.correo || !validEmail(d.correo)){ setErr(form.elements['correo'], true); errs++; } else setErr(form.elements['correo'], false);
    if(!d.organizacion){ setErr(form.elements['organizacion'], true); errs++; } else setErr(form.elements['organizacion'], false);
    if(!d.mensaje){ setErr(form.elements['mensaje'], true); errs++; } else setErr(form.elements['mensaje'], false);
    if(errs > 0){ form.querySelector('.has-error input, .has-error textarea').focus(); return; }

    var btn = form.querySelector('button[type=submit]');
    var lbl = btn.textContent; btn.disabled = true; btn.textContent = 'Enviando…';

    fetch(FORMSUBMIT, {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({
        Tipo:'Solicitud de servicio — ' + serviceName,
        Servicio: serviceName,
        Nombre: d.nombre,
        Correo: d.correo,
        'Organización / Cargo': d.organizacion,
        'Teléfono': d.telefono || '—',
        'Mensaje': d.mensaje,
        _subject:'Solicitud [' + serviceName + '] — ' + d.nombre + ' (' + d.organizacion + ')',
        _template:'table',
        _captcha:'false',
        _replyto: d.correo
      })
    })
    .then(function(r){ if(!r.ok) throw new Error(); return r.json(); })
    .then(function(){
      form.style.display = 'none';
      if(success){ success.hidden = false; success.scrollIntoView({behavior:'smooth', block:'center'}); }
    })
    .catch(function(){
      btn.disabled = false; btn.textContent = lbl;
      alert('No pudimos enviar tu solicitud ahora. Escríbenos directo a ' + EMAIL);
    });
  });
})();
