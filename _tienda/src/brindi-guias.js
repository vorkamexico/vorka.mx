// Guía propia de cada tipo de evento en /tienda/brindi/<tipo>/: qué poner en la invitación, cuándo mandarla y dudas de ese evento.
// Hace que cada página sea distinta de verdad (si no, Google las ve como duplicadas y elige otra como canónica).
// Solo menciona funciones que la página de ese evento ya anuncia; los tiempos son sugerencias, no reglas.
export const GUIAS = {
  bodas: {
    titulo: 'Guía rápida para la invitación de su boda',
    intro: 'Lo que sus invitados necesitan saber, en el orden en que lo van a buscar, y cuándo conviene mandarla.',
    incluir: [
      ['Sus nombres y la fecha', 'Lo primero que se ve al abrir el sobre. Si la ceremonia y la recepción son en días distintos, pongan los dos.'],
      ['Padres y padrinos', 'Es costumbre nombrarlos; en Brindi tienen su propia sección para que no se amontone el texto.'],
      ['Itinerario', 'Ceremonia religiosa o civil, recepción y horarios. Con el mapa de cada lugar, nadie se pierde.'],
      ['Mesa de regalos', 'El enlace o el número de evento de su mesa, para que no tengan que preguntarles.'],
      ['Hospedaje', 'Si vienen invitados de otra ciudad, el hotel sugerido y cómo reservar.'],
      ['Lugares reservados', 'Cuántos lugares tiene cada familia. Cada invitado confirma solo los suyos y así nadie lleva acompañantes de más.'],
    ],
    tiempos: [
      ['4 a 6 meses antes', 'Un "Reserva la fecha" si hay invitados que tienen que viajar.'],
      ['6 a 8 semanas antes', 'La invitación completa, con una fecha límite para confirmar.'],
      ['2 semanas antes de la fecha límite', 'Un recordatorio solo a quienes no han respondido.'],
      ['La semana de la boda', 'Si cambia un horario o un lugar, lo corrigen y todos ven el dato nuevo en el mismo enlace.'],
    ],
    preguntas: [
      ['¿Podemos mandar una invitación distinta a cada familia?', 'Sí. Cada invitado tiene su enlace personal listo para WhatsApp, con su nombre y los lugares que le reservaron. También pueden usar un enlace general o un QR para todos.'],
      ['¿Cómo sabemos cuántos van a ir?', 'En su panel ven en tiempo real quién confirmó, cuántos lugares usó cada familia y quién falta por responder.'],
      ['¿Se ve bien en el celular de los abuelos?', 'Se abre como una página web en cualquier celular, sin instalar nada. Si alguien prefiere papel, pueden imprimir el QR en una tarjeta sencilla.'],
    ],
  },
  'xv-anos': {
    titulo: 'Guía rápida para la invitación de XV años',
    intro: 'Qué poner para que tus invitados lleguen a tiempo al vals y cuándo mandarla.',
    incluir: [
      ['Nombre de la quinceañera y fecha', 'Con una cuenta regresiva que se ve en cuanto abren la invitación.'],
      ['Papás y padrinos', 'Padrinos de velación, de anillo, de última muñeca o los que tengan: cada uno en su lugar.'],
      ['Misa y recepción', 'Horarios y mapa de cada lugar, para que nadie llegue cuando ya pasó el vals.'],
      ['Itinerario de la noche', 'Recepción, vals, cena y fiesta: ayuda a que la familia sepa a qué hora no se puede perder nada.'],
      ['Código de vestimenta', 'Si hay un color reservado para la quinceañera o las damas, dilo desde el principio.'],
      ['Galería', 'Fotos de la sesión previa para que tus invitados lleguen emocionados.'],
    ],
    tiempos: [
      ['2 a 3 meses antes', 'Avisa la fecha a padrinos y familia que viene de fuera.'],
      ['5 a 6 semanas antes', 'Manda la invitación completa con fecha límite para confirmar.'],
      ['1 semana antes de la fecha límite', 'Recuerda solo a quienes no han respondido.'],
      ['Después de la fiesta', 'Puedes dejarla en línea como recuerdo con la galería.'],
    ],
    preguntas: [
      ['¿Cada invitado puede confirmar cuántos van?', 'Sí. Confirma solo los lugares que le reservaste, así sabes cuántas mesas apartar.'],
      ['¿La puedo mandar por WhatsApp?', 'Sí. Cada invitado tiene su enlace personal listo para WhatsApp, o puedes usar un enlace general o un QR.'],
      ['¿Puedo cambiar algo después de mandarla?', 'Sí. Corriges el dato y todos lo ven al instante en el mismo enlace, sin volver a mandar nada.'],
    ],
  },
  bautizo: {
    titulo: 'Guía rápida para la invitación de bautizo',
    intro: 'Un bautizo suele ser más pequeño y con menos tiempo para organizar: esto es lo esencial.',
    incluir: [
      ['Nombre del bebé y fecha', 'Y, si quieren, una foto.'],
      ['Papás y padrinos', 'Con sus nombres completos, como se acostumbra.'],
      ['Ceremonia', 'Parroquia, hora y mapa para llegar.'],
      ['Comida o recepción', 'Lugar, hora y mapa, si es en otro sitio.'],
      ['Confirmación', 'Con fecha límite, para calcular la comida sin adivinar.'],
    ],
    tiempos: [
      ['3 a 4 semanas antes', 'Manda la invitación con fecha límite para confirmar.'],
      ['1 semana antes', 'Revisa quién falta y recuérdale solo a esas personas.'],
      ['El día anterior', 'Si cambia la hora de la misa, lo corriges y todos ven el dato nuevo.'],
    ],
    preguntas: [
      ['¿Vale la pena para pocos invitados?', 'El plan más pequeño es para hasta 150 invitados y es un solo pago. Si es una reunión muy pequeña e informal, Cupo es gratis hasta 30 personas.'],
      ['¿Mis invitados necesitan descargar algo?', 'No. La invitación se abre como una página web en cualquier celular.'],
      ['¿Puedo saber quién no ha confirmado?', 'Sí. En tu panel ves quién confirmó, cuántos van y quién falta por responder.'],
    ],
  },
  graduacion: {
    titulo: 'Guía rápida para la invitación de graduación',
    intro: 'Ceremonia, cena y brindis suelen ser en lugares y horarios distintos: así lo pones todo en un solo enlace.',
    incluir: [
      ['Nombre del graduado y generación', 'Escuela, carrera o nivel y la fecha.'],
      ['Ceremonia', 'Lugar, hora y si hay boletos o lugares limitados.'],
      ['Cena o fiesta', 'Lugar, hora y mapa, si es aparte.'],
      ['Programa', 'El orden de la noche: entrega de documentos, cena, brindis y fiesta.'],
      ['Confirmación', 'Para saber cuántos lugares apartar en la ceremonia y en la cena.'],
    ],
    tiempos: [
      ['En cuanto tengas fecha', 'Avisa a la familia que viene de fuera.'],
      ['4 a 6 semanas antes', 'Manda la invitación completa con fecha límite.'],
      ['1 semana antes de la fecha límite', 'Recuerda solo a quienes no han respondido.'],
    ],
    preguntas: [
      ['¿Sirve para la graduación de todo un grupo?', 'Sí. Puedes compartir un enlace general o un QR con todo el grupo y cada invitado confirma desde su celular.'],
      ['¿Puedo poner la ceremonia y la cena en la misma invitación?', 'Sí. Cada parte lleva su lugar, su hora y su mapa.'],
      ['¿Cómo la comparto?', 'Por WhatsApp con un enlace, o con un QR que puedes imprimir o poner en una presentación.'],
    ],
  },
  posadas: {
    titulo: 'Guía rápida para la posada o el evento de tu empresa',
    intro: 'Para que Recursos Humanos sepa cuántos van, sin hojas de cálculo ni correos de ida y vuelta.',
    incluir: [
      ['Evento, fecha y lugar', 'Con mapa y estacionamiento, si lo hay.'],
      ['Horario y programa', 'Cena, rifa, reconocimientos o lo que tengan planeado.'],
      ['Código de vestimenta', 'Si hay temática, dilo desde el principio.'],
      ['Acompañantes', 'Si cada colaborador puede llevar a alguien, asigna los lugares desde la lista.'],
      ['Acceso con QR', 'Con Premium, cada colaborador recibe su pase y tu equipo lo escanea en la entrada.'],
    ],
    tiempos: [
      ['4 a 6 semanas antes', 'Manda la invitación con fecha límite para confirmar.'],
      ['2 semanas antes', 'Recuerda solo a quienes no han respondido y ajusta el número para el lugar y la comida.'],
      ['El día del evento', 'Tu equipo escanea los pases en la entrada (Premium).'],
    ],
    preguntas: [
      ['¿Sirve para muchas personas?', 'Sí. Eliges el plan según cuántos invitados tienes; con Premium se suman los pases con QR para la entrada.'],
      ['¿Cómo sé cuántos van?', 'En tu panel ves en tiempo real quién confirmó y cuántos son, y quién falta por responder.'],
      ['¿Dan factura?', 'Sí. Escribe a hola@vorka.mx con tus datos fiscales después de pagar.'],
    ],
  },
  organizadores: {
    titulo: 'Cómo lo usan los organizadores',
    intro: 'Un flujo que puedes repetir con cada cliente.',
    incluir: [
      ['Armas la invitación', 'Desde tu cuenta, con los datos que te da tu cliente.'],
      ['Tu cliente la revisa', 'Le compartes la vista previa antes de publicarla.'],
      ['Se manda por WhatsApp', 'Con enlaces personales por invitado o un enlace general.'],
      ['Sigues las confirmaciones', 'Ves quién confirmó y cuántos son, sin perseguir a nadie.'],
    ],
    tiempos: [
      ['Al cerrar el contrato', 'Ofrece la invitación digital como parte de tu servicio.'],
      ['6 a 8 semanas antes del evento', 'Publica la invitación y fija la fecha límite.'],
      ['La semana del evento', 'Entrega a tu cliente la lista final de confirmados.'],
    ],
    preguntas: [
      ['¿Mis clientes ven mi marca?', 'Puedes pedir una plantilla con tu logo, tus colores y tu tipografía desde tu portal de organizador; te cotizamos sin compromiso.'],
      ['¿Cómo gano por recomendar?', 'Con tu liga de Puntos Vorka, cada cliente que contrata Brindi te da puntos (1 punto = $1 en la tienda).'],
    ],
  },
};
