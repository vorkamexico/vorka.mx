/* Ana Laura · Makeup · tienda conectada a Vende (https://vende.vorka.mx)
   - Productos, precios, existencias y totales: de la API pública de Vende (fuente única).
   - CATALOGO (abajo): textos largos y fotos de cada producto, ligados por el id de Vende (o por nombre).
   - Si la API no responde o la tienda aún no recibe pedidos: se muestra este catálogo y la bolsa se manda por WhatsApp.
   - La bolsa vive en localStorage (con try/catch: si el navegador no deja guardar, funciona igual en memoria). */
(function () {
  'use strict';

  var SLUG = 'ana-laura-hernandez';
  var API = 'https://vende.vorka.mx/api/tienda/' + SLUG;
  var PEDIDO_URL = 'https://vende.vorka.mx/v/' + SLUG + '/pedido/';
  var WA = '524613535315';
  var K_BOLSA = 'al-makeup-bolsa-v1';
  var K_PEDIDO = 'al-makeup-pedido-v1';
  var ENVIO_GRATIS_C = 300000; // solo para el modo WhatsApp; en línea lo calcula Vende
  var ENVIO_MAX_C = 25000;
  var ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila',
    'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];

  // ---------------- Catálogo de Ana Laura (textos del catálogo oficial) ----------------
  var CATALOGO = [
    {
      slug: 'base-liquida-mate', id: 'ad42ff9c-8a27-444b-b634-6262c8b4261d', nombre: 'Base Líquida Mate', categoria: 'Rostro', precio: 900, contenido: '40 g',
      etiqueta: 'Cobertura media', resumen: 'Cobertura media con acabado mate natural y auténtico efecto segunda piel.',
      fotos: [{ src: 'img/base-liquida-frente.webp', w: 195, h: 605, alt: 'Base Líquida Mate Ana Laura, frente' }],
      parrafos: [
        'La Base Líquida Mate Ana Laura es maquillaje de nivel profesional, creada para quienes buscan resultados visibles, piel impecable y un acabado que se nota desde la primera aplicación.',
        'Su fórmula no comedogénica y Cruelty Free está diseñada para cuidar la piel mientras la perfecciona, ofreciendo un desempeño superior frente a bases convencionales. No solo cubre: eleva la calidad visual de tu piel.',
        'Gracias a su tecnología de adaptación, sin importar el tono que tengas, la base se integra de manera natural con tu piel, logrando un auténtico efecto segunda piel. El acabado mate natural deja el rostro uniforme, pulido y equilibrado, ideal tanto para el uso diario como para trabajos de maquillaje más exigentes.',
        'Su efecto 3D mejora visualmente la textura del rostro, aportando profundidad, uniformidad y un aspecto más profesional desde cualquier ángulo. Es la base que cumple cuando necesitas que tu maquillaje se vea bien en persona y se sienta correcto durante todo el día.'
      ],
      lista: { titulo: '¿Por qué elegirla?', items: ['Maquillaje de nivel profesional', 'Cruelty Free', 'Fórmula no comedogénica', 'Tecnología de adaptación que se integra a tu tono de piel', 'Acabado mate natural', 'Efecto 3D para una piel más uniforme y perfeccionada', 'Textura ligera y fácil de difuminar'] },
      tip: { titulo: 'Tip profesional de aplicación', texto: 'Aplica poca cantidad y difumina bien. Construye cobertura solo donde lo necesites para lograr un acabado más limpio y profesional.' }
    },
    {
      slug: 'base-en-crema-cobertura-maxima', id: '1d3c8a4d-4335-4f43-b382-75c9f5232efb', nombre: 'Base en Crema Cobertura Máxima', categoria: 'Rostro', precio: 900, contenido: '30 ml',
      etiqueta: 'Cobertura máxima', resumen: 'Cobertura impresionante y larga duración, aun en condiciones exigentes.',
      fotos: [{ src: 'img/base-crema.webp', w: 250, h: 555, alt: 'Base en Crema Cobertura Máxima Ana Laura, 30 ml' }],
      parrafos: [
        'La Base en Crema Máxima Cobertura Ana Laura es el maquillaje ideal para quienes exigen resultados de alto impacto: cobertura impresionante, piel uniforme desde la primera aplicación y un acabado que se mantiene durante horas, aun en condiciones exigentes.',
        'Su fórmula cremosa y altamente pigmentada está diseñada para ocultar imperfecciones, manchas y desigualdades de tono, ofreciendo un rendimiento superior a bases convencionales. No solo cubre: transforma la apariencia de tu piel, perfeccionándola con un acabado impecable que se ve profesional.',
        'Gracias a su textura en crema de alta densidad, la base se funde con la piel sin dejar sensación pesada, logrando un aspecto uniforme y pulido. Su cobertura máxima camufla imperfecciones visibles mientras mantiene un acabado natural y sofisticado, ideal tanto para uso diario si quieres un look fuerte, como para maquillaje social y sesiones fotográficas.',
        'La fórmula ha sido desarrollada para ofrecer larga duración, resistiendo sudor, calor y el paso del tiempo sin desvanecerse ni marcar parches. Además, se difumina fácilmente con brocha, esponja o dedos, permitiéndote construir cobertura según lo necesites sin generar un efecto apelmazado.'
      ],
      lista: { titulo: '¿Por qué elegirla?', items: ['Cobertura máxima que oculta imperfecciones visibles', 'Textura en crema de acabado impecable', 'Fórmula de larga duración para todo el día', 'Se integra con naturalidad a tu tono de piel', 'Acabado profesional sin sensación pesada', 'Fácil de aplicar y difuminar'] },
      tip: { titulo: 'Tip profesional de aplicación', texto: 'Para un acabado perfecto, hidrata tu piel antes de aplicar la base. Empieza con una capa ligera y construye la cobertura solo en las zonas que lo necesites para mantener un acabado uniforme y sin exceso de producto.' }
    },
    {
      slug: 'corrector-camouflage', id: '46bb533d-d272-4604-99d0-420ee3ee224a', nombre: 'Corrector en Crema Camouflage', categoria: 'Rostro', precio: 350, contenido: '5.7 g',
      etiqueta: 'Tono Yellow', resumen: 'Tono Yellow para neutralizar ojeras y manchas oscuras con muy poca cantidad.',
      fotos: [{ src: 'img/corrector-frente.webp', w: 280, h: 280, alt: 'Corrector en Crema Camouflage Ana Laura, tono Yellow, abierto' }, { src: 'img/corrector-reverso.webp', w: 280, h: 280, alt: 'Corrector en Crema Camouflage Ana Laura, reverso con ingredientes' }],
      parrafos: [
        'El Corrector en Crema Camouflage Ana Laura es una herramienta de maquillaje de alto rendimiento, diseñada para neutralizar, corregir y cubrir imperfecciones con precisión profesional desde la primera aplicación.',
        'Su alta concentración de pigmento permite corregir ojeras, manchas, rojeces y zonas oscurecidas sin necesidad de aplicar grandes cantidades. El tono Yellow está especialmente formulado para neutralizar tonos morados y violáceos, logrando una corrección limpia antes de la base o el corrector final.',
        'Su fórmula no comedogénica y Cruelty Free está diseñada para cuidar la piel mientras la perfecciona, ofreciendo un desempeño superior frente a correctores convencionales. No solo cubre: eleva la calidad visual de tu piel.',
        'Gracias a su textura cremosa y densa, el producto se adhiere perfectamente a la piel sin correrse ni marcar pliegues, manteniendo una corrección uniforme durante horas. No solo cubre: corrige visualmente el tono, mejorando el acabado del maquillaje completo.',
        'Su fórmula libre de talco y parabenos permite trabajar el producto con mayor control, ideal para maquillaje profesional, social y de alta exigencia. Funciona perfectamente para técnicas de corrección, contour correctivo y preparación de piel impecable.'
      ],
      lista: { titulo: '¿Por qué elegirlo?', items: ['Corrector tipo camouflage de alta cobertura', 'Tono Yellow ideal para neutralizar ojeras y manchas oscuras', 'Alta pigmentación con poca cantidad', 'Textura cremosa de fácil manejo', 'Fórmula libre de talco y parabenos', 'Ideal para maquillaje profesional y correctivo'] },
      tip: { titulo: 'Tip profesional de aplicación', texto: 'Aplica muy poca cantidad solo en la zona a corregir y difumina bien.' }
    },
    {
      slug: 'mineral-hd-setting-powder', id: '721fb0c2-8d99-4758-aca6-143ae075667d', nombre: 'Mineral HD Setting Powder', categoria: 'Rostro', precio: 650, contenido: '19 g',
      etiqueta: 'Translúcido', resumen: 'Sella el maquillaje, controla el brillo y difumina poros sin alterar el tono.',
      fotos: [{ src: 'img/polvo.webp', w: 465, h: 315, alt: 'Mineral HD Setting Powder Ana Laura' }],
      parrafos: [
        'El Mineral HD Setting Powder Ana Laura es el paso clave para sellar el maquillaje con un acabado impecable, ligero y de apariencia profesional, sin alterar el tono natural de la piel ni de la base.',
        'Su fórmula mineral y ultrafina está diseñada para fijar el maquillaje, controlar el brillo y perfeccionar visualmente la textura del rostro. No solo sella: refina el acabado, dejando una piel mate, uniforme y pulida, ideal tanto para uso diario como para fotografía y video.',
        'Su fórmula no comedogénica y Cruelty Free está diseñada para sellar el maquillaje y cuidar la piel, ofreciendo un acabado más limpio y duradero frente a polvos convencionales. No solo fija: perfecciona visualmente la textura de la piel, dejando un acabado uniforme, mate y profesional.',
        'Gracias a su tecnología HD, difumina ópticamente poros y líneas finas, creando un efecto de piel más lisa desde cualquier ángulo. Al ser translúcido, se adapta a todos los tonos de piel sin dejar efecto blanco ni sensación pesada.',
        'Su textura ligera permite trabajar el producto en capas, sellando zonas específicas o todo el rostro sin sobrecargar el maquillaje. Es el polvo ideal para lograr un acabado limpio, duradero y profesional.'
      ],
      lista: { titulo: '¿Por qué elegirlo?', items: ['Polvo mineral HD de acabado profesional', 'No altera el tono de la base ni del corrector', 'Controla el brillo y fija el maquillaje', 'Difumina visualmente poros y líneas finas', 'Textura ultrafina y ligera', 'Ideal para fotografía, video y uso diario'] },
      tip: { titulo: 'Tip profesional de aplicación', texto: 'Aplica con brocha para un acabado natural o con esponja para sellar zonas específicas. Retira el exceso para una piel más limpia y equilibrada.' }
    },
    {
      slug: 'simply-clean', id: '1f662b45-a4bc-4291-839d-b3f5014cf6fa', nombre: 'Simply Clean Eye Makeup Remover', categoria: 'Cuidado', precio: 800, contenido: '118 ml (4.0 fl oz)',
      etiqueta: 'Desmaquillante en spray', resumen: 'Desmaquillante y limpiador en spray con Aloe Vera: remueve sin frotar ni irritar.',
      fotos: [{ src: 'img/desmaquillante.webp', w: 110, h: 245, alt: 'Simply Clean Eye Makeup Remover Ana Laura, 118 ml' }],
      parrafos: [
        'Simply Clean Eye Makeup Remover Ana Laura es un limpiador–desmaquillante en spray de grado profesional, formulado para remover el maquillaje de ojos de manera suave, eficaz y sin irritar.',
        'Su fórmula ligera y no agresiva elimina delicadamente los restos de maquillaje, incluso de larga duración, sin necesidad de frotar ni maltratar la piel. No solo desmaquilla: limpia y calma la zona del contorno de ojos, dejando una sensación fresca y confortable.',
        'Su fórmula no comedogénica y Cruelty Free está diseñada para cuidar la piel, ofreciendo un desempeño superior. Limpia y cuida tu piel al mismo tiempo.',
        'Enriquecido con Aloe Vera, ayuda a hidratar, suavizar y reconfortar la piel durante la limpieza. Su textura acuosa no deja residuos grasos, lo que lo hace ideal para el uso diario y para todo tipo de piel, incluso las más sensibles.',
        'Gracias a su presentación en spray, permite una aplicación práctica, controlada e higiénica, ideal tanto para uso personal como profesional.'
      ],
      lista: { titulo: '¿Por qué elegirlo?', items: ['2 en 1, desmaquillante y limpiador facial', 'Remueve maquillaje sin irritar ni frotar', 'No deja sensación aceitosa', 'Enriquecido con Aloe Vera', 'Fórmula libre de parabenos', 'Ideal para uso diario y maquillaje profesional'] },
      tip: { titulo: 'Modo de uso', texto: 'Rocía el producto sobre un algodón y limpia suavemente el área de los ojos. Repite si es necesario.' }
    },
    {
      slug: 'shampoo-personalizado', id: 'eba363c6-24b4-408e-aba3-3509b3c7ff0b', nombre: 'Shampoo Personalizado 250 ml', alias: ['Shampoo Personalizado 250ml', 'Shampoo Personalizado'], categoria: 'Cabello', precio: 350, contenido: '250 ml',
      etiqueta: 'Personalizado', resumen: 'Formulado según tu tipo de cabello, su textura, necesidades y objetivos.',
      fotos: [{ src: 'img/shampoo.webp', w: 95, h: 245, alt: 'Shampoo personalizado Oleynick de 250 ml' }],
      parrafos: [
        'Porque ningún cabello es igual, tu shampoo tampoco debería serlo.',
        'Nuestro shampoo personalizado está diseñado para adaptarse a las necesidades reales de tu cabello. Tú nos dices y nos muestras cómo es tu pelo (tipo, textura, necesidades y objetivos) y nosotros formulamos y enviamos el shampoo que mejor le convenga a tu cabello.',
        'No es un producto genérico: es una solución pensada específicamente para ti. Ya sea que busques hidratación, control de frizz, reparación, brillo o limpieza profunda, tu shampoo se adapta a lo que tu cabello necesita en ese momento.'
      ],
      pasos: { titulo: '¿Cómo funciona?', items: ['Nos cuentas y nos muestras cómo es tu cabello', 'Analizamos tu tipo de pelo y sus necesidades', 'Te enviamos un shampoo personalizado para ti'] },
      lista: { titulo: 'Beneficios', items: ['Shampoo personalizado según tu tipo de cabello', 'Fórmula adaptada a tus necesidades', 'Ideal para todo tipo de pelo', 'Enfoque en cuidado y resultados reales'] },
      pers: { pregunta: 'Cuéntanos cómo es tu cabello: tipo, textura, necesidades y objetivos', fotos: 3, preparacion: 'Hasta 7 días hábiles' }
    },

    // ---- Ruzz Man · barbería (catálogo oficial en Canva). Mismos id que en Vende (_vende/ruzz-man.sql). ----
    {
      slug: "shaving-gel-rosa",
      id: "dfd72f6b-8c61-5a27-85c2-187d6f691f70",
      marca: "Ruzz Man",
      nombre: "Shaving Gel Rosa",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "a0562ce028885332b4a78c48c705bd67", "nombre": "250 ml", "precio": 150}, {"id": "1f24f74fd3ee544cb8602c2e2a61dae8", "nombre": "500 ml", "precio": 250}],
      contenido: "250 ml · 500 ml",
      etiqueta: "Fragancia dulce",
      fotos: [{"src": "img/ruzz/shaving-gel-rosa.webp", "w": 320, "h": 562, "alt": "Shaving Gel Rosa Ruzz Man"}],
      parrafos: ["Haz de cada afeitado una experiencia diferente con el Shaving Gel Rosa, una fragancia con un toque dulce, suave y moderno que aporta una sensación de frescura y limpieza. Su fórmula hidratante facilita el deslizamiento del rastrillo, ayuda a prevenir la irritación y deja la piel suave, protegida y con un agradable aroma que perdura.", "Ideal para barberías, salones y uso personal. Disfruta de un afeitado profesional con la fragancia de tu color favorito y una piel protegida en cada aplicación."],
      lista: {"titulo": "Beneficios", "items": ["Hidrata y protege la piel.", "Ayuda a prevenir la irritación.", "Favorece un afeitado suave y preciso.", "Apto para todo tipo de piel.", "Fragancia dulce y duradera."]}
    },
    {
      slug: "shaving-gel-verde",
      id: "653f144c-583d-5785-b5da-dd8e416b657d",
      marca: "Ruzz Man",
      nombre: "Shaving Gel Verde",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "cec1fd2089025f65829ce5db48884c41", "nombre": "250 ml", "precio": 150}, {"id": "b1af8058b036514da59b1bd9fb663116", "nombre": "500 ml", "precio": 250}],
      contenido: "250 ml · 500 ml",
      etiqueta: "Fragancia fresca",
      fotos: [{"src": "img/ruzz/shaving-gel-verde.webp", "w": 335, "h": 554, "alt": "Shaving Gel Verde Ruzz Man"}],
      parrafos: ["Experimenta un afeitado refrescante con el Shaving Gel Verde, una fragancia inspirada en la frescura y vitalidad que brinda una sensación revitalizante durante y después del afeitado. Su fórmula hidratante ayuda a proteger la piel, facilita el deslizamiento del rastrillo y contribuye a reducir la irritación, dejando un acabado suave y confortable.", "Ideal para barberías, salones y uso personal. Disfruta de un afeitado profesional con la fragancia de tu color favorito y una piel protegida en cada aplicación."],
      lista: {"titulo": "Beneficios", "items": ["Hidrata y cuida la piel.", "Ayuda a minimizar la irritación.", "Permite un afeitado más cómodo y preciso.", "Apto para todo tipo de piel.", "Fragancia fresca y revitalizante de larga duración."]}
    },
    {
      slug: "shaving-gel-morado",
      id: "af53a518-59bb-5b26-8c62-9fb2cd6b59ae",
      marca: "Ruzz Man",
      nombre: "Shaving Gel Morado",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "920fc70556895a98a75881d160466d7f", "nombre": "250 ml", "precio": 150}, {"id": "ca7e87bdcac7509baede856b1252cc1d", "nombre": "500 ml", "precio": 250}],
      contenido: "250 ml · 500 ml",
      etiqueta: "Fragancia intensa",
      fotos: [{"src": "img/ruzz/shaving-gel-morado.webp", "w": 303, "h": 602, "alt": "Shaving Gel Morado Ruzz Man"}],
      parrafos: ["Eleva tu rutina de afeitado con el Shaving Gel Morado, una fragancia con un carácter intenso, elegante y sofisticado que deja una sensación de frescura y distinción. Su fórmula hidratante permite un deslizamiento suave del rastrillo, ayuda a prevenir la irritación y protege la piel, proporcionando un acabado limpio, cómodo y con un aroma duradero.", "Ideal para barberías, salones y uso personal. Disfruta de un afeitado profesional con la fragancia de tu color favorito y una piel protegida en cada aplicación."],
      lista: {"titulo": "Beneficios", "items": ["Hidrata y protege la piel.", "Ayuda a prevenir la irritación.", "Facilita un afeitado suave y preciso.", "Apto para todo tipo de piel.", "Fragancia intensa, elegante y de larga duración."]}
    },
    {
      slug: "after-shave-rosa",
      id: "fc671f66-8cc4-5d4a-8e06-2769f7f7b96a",
      marca: "Ruzz Man",
      nombre: "After Shave Spray Rosa",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "7138fe556a2356fa9403e2689ccbc323", "nombre": "250 ml", "precio": 150}, {"id": "e295cb3e2d915e53949a6b734a1f547c", "nombre": "500 ml", "precio": 250}],
      contenido: "250 ml · 500 ml",
      etiqueta: "Fragancia dulce",
      fotos: [{"src": "img/ruzz/after-shave-rosa.webp", "w": 214, "h": 576, "alt": "After Shave Spray Rosa Ruzz Man"}],
      parrafos: ["Convierte el afeitado en una experiencia única con el After Shave Spray Rosa. Su fragancia dulce y moderna aporta un toque distintivo que permanece en la piel, mientras su fórmula hidrata, calma y ayuda a reducir la irritación posterior al afeitado. Deja una sensación de suavidad y bienestar que hace que cada servicio se sienta más completo y profesional.", "Su aroma envolvente es perfecto para quienes buscan ofrecer un detalle diferente que marque la diferencia en la experiencia del cliente.", "Ideal para Barberías y salones que desean ofrecer un servicio premium con una fragancia moderna, así como para uso personal de quienes prefieren aromas dulces y agradables."],
      lista: {"titulo": "Beneficios", "items": ["Hidrata y suaviza la piel.", "Ayuda a disminuir la irritación después del afeitado.", "Refresca y brinda una sensación de confort.", "Fragancia dulce de larga duración.", "Apto para todo tipo de piel."]}
    },
    {
      slug: "after-shave-verde",
      id: "b40159c1-b6e1-5c65-9eaa-fc5a6fdbd095",
      marca: "Ruzz Man",
      nombre: "After Shave Spray Verde",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "1659b9e08e7653adbf4ad6a5e33d6748", "nombre": "250 ml", "precio": 150}, {"id": "c251eb8767ef52dcb88c320ae7c1515e", "nombre": "500 ml", "precio": 250}],
      contenido: "250 ml · 500 ml",
      etiqueta: "Fragancia fresca",
      fotos: [{"src": "img/ruzz/after-shave-verde.webp", "w": 217, "h": 588, "alt": "After Shave Spray Verde Ruzz Man"}],
      parrafos: ["El After Shave Spray Verde ofrece una sensación revitalizante que devuelve el confort a la piel después del afeitado. Su fórmula ayuda a hidratar, refrescar y aliviar la piel, mientras su fragancia fresca y energizante deja un acabado limpio y agradable durante todo el día.", "Es una excelente opción para complementar cualquier servicio de barbería, proporcionando un toque profesional que mejora la experiencia del cliente desde el primer momento.", "Ideal para Barberías con alto flujo de clientes, salones de belleza, academias de barbería y personas que buscan una sensación de frescura y energía después de cada afeitado."],
      lista: {"titulo": "Beneficios", "items": ["Hidrata y revitaliza la piel.", "Ayuda a reducir la irritación posterior al afeitado.", "Refresca y suaviza la piel.", "Fragancia fresca y duradera.", "Apto para todo tipo de piel."]}
    },
    {
      slug: "after-shave-morado",
      id: "e3e255f1-3925-5fe7-bec7-41ee211d2c42",
      marca: "Ruzz Man",
      nombre: "After Shave Spray Morado",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "ba9a850a239c55659acca93b1b440227", "nombre": "250 ml", "precio": 150}, {"id": "4701f1176c505d31980050379b0dff33", "nombre": "500 ml", "precio": 250}],
      contenido: "250 ml · 500 ml",
      etiqueta: "Fragancia intensa",
      fotos: [{"src": "img/ruzz/after-shave-morado.webp", "w": 224, "h": 590, "alt": "After Shave Spray Morado Ruzz Man"}],
      parrafos: ["Dale un acabado elegante a cada servicio con el After Shave Spray Morado. Su fragancia intensa y sofisticada se combina con una fórmula que hidrata, calma y protege la piel después del afeitado, ayudando a reducir la irritación y dejando un aroma que transmite presencia y distinción.", "Pensado para quienes entienden que los pequeños detalles hacen la diferencia, este after shave convierte el final del afeitado en una experiencia premium que el cliente recordará.", "Ideal para Barberías premium, salones de belleza, distribuidores de productos profesionales y hombres que buscan un acabado sofisticado con una fragancia elegante y duradera."],
      lista: {"titulo": "Beneficios", "items": ["Hidrata y protege la piel.", "Ayuda a calmar la irritación y la sensibilidad.", "Suaviza y refresca el rostro.", "Fragancia intensa y de larga duración.", "Apto para todo tipo de piel."]}
    },
    {
      slug: "after-shave-gris",
      id: "03c9520a-26f1-5c1c-8e43-b7c727528dee",
      marca: "Ruzz Man",
      nombre: "After Shave Spray Gris",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "3dcad34923ed5556b40b761cc73421cc", "nombre": "250 ml", "precio": 150}, {"id": "9442b5f71db358f5984555faeca7f0b5", "nombre": "500 ml", "precio": 250}],
      contenido: "250 ml · 500 ml",
      etiqueta: "Fragancia elegante",
      fotos: [{"src": "img/ruzz/after-shave-gris.webp", "w": 231, "h": 608, "alt": "After Shave Spray Gris Ruzz Man"}],
      parrafos: ["El After Shave Spray Gris está diseñado para quienes buscan un acabado elegante y una sensación de confort después de cada afeitado. Su fórmula ayuda a hidratar y suavizar la piel, reduciendo la irritación y proporcionando una agradable sensación de frescura. Su fragancia de carácter sobrio y masculino aporta un toque de distinción que complementa cualquier servicio profesional.", "Es el aliado perfecto para ofrecer una experiencia de barbería de alto nivel, dejando al cliente con una piel revitalizada y un aroma sofisticado que perdura durante horas.", "Ideal para Barberías tradicionales, barberías premium, salones de belleza y profesionales que buscan ofrecer un servicio con una imagen clásica, elegante y de alta calidad."],
      lista: {"titulo": "Beneficios", "items": ["Hidrata y protege la piel después del afeitado.", "Ayuda a reducir la irritación y el enrojecimiento.", "Suaviza y refresca la piel al instante.", "Fragancia elegante y masculina de larga duración.", "Apto para todo tipo de piel."]}
    },
    {
      slug: "after-shave-rojo",
      id: "859f3c1b-1a91-5433-a66d-a26bdd740c60",
      marca: "Ruzz Man",
      nombre: "After Shave Spray Rojo",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "5da26b6564295498b972a74eb3c04afc", "nombre": "250 ml", "precio": 150}, {"id": "4f6de350415554ce978dd8e024b24dcd", "nombre": "500 ml", "precio": 250}],
      contenido: "250 ml · 500 ml",
      etiqueta: "Fragancia intensa",
      fotos: [{"src": "img/ruzz/after-shave-rojo.webp", "w": 231, "h": 628, "alt": "After Shave Spray Rojo Ruzz Man"}],
      parrafos: ["El After Shave Spray Rojo combina una fragancia intensa y cautivadora con una fórmula que brinda el cuidado que la piel necesita después del afeitado. Ayuda a hidratar, calmar y refrescar la piel, disminuyendo la sensación de irritación y dejando un acabado suave acompañado de un aroma con mucha personalidad.", "Pensado para quienes desean que cada servicio termine con un toque distintivo, este after shave aporta una experiencia que transmite confianza, energía y estilo desde la primera aplicación.", "Ideal para Barberías modernas, salones de belleza, distribuidores de productos profesionales y hombres que buscan un aroma con carácter para complementar su rutina de cuidado personal."],
      lista: {"titulo": "Beneficios", "items": ["Hidrata y calma la piel después del afeitado.", "Ayuda a disminuir la irritación causada por el rastrillo.", "Refresca y deja una sensación de confort inmediato.", "Fragancia intensa y duradera.", "Apto para todo tipo de piel."]}
    },
    {
      slug: "jabon-minoxidil-bergamota-romero",
      id: "6585aed1-cb23-527e-a969-a1aed9a57d04",
      marca: "Ruzz Man",
      nombre: "Jabón con Minoxidil, Bergamota y Romero",
      categoria: "Afeitado",
      precio: 150,
      etiqueta: "Piel, barba y cuero cabelludo",
      fotos: [{"src": "img/ruzz/jabon-minoxidil-bergamota-romero.webp", "w": 498, "h": 585, "alt": "Jabón con Minoxidil, Bergamota y Romero Ruzz Man"}],
      parrafos: ["Descubre el equilibrio perfecto entre limpieza y cuidado con el Jabón con Minoxidil, Bergamota y Romero de Ruzz Man. Su fórmula está diseñada para limpiar profundamente la piel, el cuero cabelludo y la barba sin resecar, proporcionando una agradable sensación de frescura y bienestar en cada uso.", "Enriquecido con minoxidil, bergamota y romero, este jabón es el complemento ideal para una rutina de cuidado personal, ayudando a mantener una piel limpia y un cabello o barba con una apariencia saludable. Sus ingredientes ofrecen una experiencia refrescante y revitalizante, ideal para el uso diario.", "Ideal para Barberías, salones de belleza, spas, estéticas, distribuidores de productos profesionales y personas que buscan complementar su rutina de cuidado personal con un jabón de uso diario formulado con ingredientes de alta calidad. Su uso es apto tanto para hombres como para mujeres que desean mantener una piel y un cabello limpios, frescos y con una apariencia saludable."],
      lista: {"titulo": "Beneficios", "items": ["Limpia profundamente sin resecar la piel.", "Enriquecido con minoxidil, bergamota y romero.", "Ayuda a mantener la piel fresca y con una sensación de hidratación.", "Ideal para el cuidado diario del cabello, la barba y el cuero cabelludo.", "Aporta una agradable sensación de frescura después de cada uso.", "Apto para todo tipo de piel."]}
    },
    {
      slug: "talco-con-aroma",
      id: "23094b5d-e04c-53f7-9589-e92115162609",
      marca: "Ruzz Man",
      nombre: "Talco con Aroma",
      categoria: "Afeitado",
      precio: 150,
      variantes: [{"id": "090205046b7d55a4b736ce9b9e34dd4f", "nombre": "150 g", "precio": 150}, {"id": "ec00261982cd50bfa154359789bac49b", "nombre": "300 g", "precio": 220}],
      contenido: "150 g · 300 g",
      etiqueta: "Ultrafino",
      fotos: [{"src": "img/ruzz/talco-con-aroma.webp", "w": 389, "h": 624, "alt": "Talco con Aroma Ruzz Man"}],
      parrafos: ["Mantén la piel fresca, seca y cómoda durante todo el día con el Talco Ultrafino. Su fórmula de textura ligera ayuda a absorber el exceso de humedad y a controlar la transpiración, proporcionando una sensación de frescura inmediata sin dejar residuos pesados. Es ideal para el uso diario y para mantener la piel protegida en cualquier momento del día.", "Además de brindar confort y frescura, su versatilidad lo convierte en un gran aliado dentro de la barbería y el salón de belleza. En el peinado, es perfecto para aportar textura y volumen al cabello, especialmente en peinados con efecto mate. También es una excelente opción para mujeres que buscan elevar el volumen desde la raíz, logrando un acabado con mayor cuerpo y movimiento sin apelmazar el cabello.", "Ideal para Barberías, salones de belleza, estilistas profesionales, academias de barbería y estética, distribuidores de productos profesionales y personas que buscan mantener la piel fresca o dar mayor volumen y textura a su peinado. Apto para hombres y mujeres, especialmente para quienes desean un acabado natural, con más cuerpo y fijación ligera en el cabello."],
      lista: {"titulo": "Beneficios", "items": ["Ayuda a absorber la humedad y el exceso de grasa.", "Contribuye a controlar la transpiración.", "Proporciona una sensación de frescura y confort.", "Textura ultrafina que se distribuye fácilmente.", "Ideal para aportar textura y volumen al cabello.", "Ayuda a elevar el peinado desde la raíz con un acabado natural y mate.", "Apto para uso diario."]}
    },
    {
      slug: "facial-scrub",
      id: "d8a27cb0-b249-5565-9fde-0825effed208",
      marca: "Ruzz Man",
      nombre: "Facial Scrub",
      categoria: "Afeitado",
      precio: 230,
      contenido: "240 ml",
      etiqueta: "Exfoliante facial",
      fotos: [{"src": "img/ruzz/facial-scrub.webp", "w": 576, "h": 485, "alt": "Facial Scrub Ruzz Man"}],
      parrafos: ["Renueva la piel con Facial Scrub, un exfoliante facial diseñado para eliminar impurezas, células muertas y el exceso de grasa, dejando el rostro limpio, suave y con una apariencia revitalizada. Su fórmula ayuda a preparar la piel para el afeitado o para cualquier rutina de cuidado facial, proporcionando una sensación de frescura desde la primera aplicación.", "Su textura exfoliante limpia profundamente sin resecar, favoreciendo una piel más uniforme y de aspecto saludable. Es el complemento ideal para quienes buscan mantener una rutina de cuidado facial profesional desde casa o en la barbería.", "Ideal para Barberías, salones de belleza, spas, estéticas, distribuidores de productos profesionales y personas que desean mantener una piel limpia, fresca y saludable como parte de su rutina de cuidado facial. Apto para hombres y mujeres."],
      lista: {"titulo": "Beneficios", "items": ["Exfolia suavemente la piel.", "Ayuda a eliminar células muertas e impurezas.", "Limpia profundamente los poros.", "Favorece una piel más suave y uniforme.", "Prepara el rostro para el afeitado y otros tratamientos faciales.", "Aporta una agradable sensación de frescura.", "Apto para todo tipo de piel."]}
    },
    {
      slug: "shampoo-minoxidil",
      id: "e8afdccb-2bb3-5dc9-936e-12abffb85340",
      marca: "Ruzz Man",
      nombre: "Shampoo con Minoxidil",
      categoria: "Cabello",
      precio: 250,
      contenido: "500 ml",
      etiqueta: "Fortalece desde la raíz",
      fotos: [{"src": "img/ruzz/shampoo-minoxidil.webp", "w": 229, "h": 616, "alt": "Shampoo con Minoxidil Ruzz Man"}],
      parrafos: ["Fortalece tu rutina de cuidado capilar con el Shampoo con Minoxidil, una fórmula diseñada para limpiar profundamente el cuero cabelludo mientras ayuda a fortalecer el cabello desde la raíz. Su uso diario contribuye a mantener el cuero cabelludo limpio, fresco y en óptimas condiciones, favoreciendo una apariencia de mayor densidad y vitalidad.", "Gracias a su fórmula de limpieza suave, elimina impurezas y el exceso de grasa sin resecar, dejando el cabello con una sensación de frescura, suavidad y manejabilidad. Es el complemento ideal para quienes buscan cuidar y fortalecer su cabello como parte de una rutina completa de cuidado capilar."],
      lista: {"titulo": "Beneficios", "items": ["Limpia profundamente el cuero cabelludo y el cabello.", "Ayuda a fortalecer el cabello desde la raíz.", "Contribuye a reducir la apariencia de la caída por quiebre.", "Favorece una apariencia de mayor volumen y densidad.", "Aporta frescura, suavidad y brillo natural.", "Ideal para uso diario.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "smooth-pre-hair-cut",
      id: "ec504a8e-27c2-5796-81d5-96d7f58fd015",
      marca: "Ruzz Man",
      nombre: "Smooth Pre Hair Cut",
      categoria: "Cabello",
      precio: 270,
      contenido: "500 ml",
      etiqueta: "Crema pre corte",
      fotos: [{"src": "img/ruzz/smooth-pre-hair-cut.webp", "w": 217, "h": 592, "alt": "Smooth Pre Hair Cut Ruzz Man"}],
      parrafos: ["Prepara el cabello para un corte más preciso con Smooth Pre Hair Cut, la crema pre corte diseñada para facilitar el trabajo del estilista o barbero desde el primer paso. Su fórmula ayuda a suavizar y acondicionar el cabello, mejorando su manejabilidad para lograr cortes más limpios, uniformes y con mayor control.", "Ideal para Barberías, salones de belleza, academias de barbería y estilismo, distribuidores de productos profesionales y personas que desean preparar el cabello antes del corte para obtener un acabado más limpio, preciso y profesional. Apto para hombres, mujeres y niños, ya que puede utilizarse en cualquier tipo de cabello antes del servicio de corte."],
      lista: {"titulo": "Beneficios", "items": ["Suaviza y acondiciona el cabello antes del corte.", "Facilita el peinado y el manejo del cabello.", "Ayuda a realizar cortes más precisos y uniformes.", "Aporta hidratación ligera sin dejar residuos grasos.", "Reduce el frizz y mejora el control durante el servicio.", "Apto para todo tipo de cabello.", "Ideal para uso profesional y personal."]}
    },
    {
      slug: "acondicionador-aceite-minoxidil",
      id: "e1eeb5b6-19c5-5c64-8cc8-e6ac186710ce",
      marca: "Ruzz Man",
      nombre: "Acondicionador en Aceite + Minoxidil",
      categoria: "Cabello",
      precio: 200,
      contenido: "50 ml",
      etiqueta: "Bergamota y aminoácidos",
      fotos: [{"src": "img/ruzz/acondicionador-aceite-minoxidil.webp", "w": 176, "h": 592, "alt": "Acondicionador en Aceite + Minoxidil Ruzz Man"}],
      parrafos: ["Dale a tu rutina capilar un impulso de nutrición y cuidado con Hair Minoxidil, un aceite enriquecido con bergamota y aminoácidos, formulado para ayudar a mantener un cabello con una apariencia más fuerte, suave y saludable. Su textura ligera facilita la aplicación sin dejar una sensación pesada, permitiendo que el cabello luzca con mayor brillo, hidratación y vitalidad.", "Gracias a su combinación de ingredientes, ayuda a acondicionar el cabello, controlar el frizz y mejorar su manejabilidad, convirtiéndose en el complemento ideal para una rutina de cuidado capilar diaria. Es perfecto para quienes buscan mantener un cabello bien cuidado y con una apariencia saludable desde la raíz hasta las puntas.", "Ideal para Barberías, salones de belleza, estéticas, academias de estilismo, distribuidores de productos profesionales y personas que desean complementar su rutina de cuidado capilar con un aceite de uso diario. Apto para hombres y mujeres que buscan mantener un cabello hidratado, nutrido y con una apariencia más saludable."],
      lista: {"titulo": "Beneficios", "items": ["Ayuda a fortalecer la apariencia del cabello.", "Nutre e hidrata la fibra capilar.", "Enriquecido con bergamota y aminoácidos.", "Favorece un cabello más suave, brillante y manejable.", "Ayuda a controlar el frizz y el cabello rebelde.", "Textura ligera de rápida absorción.", "Ideal para uso diario.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "acondicionador-aceite",
      id: "a72bc784-35ae-5211-bd19-44361ae97316",
      marca: "Ruzz Man",
      nombre: "Acondicionador en Aceite",
      categoria: "Cabello",
      precio: 200,
      contenido: "50 ml",
      etiqueta: "Nutre sin engrasar",
      fotos: [{"src": "img/ruzz/acondicionador-aceite.webp", "w": 196, "h": 660, "alt": "Acondicionador en Aceite Ruzz Man"}],
      parrafos: ["Dale a tu cabello el cuidado que merece con el Acondicionador en Aceite, una fórmula diseñada para nutrir, suavizar e hidratar la fibra capilar sin dejar sensación pesada. Su textura ligera ayuda a mejorar la manejabilidad del cabello, aportando brillo natural y una apariencia saludable desde la primera aplicación.", "Ideal para Barberías, salones de belleza, estéticas, academias de estilismo, distribuidores de productos profesionales y personas que desean mantener su cabello hidratado, suave y con un aspecto saludable. Apto para hombres y mujeres, especialmente para cabellos secos, maltratados, con frizz o que requieren un extra de nutrición y brillo."],
      lista: {"titulo": "Beneficios", "items": ["Nutre e hidrata profundamente el cabello.", "Ayuda a controlar el frizz y el cabello rebelde.", "Facilita el peinado y mejora la manejabilidad.", "Aporta brillo natural y suavidad.", "Textura ligera de rápida absorción.", "No deja sensación grasosa.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "bifasic24",
      id: "4df8febf-6118-55dd-9c22-71d01b585b12",
      marca: "Ruzz Man",
      nombre: "Bifasic24 Tratamiento Capilar",
      categoria: "Cabello",
      precio: 250,
      contenido: "250 ml",
      etiqueta: "Sin enjuague",
      fotos: [{"src": "img/ruzz/bifasic24.webp", "w": 238, "h": 611, "alt": "Bifasic24 Tratamiento Capilar Ruzz Man"}],
      parrafos: ["Devuélvele vida a tu cabello con Bifasic24, un tratamiento capilar bifásico formulado para hidratar, nutrir y proteger la fibra capilar durante todo el día. Su fórmula ayuda a desenredar el cabello con facilidad, controlar el frizz y aportar un brillo saludable, dejando una sensación de suavidad y ligereza desde la primera aplicación.", "Gracias a su acción hidratante de hasta 24 horas, es el complemento ideal para el cuidado diario, ayudando a mantener el cabello manejable, sedoso y con una apariencia saludable sin necesidad de enjuague.", "Ideal para Salones de belleza, barberías, estéticas, academias de estilismo, distribuidores de productos profesionales y personas que desean mantener su cabello hidratado, suave y fácil de peinar. Apto para hombres, mujeres y niños, especialmente para cabellos secos, maltratados o con tendencia al frizz."],
      lista: {"titulo": "Beneficios", "items": ["Ayuda a desenredar el cabello fácilmente.", "Proporciona hidratación de larga duración.", "Nutre la fibra capilar.", "Controla el frizz y el cabello rebelde.", "Aporta brillo y suavidad.", "No requiere enjuague.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "minoxidil-7",
      id: "c42e93d0-56e5-50c5-95ba-ea2d50b2b30d",
      marca: "Ruzz Man",
      nombre: "Minoxidil 7% + Bergamota",
      categoria: "Cabello",
      precio: 250,
      contenido: "30 ml",
      etiqueta: "Concentración 7%",
      fotos: [{"src": "img/ruzz/minoxidil-7.webp", "w": 170, "h": 493, "alt": "Minoxidil 7% + Bergamota Ruzz Man"}],
      parrafos: ["Para quienes buscan una concentración mayor, el Minoxidil + Bergamota 7% ofrece una fórmula diseñada para complementar el cuidado capilar con una aplicación práctica y cómoda. Su textura ligera permite una distribución uniforme y una rápida absorción, mientras la bergamota proporciona una sensación refrescante.", "Es una excelente alternativa para quienes desean fortalecer su rutina diaria de cuidado personal.", "Ideal para Barberías, estéticas, distribuidores especializados y personas que buscan una concentración superior de minoxidil para complementar su rutina de cuidado capilar."],
      lista: {"titulo": "Beneficios", "items": ["Solución concentrada al 7%.", "Fácil aplicación.", "Rápida absorción.", "Fórmula enriquecida con bergamota.", "Ideal para uso continuo."]}
    },
    {
      slug: "minoxidil-10",
      id: "61767d15-dd4b-56cf-bb70-64b76be24f6c",
      marca: "Ruzz Man",
      nombre: "Minoxidil 10% + Bergamota",
      categoria: "Cabello",
      precio: 270,
      contenido: "30 ml",
      etiqueta: "Concentración 10%",
      fotos: [{"src": "img/ruzz/minoxidil-10.webp", "w": 169, "h": 491, "alt": "Minoxidil 10% + Bergamota Ruzz Man"}],
      parrafos: ["El Minoxidil + Bergamota 10% está desarrollado para quienes prefieren una solución de mayor concentración como parte de su rutina de cuidado capilar. Su fórmula facilita una aplicación uniforme y rápida, proporcionando una experiencia cómoda y práctica para el uso diario.", "Gracias a su presentación compacta, es ideal para llevarlo a cualquier lugar y mantener la constancia en la aplicación.", "Ideal para Barberías, salones de belleza, profesionales del cuidado capilar y personas que buscan una concentración más alta de minoxidil dentro de su rutina diaria."],
      lista: {"titulo": "Beneficios", "items": ["Solución concentrada al 10%.", "Fácil aplicación.", "Rápida absorción.", "Presentación práctica.", "Complementa la rutina de cuidado capilar."]}
    },
    {
      slug: "gel-natural-extra-fuerte",
      id: "314c2f43-772d-5b8a-a3ce-0419fd98bf73",
      marca: "Ruzz Man",
      nombre: "Gel Natural Extra Fuerte",
      categoria: "Peinado",
      precio: 160,
      variantes: [{"id": "e8662313c38e5de8a06855a94b8821dc", "nombre": "250 g", "precio": 160}, {"id": "35df6517f95f502c962c53a234664405", "nombre": "500 g", "precio": 230}, {"id": "29d0889f68ad5e53a39b73dce1218846", "nombre": "1000 g", "precio": 350}],
      contenido: "250 g · 500 g · 1000 g",
      etiqueta: "Fijación extra fuerte",
      fotos: [{"src": "img/ruzz/gel-natural-extra-fuerte.webp", "w": 800, "h": 472, "alt": "Gel Natural Extra Fuerte Ruzz Man"}],
      parrafos: ["Consigue un peinado firme y con acabado natural gracias al Gel Natural Azul. Su fórmula proporciona una fijación extra fuerte que mantiene el cabello en su lugar durante horas sin dejar residuos visibles ni sensación pegajosa. Ideal para crear peinados definidos, clásicos o modernos, ofreciendo control y una apariencia impecable durante todo el día.", "Ideal para Barberías, salones de belleza, estilistas profesionales y personas que buscan una fijación resistente para peinados que requieren máxima duración sin perder un acabado natural."],
      lista: {"titulo": "Beneficios", "items": ["Fijación extra fuerte de larga duración.", "No deja residuos visibles.", "Ayuda a mantener el peinado por más tiempo.", "Acabado natural y ligero.", "Fácil de aplicar y retirar.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "gel-natural-fuerte",
      id: "33af1d93-1d57-5ca3-9d35-fb34a2eaa74b",
      marca: "Ruzz Man",
      nombre: "Gel Natural Fuerte",
      categoria: "Peinado",
      precio: 160,
      variantes: [{"id": "a894d35cb66b5eff98e22ae257315457", "nombre": "250 g", "precio": 160}, {"id": "836b9fe60387538587cddb294d4f7a5e", "nombre": "500 g", "precio": 230}, {"id": "87e02e5aceb55f17812762da96a32c53", "nombre": "1000 g", "precio": 350}],
      contenido: "250 g · 500 g · 1000 g",
      etiqueta: "Fijación fuerte",
      fotos: [{"src": "img/ruzz/gel-natural-fuerte.webp", "w": 800, "h": 489, "alt": "Gel Natural Fuerte Ruzz Man"}],
      parrafos: ["El Gel Natural Rosa ofrece el equilibrio perfecto entre control y flexibilidad. Su fijación fuerte permite moldear el cabello con facilidad, manteniendo el peinado definido sin endurecerlo en exceso. Ideal para quienes desean un estilo duradero con movimiento natural.", "Ideal para Barberías, salones de belleza, uso diario y personas que buscan una fijación confiable para peinados con movimiento y un acabado natural."],
      lista: {"titulo": "Beneficios", "items": ["Fijación fuerte y flexible.", "Mantiene el peinado durante horas.", "No deja residuos.", "Proporciona un acabado natural.", "Fácil aplicación.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "gel-natural-medio",
      id: "2c0f4400-5bc3-5c21-8199-77201c2b9002",
      marca: "Ruzz Man",
      nombre: "Gel Natural Medio",
      categoria: "Peinado",
      precio: 160,
      variantes: [{"id": "808858e12dd658b79cd1932b791cc4fe", "nombre": "250 g", "precio": 160}, {"id": "38301f8f06a951efb84b589f6c8a34de", "nombre": "500 g", "precio": 230}, {"id": "78cab81dee5d52afa6e00bcf7b9aeb10", "nombre": "1000 g", "precio": 350}],
      contenido: "250 g · 500 g · 1000 g",
      etiqueta: "Fijación media",
      fotos: [{"src": "img/ruzz/gel-natural-medio.webp", "w": 800, "h": 497, "alt": "Gel Natural Medio Ruzz Man"}],
      parrafos: ["El Gel Natural Verde está pensado para quienes prefieren un peinado con apariencia natural y movimiento. Su fijación media permite controlar el cabello sin rigidez, facilitando retoques durante el día y proporcionando un acabado limpio y ligero.", "Ideal para Barberías, salones de belleza, estilistas y personas que buscan un look natural con control ligero para el día a día."],
      lista: {"titulo": "Beneficios", "items": ["Fijación media con acabado natural.", "Conserva el movimiento del cabello.", "No deja residuos ni sensación pesada.", "Fácil de peinar y remodelar.", "Ideal para uso diario.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "cera-gel-maxima-fijacion",
      id: "be0fe5b6-3d20-5cc9-888d-e577427ab5d2",
      marca: "Ruzz Man",
      nombre: "Cera Gel Máxima Fijación",
      categoria: "Peinado",
      precio: 160,
      variantes: [{"id": "36f757ca29dd5848a0a21c448072ff1e", "nombre": "250 g", "precio": 160}, {"id": "d6269b8760ab5cb38a7e6972594176d6", "nombre": "500 g", "precio": 230}, {"id": "854340d107865f1e9ef4b58886d8e53e", "nombre": "1000 g", "precio": 350}],
      contenido: "250 g · 500 g · 1000 g",
      etiqueta: "Fijación máxima",
      fotos: [{"src": "img/ruzz/cera-gel-maxima-fijacion.webp", "w": 800, "h": 459, "alt": "Cera Gel Máxima Fijación Ruzz Man"}],
      parrafos: ["La Cera Gel combina la firmeza de un gel con la textura y definición de una cera, ofreciendo una máxima fijación para peinados que necesitan permanecer intactos durante todo el día. Su fórmula proporciona un excelente control sin dejar residuos visibles, permitiendo crear estilos estructurados con un acabado limpio y profesional.", "Es ideal para peinados modernos, cabello corto o de longitud media, y estilos que requieren definición, textura y una fijación superior.", "Ideal para Barberías, salones de belleza, academias de estilismo, distribuidores de productos profesionales y personas que buscan un producto de alto rendimiento para lograr peinados con máxima duración, definición y control, tanto para hombres como para mujeres."],
      lista: {"titulo": "Beneficios", "items": ["Máxima fijación de larga duración.", "Define y aporta textura al peinado.", "No deja residuos visibles.", "Fácil de aplicar y distribuir.", "Ideal para peinados estructurados.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "pomade-extra-fuerte",
      id: "171acc30-72e6-51fb-abb3-4fde189eed13",
      marca: "Ruzz Man",
      nombre: "Pomade #1 Extra Fuerte",
      categoria: "Peinado",
      precio: 200,
      contenido: "150 g",
      etiqueta: "Fijación extra fuerte",
      fotos: [{"src": "img/ruzz/pomade-extra-fuerte.webp", "w": 533, "h": 425, "alt": "Pomade #1 Extra Fuerte Ruzz Man"}],
      parrafos: ["Cuando el estilo no puede fallar, la Pomade #1 ofrece una fijación extra fuerte que mantiene el peinado impecable desde la mañana hasta la noche. Su fórmula proporciona un excelente control para crear estilos estructurados, clásicos o modernos, conservando una apariencia limpia y profesional durante horas.", "Diseñada para quienes buscan un acabado de alto rendimiento, permite moldear el cabello con precisión sin dejar residuos visibles.", "Ideal para Barberías, salones de belleza y personas que necesitan una fijación de alto desempeño para peinados impecables durante todo el día."],
      lista: {"titulo": "Beneficios", "items": ["Fijación extra fuerte.", "Mantiene el peinado durante horas.", "Excelente control y definición.", "No deja residuos visibles.", "Fácil aplicación y retiro."]}
    },
    {
      slug: "pomade-fuerte",
      id: "960e6cef-0254-5cfe-91d8-5c7fcb1be242",
      marca: "Ruzz Man",
      nombre: "Pomade #2 Fuerte",
      categoria: "Peinado",
      precio: 200,
      contenido: "150 g",
      etiqueta: "Fijación fuerte",
      fotos: [{"src": "img/ruzz/pomade-fuerte.webp", "w": 532, "h": 436, "alt": "Pomade #2 Fuerte Ruzz Man"}],
      parrafos: ["La Pomade #2 está pensada para quienes desean un peinado definido sin llegar a una fijación extrema. Su fórmula brinda el equilibrio perfecto entre firmeza y flexibilidad, permitiendo mantener el estilo con una apariencia natural y bien cuidada.", "Es una excelente opción para el uso diario, ofreciendo control, textura y un acabado profesional.", "Ideal para Barberías, estilistas y personas que buscan una fijación confiable para un look limpio, elegante y duradero."],
      lista: {"titulo": "Beneficios", "items": ["Fijación fuerte.", "Define el peinado sin endurecer en exceso.", "Conserva una apariencia natural.", "Fácil de distribuir.", "No deja sensación pegajosa."]}
    },
    {
      slug: "pomade-media",
      id: "490168ed-48b6-50d1-9925-94974c574dc3",
      marca: "Ruzz Man",
      nombre: "Pomade #3 Media",
      categoria: "Peinado",
      precio: 200,
      contenido: "150 g",
      etiqueta: "Fijación media",
      fotos: [{"src": "img/ruzz/pomade-media.webp", "w": 523, "h": 428, "alt": "Pomade #3 Media Ruzz Man"}],
      parrafos: ["La Pomade #3 fue creada para quienes prefieren un estilo relajado y con movimiento. Su fijación media proporciona el control suficiente para mantener el peinado ordenado sin perder naturalidad, permitiendo retocar el cabello cuando sea necesario.", "Ideal para Salones de belleza, barberías y personas que prefieren un acabado natural con un toque de definición y flexibilidad."],
      lista: {"titulo": "Beneficios", "items": ["Fijación media.", "Conserva el movimiento natural.", "Aporta textura y definición.", "No endurece el cabello.", "Ideal para uso diario."]}
    },
    {
      slug: "pomade-baja",
      id: "43cdf500-d747-5889-986b-64d33f69e3ed",
      marca: "Ruzz Man",
      nombre: "Pomade #4 Baja",
      categoria: "Peinado",
      precio: 200,
      contenido: "150 g",
      etiqueta: "Fijación ligera",
      fotos: [{"src": "img/ruzz/pomade-baja.webp", "w": 580, "h": 473, "alt": "Pomade #4 Baja Ruzz Man"}],
      parrafos: ["Para quienes buscan un acabado natural, la Pomade #4 ofrece una fijación ligera que ayuda a controlar el cabello sin perder suavidad ni movimiento. Es perfecta para peinados casuales y para quienes desean un look fresco con una apariencia completamente natural.", "Su fórmula permite acomodar el cabello fácilmente durante el día, proporcionando una sensación ligera y confortable.", "Ideal para Hombres y mujeres que buscan un producto ligero para controlar el cabello sin rigidez, así como para barberías y salones que ofrecen estilos naturales."],
      lista: {"titulo": "Beneficios", "items": ["Fijación ligera.", "Mantiene el movimiento natural.", "No deja residuos.", "Textura suave y fácil de aplicar.", "Ideal para peinados casuales."]}
    },
    {
      slug: "pomade-minoxidil-extra-fuerte",
      id: "c2ea3fd0-4c69-573b-83dc-27f297c98ca8",
      marca: "Ruzz Man",
      nombre: "Pomade #6 + Minoxidil Extra Fuerte",
      categoria: "Peinado",
      precio: 200,
      contenido: "150 g",
      etiqueta: "Fijación extra fuerte",
      fotos: [{"src": "img/ruzz/pomade-minoxidil-extra-fuerte.webp", "w": 602, "h": 472, "alt": "Pomade #6 + Minoxidil Extra Fuerte Ruzz Man"}],
      parrafos: ["La Pomade #6 con Minoxidil fue desarrollada para ofrecer una fijación extra fuerte mientras complementa la rutina de cuidado capilar. Enriquecida con minoxidil, ayuda a mantener el peinado firme durante todo el día sin sacrificar una apariencia limpia y profesional.", "Su textura facilita el moldeado del cabello, proporcionando control, definición y un acabado de calidad profesional desde la primera aplicación.", "Ideal para: Barberías, salones de belleza, distribuidores de productos profesionales y personas que buscan una pomada de máxima fijación como parte de su rutina diaria de estilizado y cuidado capilar."],
      lista: {"titulo": "Beneficios", "items": ["Fijación extra fuerte.", "Enriquecida con minoxidil.", "Excelente control y definición.", "Mantiene el peinado durante horas.", "Fácil de aplicar y retirar."]}
    },
    {
      slug: "spider-wax",
      id: "4fb05402-aecf-517a-8755-1dbb734694a5",
      marca: "Ruzz Man",
      nombre: "Spider Wax Fuerte",
      categoria: "Peinado",
      precio: 200,
      contenido: "150 g",
      etiqueta: "Efecto fibra",
      fotos: [{"src": "img/ruzz/spider-wax.webp", "w": 604, "h": 484, "alt": "Spider Wax Fuerte Ruzz Man"}],
      parrafos: ["Lleva tu creatividad al siguiente nivel con Spider Wax, una cera para peinar de fijación fuerte que permite crear estilos con textura, definición y un efecto flexible gracias a su característica consistencia tipo \"telaraña\". Su fórmula facilita moldear el cabello con precisión, aportando un acabado natural y permitiendo reajustar el peinado cuando sea necesario.", "Es ideal para crear peinados modernos con volumen, separación de mechones y un look dinámico sin dejar residuos visibles.", "Ideal para Barberías, salones de belleza, estilistas profesionales y personas que buscan crear peinados modernos con textura, volumen y movimiento sin perder el control del cabello."],
      lista: {"titulo": "Beneficios", "items": ["Fijación fuerte de larga duración.", "Efecto fibra para mayor textura y definición.", "Permite remodelar el peinado.", "No deja residuos visibles.", "Acabado natural con excelente control."]}
    },
    {
      slug: "pomade-matte-clay",
      id: "8f6c761d-82b6-59fc-8a9b-d2212a5cb0cf",
      marca: "Ruzz Man",
      nombre: "Pomade Matte Clay",
      categoria: "Peinado",
      precio: 200,
      contenido: "150 g",
      etiqueta: "Acabado mate",
      fotos: [{"src": "img/ruzz/pomade-matte-clay.webp", "w": 597, "h": 491, "alt": "Pomade Matte Clay Ruzz Man"}],
      parrafos: ["La Matte Clay está diseñada para quienes prefieren un estilo natural y sofisticado. Su fórmula proporciona una fijación confiable con un acabado completamente mate, ayudando a dar textura y cuerpo al cabello sin aportar brillo.", "Perfecta para crear peinados con efecto despeinado, volumen o estilos contemporáneos, ofreciendo una apariencia limpia y profesional durante todo el día.", "Ideal para Barberías, salones de belleza, academias de estilismo y personas que buscan un look moderno, con textura y un acabado mate de aspecto natural."],
      lista: {"titulo": "Beneficios", "items": ["Acabado completamente mate.", "Aporta textura y volumen.", "Controla el cabello sin dejar brillo.", "Fácil aplicación y distribución.", "No deja sensación grasosa."]}
    },
    {
      slug: "sea-salt",
      id: "3d4f93da-6587-529a-85e2-a214a3ca5684",
      marca: "Ruzz Man",
      nombre: "Sea Salt Texturizing Spray",
      categoria: "Peinado",
      precio: 150,
      contenido: "236 ml",
      etiqueta: "Efecto playero",
      fotos: [{"src": "img/ruzz/sea-salt.webp", "w": 224, "h": 596, "alt": "Sea Salt Texturizing Spray Ruzz Man"}],
      parrafos: ["Consigue un look con textura, volumen y movimiento natural con el Sea Salt Texturizing Spray. Su fórmula está diseñada para aportar cuerpo al cabello sin dejarlo pesado, logrando un acabado con efecto playero, moderno y desenfadado. Es ideal para crear peinados con mayor definición, textura y un aspecto natural tanto en cabello corto como largo.", "Además de facilitar el peinado, ayuda a dar volumen desde la raíz y mejora la manejabilidad del cabello, convirtiéndose en un aliado para el estilizado diario.", "Ideal para Barberías, salones de belleza, estilistas profesionales, academias de estilismo y personas que desean dar más volumen, textura y movimiento a su cabello. Apto para hombres y mujeres, especialmente para quienes buscan un acabado natural y moderno."],
      lista: {"titulo": "Beneficios", "items": ["Aporta textura y volumen al cabello.", "Proporciona un acabado natural con efecto mate.", "Ayuda a crear un estilo con apariencia playera.", "Facilita el peinado y la definición de mechones.", "No deja sensación pesada ni residuos visibles.", "Ideal para uso diario.", "Apto para todo tipo de cabello."]}
    },
    {
      slug: "volutex",
      id: "3c21125b-4b5d-53e3-b886-0424e246ad20",
      marca: "Ruzz Man",
      nombre: "Volutex Polvo de Volumen",
      categoria: "Peinado",
      precio: 150,
      variantes: [{"id": "a9f8e7af31ca5785ac4e7b2a100f1c73", "nombre": "10 g", "precio": 150}, {"id": "9b8dcc8c067d58dc96f56f060bf31541", "nombre": "20 g", "precio": 250}],
      contenido: "10 g · 20 g",
      etiqueta: "Volumen y textura",
      fotos: [{"src": "img/ruzz/volutex.webp", "w": 371, "h": 575, "alt": "Volutex Polvo de Volumen Ruzz Man"}],
      parrafos: ["Lleva tus peinados al siguiente nivel con Volutex, el polvo de volumen y textura diseñado para transformar cualquier estilo en segundos. Su fórmula ultraligera proporciona un efecto mate con control ligero, aportando cuerpo y volumen desde la raíz sin dejar el cabello pesado o con residuos visibles.", "Ideal para Barberías, salones de belleza, estilistas profesionales, academias de barbería y personas que buscan dar mayor volumen, textura y cuerpo a su peinado. Apto para hombres y mujeres, especialmente para quienes tienen cabello fino o desean un acabado con más elevación, definición y un estilo natural sin brillo."],
      lista: {"titulo": "Beneficios", "items": ["Aporta volumen inmediato desde la raíz.", "Proporciona textura para un mejor estilizado.", "Acabado mate de apariencia natural.", "Control ligero que conserva el movimiento del cabello.", "No deja residuos visibles ni sensación grasosa.", "Fácil aplicación y distribución.", "Ideal para todo tipo de cabello."]}
    },
    {
      slug: "cool7-plus",
      id: "22b79e65-9938-5248-b8e4-1630244b9b7a",
      marca: "Ruzz Man",
      nombre: "Cool Plus 7 en 1",
      categoria: "Barbería",
      precio: 240,
      contenido: "449 ml",
      etiqueta: "Cuidado de cuchillas",
      fotos: [{"src": "img/ruzz/cool7-plus.webp", "w": 185, "h": 598, "alt": "Cool Plus 7 en 1 Ruzz Man"}],
      parrafos: ["Mantén tus máquinas de corte en óptimas condiciones con Cool Plus 7 en 1, el spray indispensable para el cuidado y mantenimiento de cuchillas profesionales. Su fórmula multifuncional ayuda a enfriar, limpiar, lubricar y proteger las cuchillas durante y después de cada servicio, mejorando el rendimiento del equipo y prolongando su vida útil.", "Su aplicación rápida elimina residuos acumulados entre las cuchillas, reduce la fricción durante el uso continuo y ayuda a prevenir la corrosión, permitiendo cortes más suaves, precisos y eficientes. Además, deja una agradable sensación de frescura y un aroma limpio que complementa el ambiente de trabajo en barberías y salones.", "Ideal para Barberías, salones de belleza, academias de barbería, estilistas profesionales, distribuidores de herramientas de barbería y cualquier persona que desee mantener sus máquinas y cuchillas en excelentes condiciones, prolongando su rendimiento y ofreciendo un servicio más eficiente y profesional."],
      lista: {"titulo": "Beneficios", "items": ["Enfría las cuchillas de forma inmediata.", "Ayuda a limpiar residuos de cabello y suciedad.", "Lubrica para un funcionamiento más suave.", "Contribuye a prevenir la corrosión y el desgaste.", "Favorece un mejor desempeño de la máquina.", "Deja un aroma fresco y agradable.", "Fácil aplicación en spray."]}
    },
    {
      slug: "towel-essence",
      id: "641b5379-6458-5f5a-93a9-2c93d5159ddc",
      marca: "Ruzz Man",
      nombre: "Towel Essence",
      categoria: "Barbería",
      precio: 220,
      contenido: "500 ml",
      etiqueta: "Aroma para toallas",
      fotos: [{"src": "img/ruzz/towel-essence.webp", "w": 229, "h": 632, "alt": "Towel Essence Ruzz Man"}],
      parrafos: ["Convierte cada servicio en una experiencia más agradable con Towel Essence Spray, una esencia aromática especialmente formulada para perfumar las toallas utilizadas en barberías, salones de belleza y spas. Su fragancia aporta una agradable sensación de limpieza y frescura, creando un ambiente más profesional y brindando un toque de confort a cada cliente.", "Ideal para Barberías, salones de belleza, spas, estéticas, hoteles, academias de barbería y estilismo, así como profesionales que buscan ofrecer un servicio con mayor calidad, confort y una experiencia sensorial que haga la diferencia para sus clientes."],
      lista: {"titulo": "Beneficios", "items": ["Aromatiza las toallas con una fragancia agradable.", "Proporciona una sensación de limpieza y frescura.", "Ayuda a mejorar la experiencia del cliente.", "Fácil aplicación en spray.", "Ideal para uso profesional.", "Aroma de larga duración."]}
    },
    {
      slug: "barbicidex",
      id: "6dd00546-9b47-5794-aa3b-fab3280edb97",
      marca: "Ruzz Man",
      nombre: "Barbicidex",
      categoria: "Barbería",
      precio: 260,
      contenido: "1000 ml",
      etiqueta: "Desinfectante al 12%",
      fotos: [{"src": "img/ruzz/barbicidex.webp", "w": 218, "h": 596, "alt": "Barbicidex Ruzz Man"}],
      parrafos: ["Mantén un entorno de trabajo limpio y profesional con Barbicidex, una solución desinfectante al 12% especialmente formulada para la limpieza y desinfección de instrumental utilizado en barberías, salones de belleza, estéticas y centros de cuidado personal. Su fórmula ayuda a mantener las herramientas en óptimas condiciones de higiene, contribuyendo a ofrecer un servicio más seguro y confiable.", "Además de su acción desinfectante, cuenta con propiedades anticorrosivas, ayudando a proteger el instrumental metálico del desgaste ocasionado por el uso constante y prolongando su vida útil.", "Ideal para Barberías, salones de belleza, estéticas, spas, academias de barbería y estilismo, distribuidores de productos profesionales y cualquier establecimiento que requiera mantener sus herramientas de trabajo limpias, protegidas y listas para brindar un servicio con altos estándares de higiene."],
      lista: {"titulo": "Beneficios", "items": ["Solución desinfectante al 12%.", "Ayuda a mantener el instrumental limpio e higienizado.", "Fórmula con acción anticorrosiva.", "Contribuye a prolongar la vida útil de las herramientas metálicas.", "Fácil de utilizar como parte del protocolo de limpieza.", "Ideal para uso profesional."]}
    }
  ];

  // Tono de fondo de cada producto (la foto, con fondo blanco, se integra con mix-blend-mode:multiply)
  var TONOS = {
    'base-liquida-mate': '#EADCCD',          // nude
    'base-en-crema-cobertura-maxima': '#E8DCC8', // champagne
    'corrector-camouflage': '#E5DFD7',       // piedra
    'mineral-hd-setting-powder': '#E3E2DE',  // niebla
    'simply-clean': '#DFE3DC',               // salvia
    'shampoo-personalizado': '#DCD2C7'       // arena
  };
  var TONO_BASE = '#ECE6DF';
  // Línea Ruzz Man: un tono por categoría
  var TONOS_CAT = { 'Afeitado': '#DDE2E3', 'Peinado': '#E2DDD6', 'Barbería': '#DCDDE0', 'Cabello': '#DCD2C7' };
  function tono(p) { return TONOS[p.key] || TONOS_CAT[p.categoria] || TONO_BASE; }

  // ---------------- Utilidades ----------------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function pesos(c) { var n = (c || 0) / 100; return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }); }
  function precioHTML(c, normal) { return '<span class="precio">' + (normal && normal > c ? '<s>' + pesos(normal) + '</s>' : '') + pesos(c) + '<small>MXN</small></span>'; }
  function leer(k) { try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function guardar(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: queda en memoria */ } }
  var ICONO_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var ICONO_WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.2-4.4A8.4 8.4 0 1 1 21 11.5Z"/></svg>';

  /** fetch a la API de Vende con tiempo límite. Devuelve { ok, status, datos }. */
  function api(ruta, opciones, ms) {
    opciones = opciones || {};
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 9000) : null;
    var init = { method: opciones.method || 'GET', headers: {}, credentials: 'omit', mode: 'cors' };
    if (ctrl) init.signal = ctrl.signal;
    if (opciones.json !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(opciones.json); }
    if (opciones.blob) { init.headers['content-type'] = opciones.tipo; init.body = opciones.blob; }
    return fetch(API + ruta, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, datos: d || {} }; });
    }).catch(function () { return { ok: false, status: 0, datos: {} }; }).then(function (r) { if (t) clearTimeout(t); return r; });
  }

  // ---------------- Estado ----------------
  var S = {
    modo: 'cargando',          // 'cargando' | 'linea' (Vende recibe pedidos) | 'whatsapp' (respaldo)
    tienda: null,
    productos: CATALOGO.map(desdeCatalogo),
    filtro: 'Todo',
    bolsa: (function () { var b = leer(K_BOLSA); return b && Array.isArray(b.items) ? b.items.filter(function (i) { return i && i.key && i.cantidad > 0; }) : []; })(),
    codigo: null, cot: null, cotN: 0, fotos: {}, enviando: false
  };
  var listo;

  function desdeCatalogo(l) {
    return {
      key: l.slug, id: l.id || null, nombre: l.nombre, categoria: l.categoria, precio_c: l.precio * 100, precio_normal_c: null, disponible: true,
      // Presentaciones del catálogo (p. ej. 250 ml / 500 ml); en modo WhatsApp se eligen igual que las variantes de Vende
      variantes: (l.variantes || []).map(function (v) { return { id: v.id, nombre: v.nombre, precio_c: v.precio * 100, disponible: true }; }),
      precio_desde: !!(l.variantes && l.variantes.length > 1), marca: l.marca || null,
      fotos: l.fotos, local: l, descripcion: null, contenido: l.contenido,
      personalizado: l.pers ? { pregunta: l.pers.pregunta, fotos: l.pers.fotos } : null, preparacion: l.pers ? l.pers.preparacion : null
    };
  }
  var porId = {}, porNombre = {};
  CATALOGO.forEach(function (l, i) { l.orden = i; if (l.id) porId[l.id] = l; porNombre[norm(l.nombre)] = l; (l.alias || []).forEach(function (a) { porNombre[norm(a)] = l; }); });

  function desdeApi(p) {
    var l = porId[p.id] || porNombre[norm(p.nombre)] || null;
    var fotos = (p.fotos || []).length ? p.fotos.map(function (u, i) {
      var f = l && l.fotos[i];
      return { src: u, alt: f ? f.alt : p.nombre + (i ? ' · foto ' + (i + 1) : '') };
    }) : (l ? l.fotos : []);
    return {
      key: l ? l.slug : 'v-' + p.id, id: p.id, nombre: p.nombre, categoria: p.categoria || (l && l.categoria) || 'Más', precio_c: p.precio_final_c,
      precio_normal_c: p.en_oferta ? p.precio_c : null, precio_desde: !!p.precio_desde, disponible: p.disponible !== false, existencias: p.existencias,
      variantes: (p.variantes || []), fotos: fotos, local: l, marca: p.marca || (l && l.marca) || null, descripcion: p.descripcion || null, contenido: (l && l.contenido) || p.unidad || null,
      personalizado: p.personalizado || null, preparacion: p.preparacion || null, orden: l ? l.orden : 100
    };
  }
  function producto(key) { for (var i = 0; i < S.productos.length; i++) if (S.productos[i].key === key) return S.productos[i]; return null; }

  // ---------------- Carga desde Vende ----------------
  function cargar() {
    return Promise.all([api(''), api('/productos')]).then(function (r) {
      var t = r[0], p = r[1];
      if (!t.ok || !t.datos.tienda || !p.ok || !Array.isArray(p.datos.productos) || !p.datos.productos.length) { ponerModo('whatsapp'); return; }
      S.tienda = t.datos.tienda;
      // Solo maquillaje y cuidado: lo del catálogo, o lo que ella dé de alta en Vende en estas categorías (su cuenta puede tener otros negocios)
      var CATS = ['rostro', 'ojos', 'labios', 'cuidado', 'cabello', 'maquillaje', 'accesorios', 'afeitado', 'peinado', 'barberia'];
      S.productos = p.datos.productos.filter(function (x) { return porId[x.id] || porNombre[norm(x.nombre)] || CATS.indexOf(norm(x.categoria || '')) >= 0; })
        .map(desdeApi).sort(function (a, b) { return a.orden - b.orden; });
      if (!S.productos.length) { ponerModo('whatsapp'); return; }
      // Quita de la bolsa lo que ya no existe en la tienda
      S.bolsa = S.bolsa.filter(function (i) { return !!producto(i.key); });
      guardarBolsa();
      politicasDeVende(S.tienda.politicas || {});
      ponerModo(S.tienda.acepta_pedidos ? 'linea' : 'whatsapp');
    });
  }
  function politicasDeVende(pol) {
    [['envio', 'pol-envio'], ['cambios', 'pol-cambios'], ['privacidad', 'pol-privacidad']].forEach(function (x) {
      var txt = pol[x[0]], caja = document.getElementById(x[1]);
      if (!txt || !caja) return;
      $('.txt', caja).innerHTML = String(txt).split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('');
    });
  }
  function ponerModo(m) {
    S.modo = m;
    $('#aviso-modo').hidden = m !== 'whatsapp';
    $('#aviso-wa').href = ligaWhatsapp();
    if (m === 'linea') {
      var h = (S.tienda && S.tienda.pago && S.tienda.pago.horas_para_pagar) || 24;
      $('#pasos-compra').innerHTML =
        '<li><b>Elige tus productos</b> y agrégalos a tu bolsa. En el shampoo nos cuentas cómo es tu cabello.</li>' +
        '<li><b>Haz tu pedido</b> con tus datos de envío. Tus productos quedan apartados y te llega la confirmación por correo.</li>' +
        '<li><b>Transfiere en ' + h + ' horas</b> con tu número de pedido como concepto y sube tu comprobante. Te avisamos cuando lo confirmemos.</li>';
    }
    pintarColeccion();
    pintarBolsa();
  }

  // ---------------- Colección ----------------
  function categorias() {
    var c = [];
    S.productos.forEach(function (p) { if (p.categoria && c.indexOf(p.categoria) < 0) c.push(p.categoria); });
    return c;
  }
  function imgHTML(f, extra, marca) {
    if (!f) return '<span class="vacia' + (marca ? ' marca' : '') + '" aria-hidden="true">' + esc(marca || 'AL') + '</span>';
    return '<img src="' + esc(f.src) + '"' + (f.w ? ' width="' + f.w + '" height="' + f.h + '"' : '') + ' alt="' + esc(f.alt || '') + '" loading="lazy" decoding="async"' + (extra || '') + '>';
  }
  /** Línea corta bajo el nombre: «Cobertura media · 40 g» (o la primera frase de la descripción de Vende). */
  function descriptor(p) {
    var l = p.local;
    if (l) return [l.marca, l.etiqueta, p.contenido].filter(Boolean).join(' · ');
    var d = (String(p.descripcion || '').split(/\n/)[0].match(/^[^.]*\.?/) || [''])[0];
    return d.length > 60 ? d.slice(0, 58).replace(/\s+\S*$/, '') + '…' : d;
  }
  function precioCorto(c, normal) { return '<span class="precio">' + (normal && normal > c ? '<s>' + pesos(normal) + '</s>' : '') + pesos(c) + '</span>'; }
  function pintarColeccion() {
    var cats = categorias();
    if (cats.indexOf(S.filtro) < 0) S.filtro = 'Todo';
    $('#filtros').innerHTML = cats.length > 1 ? ['Todo'].concat(cats).map(function (c) {
      return '<button type="button" data-filtro="' + esc(c) + '" aria-pressed="' + (S.filtro === c) + '">' + esc(c) + '</button>';
    }).join('') : '';
    $('#rejilla').innerHTML = S.productos.filter(function (p) { return S.filtro === 'Todo' || p.categoria === S.filtro; }).map(function (p) {
      var sello = !p.disponible ? '<span class="sello">Agotado</span>' : p.personalizado ? '<span class="sello">Personalizado</span>' : p.precio_normal_c ? '<span class="sello">Precio especial</span>' : '';
      var accion = !p.disponible ? '<button class="agregar" type="button" disabled>Agotado</button>'
        : p.variantes.length ? '<button class="agregar" type="button" data-ver="' + esc(p.key) + '">Elegir opción</button>'
        : '<button class="agregar" type="button" data-agregar="' + esc(p.key) + '" aria-label="Agregar ' + esc(p.nombre) + ' a la bolsa">Agregar</button>';
      return '<li class="tarjeta">' +
        '<button class="foto" type="button" data-ver="' + esc(p.key) + '" aria-label="Ver ' + esc(p.nombre) + '" style="--tono:' + tono(p) + '">' + sello + imgHTML(p.fotos[0], '', p.marca) + '</button>' +
        '<div class="info"><div class="fila-n"><h3><button type="button" data-ver="' + esc(p.key) + '">' + esc(p.nombre) + '</button></h3>' +
        (p.precio_desde ? '<span class="precio"><small>desde</small> ' + pesos(p.precio_c) + '</span>' : precioCorto(p.precio_c, p.precio_normal_c)) + '</div>' +
        '<p class="desc">' + esc(descriptor(p)) + '</p>' + accion + '</div></li>';
    }).join('');
  }

  // ---------------- Hojas (dialog) ----------------
  function abrirHoja(d) {
    $$('dialog[open]').forEach(function (o) { if (o !== d) o.close(); });
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
    document.documentElement.classList.add('fijo');
  }
  function cerrarHoja(d) { if (d.open) { if (d.close) d.close(); else d.removeAttribute('open'); } }
  $$('dialog.hoja').forEach(function (d) {
    d.addEventListener('close', function () {
      if (!$$('dialog[open]').length) document.documentElement.classList.remove('fijo');
      if (d.id === 'dlg-producto' && /^#p\//.test(location.hash)) quitarHash();
    });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar]')) { cerrarHoja(d); return; }
      if (e.target === d) {
        var r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrarHoja(d);
      }
    });
  });
  function quitarHash() { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* nada */ } }

  // ---------------- Ficha de producto ----------------
  function abrirProducto(key) {
    var p = producto(key);
    if (!p) return;
    var l = p.local, d = $('#dlg-producto');
    S.actual = p.key;
    var fotos = p.fotos.length ? p.fotos : [null];
    var parrafos = l ? l.parrafos : String(p.descripcion || '').split(/\n\s*\n|\n/).filter(Boolean);
    var html = '<div class="hoja-cab"><p class="migas-f">' + esc(p.marca || 'Makeup') + ' <span aria-hidden="true">/</span> ' + esc(p.categoria || '') + '</p><button class="cerrar" type="button" data-cerrar aria-label="Cerrar">' + ICONO_X + '</button></div>' +
      '<div class="producto-g"><div class="galeria" style="--tono:' + tono(p) + '"><div class="grande">' + imgHTML(fotos[0], ' id="g-img"', p.marca).replace(' loading="lazy"', '') + '</div>' +
      (fotos.length > 1 ? '<div class="miniaturas">' + fotos.map(function (f, i) {
        return '<button type="button" data-foto="' + i + '" aria-current="' + (i === 0) + '" aria-label="Ver foto ' + (i + 1) + ' de ' + fotos.length + '">' + imgHTML(f).replace(/ alt="[^"]*"/, ' alt=""') + '</button>';
      }).join('') + '</div>' : '') + '</div>' +
      '<div class="ficha"><div class="ficha-sup"><h3 id="p-titulo" tabindex="-1" autofocus>' + esc(p.nombre) + '</h3>' +
      (l && l.etiqueta ? '<p class="sub-n">' + esc(l.etiqueta) + '</p>' : '') +
      '<div class="meta">' + precioHTML(p.precio_c, p.precio_normal_c) +
      (p.contenido ? '<span class="neto">Contenido neto: ' + esc(p.contenido) + '</span>' : '') + '</div>' +
      (l && l.resumen ? '<p class="resumen-f">' + esc(l.resumen) + '</p>' : '') + '</div>';
    if (p.variantes.length) {
      html += '<div class="opciones-v"><label for="p-variante">Elige una opción</label><select id="p-variante">' + p.variantes.map(function (v) {
        return '<option value="' + esc(v.id) + '"' + (v.disponible === false ? ' disabled' : '') + '>' + esc(v.nombre) + ' · ' + pesos(v.precio_c) + (v.disponible === false ? ' (agotado)' : '') + '</option>';
      }).join('') + '</select></div>';
    }
    if (p.personalizado) {
      html += '<div class="nota-pers"><b>Hecho para ti.</b><span>Al finalizar tu pedido te preguntaremos: «' + esc(p.personalizado.pregunta) + '»' +
        (p.personalizado.fotos ? ' y podrás mandarnos hasta ' + p.personalizado.fotos + ' fotos de tu cabello.' : '.') + '</span>' +
        (p.preparacion ? '<span>Preparación: ' + esc(p.preparacion.charAt(0).toLowerCase() + p.preparacion.slice(1)) + '.</span>' : '') + '</div>';
    }
    html += p.disponible
      ? '<div class="comprar-fila"><div class="cantidad" role="group" aria-label="Cantidad"><button type="button" data-cant="-1" aria-label="Uno menos">−</button><output id="p-cant">1</output><button type="button" data-cant="1" aria-label="Uno más">+</button></div>' +
        '<button class="boton" type="button" id="p-agregar" data-key="' + esc(p.key) + '">Agregar a la bolsa</button></div>'
      : '<p class="nota-pers"><b>Agotado por ahora.</b><span><a class="enlace" href="' + esc(ligaWhatsapp('Hola, ¿cuándo vuelve a estar disponible ' + p.nombre + '?')) + '" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a></span></p>';
    var gratis = S.modo === 'linea' && S.tienda && S.tienda.entrega && S.tienda.entrega.envio ? S.tienda.entrega.envio.gratis_desde_c : ENVIO_GRATIS_C;
    html += '<ul class="confianza"><li>Envío a todo México' + (gratis ? ', gratis desde ' + pesos(gratis) : '') + '</li>' +
      '<li>' + (S.modo === 'linea' ? 'Pago por transferencia; tus productos quedan apartados' : 'Pedido y pago por WhatsApp, con atención personal') + '</li></ul>';
    // Textos largos organizados como ficha de marca: Descripción · Beneficios · Cómo usar / Cómo funciona · Contenido
    var sec = function (titulo, cuerpo, abierta) { return '<details' + (abierta ? ' open' : '') + '><summary>' + esc(titulo) + '</summary><div class="txt">' + cuerpo + '</div></details>'; };
    var lista = function (items, tag) { return '<' + tag + ' class="lista-f">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</' + tag + '>'; };
    html += '<div class="acordeon ficha-ac">';
    if (parrafos.length) html += sec('Descripción', parrafos.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join(''), !l);
    if (l && l.pasos) html += sec('Cómo funciona', lista(l.pasos.items, 'ol'));
    if (l && l.lista) html += sec('Beneficios', lista(l.lista.items, 'ul'));
    if (l && l.tip) html += sec('Cómo usar', '<p><b>' + esc(l.tip.titulo) + '.</b> ' + esc(l.tip.texto) + '</p>');
    if (p.contenido || p.preparacion) html += sec('Contenido', (p.contenido ? '<p>Contenido neto: ' + esc(p.contenido) + '.</p>' : '') + (p.preparacion ? '<p>Preparación: ' + esc(p.preparacion.charAt(0).toLowerCase() + p.preparacion.slice(1)) + '.</p>' : ''));
    html += '</div></div></div>';
    d.innerHTML = html;
    d.scrollTop = 0;
    abrirHoja(d);
    try { history.replaceState(null, '', '#p/' + p.key); } catch (e) { /* nada */ }
  }
  // Al elegir presentación, el precio de la ficha muestra el de esa opción
  $('#dlg-producto').addEventListener('change', function (e) {
    if (e.target.id !== 'p-variante') return;
    var p = producto(S.actual), v = null, pr = $('.ficha .meta .precio', this);
    if (p) p.variantes.forEach(function (x) { if (x.id === e.target.value) v = x; });
    if (v && pr) pr.outerHTML = precioHTML(v.precio_c);
  });
  $('#dlg-producto').addEventListener('click', function (e) {
    var b = e.target.closest('[data-foto]');
    if (b) {
      var p = producto(S.actual);
      var f = p && p.fotos[Number(b.dataset.foto)], img = $('#g-img');
      if (f && img) { img.src = f.src; img.alt = f.alt || ''; if (f.w) { img.width = f.w; img.height = f.h; } }
      $$('[data-foto]', this).forEach(function (x) { x.setAttribute('aria-current', String(x === b)); });
      return;
    }
    var c = e.target.closest('[data-cant]');
    if (c) { var o = $('#p-cant'); o.value = o.textContent = String(Math.min(50, Math.max(1, Number(o.textContent) + Number(c.dataset.cant)))); return; }
    var a = e.target.closest('#p-agregar');
    if (a) {
      var v = $('#p-variante');
      agregar(a.dataset.key, Number($('#p-cant').textContent) || 1, v ? v.value : null);
      cerrarHoja($('#dlg-producto'));
    }
  });

  // ---------------- Bolsa ----------------
  function guardarBolsa() { guardar(K_BOLSA, { items: S.bolsa }); }
  function claveItem(key, variante) { return key + '|' + (variante || ''); }
  function agregar(key, cantidad, variante) {
    var p = producto(key);
    if (!p) return;
    var k = claveItem(key, variante), it = null;
    S.bolsa.forEach(function (i) { if (claveItem(i.key, i.variante_id) === k) it = i; });
    if (it) it.cantidad = Math.min(50, it.cantidad + cantidad);
    else S.bolsa.push({ key: key, variante_id: variante || null, cantidad: Math.min(50, cantidad) });
    guardarBolsa();
    pintarBolsa();
    aviso(p.nombre + ' · en tu bolsa');
  }
  function lineas() {
    return S.bolsa.map(function (i) {
      var p = producto(i.key);
      if (!p) return null;
      var v = null;
      p.variantes.forEach(function (x) { if (x.id === i.variante_id) v = x; });
      var precio = v ? v.precio_c : p.precio_c;
      return { item: i, p: p, v: v, precio_c: precio, importe_c: precio * i.cantidad };
    }).filter(Boolean);
  }
  function subtotal() { return lineas().reduce(function (s, l) { return s + l.importe_c; }, 0); }
  function piezas() { return S.bolsa.reduce(function (s, i) { return s + i.cantidad; }, 0); }

  function pintarBolsa() {
    var n = piezas(), cuenta = $('#cuenta-bolsa');
    cuenta.hidden = !n; cuenta.textContent = String(n);
    $('#cuenta-txt').textContent = n ? ', ' + n + (n === 1 ? ' pieza' : ' piezas') : ', vacía';
    var ls = lineas(), cuerpo = $('#bolsa-cuerpo'), pie = $('#bolsa-pie');
    var ult = leer(K_PEDIDO), ultHTML = ult && ult.token && Date.now() - (ult.t || 0) < 8 * 864e5 && S.modo === 'linea'
      ? '<p class="ultimo">¿Ya hiciste un pedido? <button type="button" id="ver-ultimo">Ver mi pedido ' + esc(ult.numero || '') + '</button></p>' : '';
    if (!ls.length) {
      cuerpo.innerHTML = '<div class="vacio"><p>Tu bolsa está vacía</p><button class="boton claro" type="button" data-cerrar data-ir="#coleccion">Ver la colección</button></div>';
      pie.innerHTML = ultHTML;
      pie.hidden = !ultHTML;
      return;
    }
    pie.hidden = false;
    cuerpo.innerHTML = '<ul class="renglones">' + ls.map(function (l) {
      var k = esc(claveItem(l.item.key, l.item.variante_id));
      return '<li class="renglon"><span class="mini-foto" style="--tono:' + tono(l.p) + '">' + imgHTML(l.p.fotos[0], '', l.p.marca).replace(/ alt="[^"]*"/, ' alt=""') + '</span>' +
        '<div><h3>' + esc(l.p.nombre) + '</h3><p class="det">' + (l.v ? esc(l.v.nombre) + ' · ' : '') + pesos(l.precio_c) + (l.p.personalizado ? ' · personalizado' : '') + '</p>' +
        '<div class="cantidad" role="group" aria-label="Cantidad de ' + esc(l.p.nombre) + '"><button type="button" data-mas="-1" data-k="' + k + '" aria-label="Uno menos">−</button><output>' + l.item.cantidad + '</output><button type="button" data-mas="1" data-k="' + k + '" aria-label="Uno más">+</button></div></div>' +
        '<div class="der">' + '<span class="precio">' + pesos(l.importe_c) + '</span><button class="quitar" type="button" data-quitar="' + k + '">Quitar</button></div></li>';
    }).join('') + '</ul>';
    var sub = subtotal(), envioTxt;
    var envioVende = S.tienda && S.tienda.entrega && S.tienda.entrega.envio;
    var gratis = S.modo === 'linea' ? (envioVende ? envioVende.gratis_desde_c : null) : ENVIO_GRATIS_C;
    if (gratis && sub >= gratis) envioTxt = 'Tu envío es gratis.';
    else if (gratis) envioTxt = 'Te faltan ' + pesos(gratis - sub) + ' para el envío gratis. El envío se calcula con tu estado' + (S.modo === 'linea' ? '.' : ', con un máximo de ' + pesos(ENVIO_MAX_C) + '.');
    else envioTxt = 'El envío se calcula con tu estado en el siguiente paso.';
    var avance = gratis ? '<div class="avance" role="presentation"><span style="width:' + Math.min(100, Math.round(sub / gratis * 100)) + '%"></span></div>' : '';
    var boton = S.modo === 'linea'
      ? '<button class="boton" type="button" id="ir-pago">Continuar al pago</button>'
      : S.modo === 'cargando'
        ? '<button class="boton" type="button" id="ir-pago">Continuar</button>'
        : '<a class="boton" href="' + esc(ligaWhatsapp()) + '" target="_blank" rel="noopener">' + ICONO_WA + ' Enviar pedido por WhatsApp</a><p class="nota">Te confirmamos existencias, envío y datos de pago por WhatsApp.</p>';
    cuerpo.insertAdjacentHTML('afterbegin', '<div class="envio-b"><p>' + envioTxt + '</p>' + avance + '</div>');
    pie.innerHTML = '<div class="suma"><span>Subtotal</span>' + '<span class="precio">' + pesos(sub) + '<small>MXN</small></span></div>' + boton + ultHTML;
  }
  $('#dlg-bolsa').addEventListener('click', function (e) {
    var m = e.target.closest('[data-mas]'), q = e.target.closest('[data-quitar]');
    if (m || q) {
      var k = (m || q).dataset.k || q.dataset.quitar;
      S.bolsa = S.bolsa.map(function (i) {
        if (claveItem(i.key, i.variante_id) !== k) return i;
        var c = q ? 0 : Math.min(50, i.cantidad + Number(m.dataset.mas));
        return c > 0 ? { key: i.key, variante_id: i.variante_id, cantidad: c } : null;
      }).filter(Boolean);
      guardarBolsa(); pintarBolsa();
      return;
    }
    var ir = e.target.closest('[data-ir]');
    if (ir) { var dest = $(ir.dataset.ir); if (dest) setTimeout(function () { dest.scrollIntoView({ behavior: 'smooth' }); }, 50); return; }
    if (e.target.closest('#ir-pago')) { abrirPago(); return; }
    if (e.target.closest('#ver-ultimo')) { verUltimo(); }
  });
  $('#abrir-bolsa').addEventListener('click', function () { pintarBolsa(); abrirHoja($('#dlg-bolsa')); });

  function ligaWhatsapp(texto) {
    if (!texto) {
      var ls = lineas();
      if (!ls.length) texto = 'Hola, vi la tienda de Ana Laura Makeup y quiero hacer un pedido.';
      else {
        var sub = subtotal();
        texto = 'Hola, quiero hacer este pedido de Ana Laura Makeup:\n' + ls.map(function (l) {
          return '• ' + l.item.cantidad + ' × ' + l.p.nombre + (l.v ? ' (' + l.v.nombre + ')' : '') + ' · ' + pesos(l.precio_c);
        }).join('\n') + '\n\nSubtotal: ' + pesos(sub) + ' MXN\nEnvío: ' + (sub >= ENVIO_GRATIS_C ? 'gratis (compra desde ' + pesos(ENVIO_GRATIS_C) + ')' : 'según mi estado (máximo ' + pesos(ENVIO_MAX_C) + ')') +
          (ls.some(function (l) { return l.p.personalizado; }) ? '\n\nPara el shampoo personalizado les cuento cómo es mi cabello y les mando fotos.' : '') +
          '\n\nMi nombre:\nCiudad y estado:';
      }
    }
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto);
  }

  // ---------------- Aviso flotante ----------------
  var avisoT;
  function aviso(txt, sinBoton) {
    var a = $('#aviso-f');
    $('#aviso-txt').textContent = txt;
    $('#aviso-btn').hidden = !!sinBoton;
    a.classList.add('ver');
    clearTimeout(avisoT);
    avisoT = setTimeout(function () { a.classList.remove('ver'); }, 4200);
  }
  $('#aviso-btn').addEventListener('click', function () { $('#aviso-f').classList.remove('ver'); pintarBolsa(); abrirHoja($('#dlg-bolsa')); });

  // ---------------- Pago ----------------
  function entregas() {
    var e = (S.tienda && S.tienda.entrega) || {};
    var r = [];
    if (e.envio) r.push('envio');
    if (e.recoger) r.push('recoger');
    return r.length ? r : ['envio'];
  }
  function abrirPago() {
    if (S.modo === 'cargando') { var b = $('#ir-pago'); if (b) { b.textContent = 'Un momento…'; b.disabled = true; } listo.then(abrirPago); return; }
    if (S.modo !== 'linea') { window.open(ligaWhatsapp(), '_blank', 'noopener'); return; }
    if (!lineas().length) return;
    S.codigo = null; S.cot = null;
    var ents = entregas(), e = S.tienda.entrega || {};
    var pers = lineas().filter(function (l) { return l.p.personalizado; });
    var opcionesEstado = '<option value="">Elige tu estado</option>' + ESTADOS.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    var html = '<div class="pago-g"><form class="pago-form" id="f-pago" novalidate>' +
      '<fieldset class="grupo"><legend>Tus datos<small>Te mandamos tu pedido y los datos para pagar a tu correo.</small></legend><div class="campos">' +
      campo('f-nombre', 'Nombre completo', '<input type="text" id="f-nombre" autocomplete="name" maxlength="80" required>', true) +
      campo('f-correo', 'Correo', '<input type="email" id="f-correo" autocomplete="email" maxlength="254" required>') +
      campo('f-wa', 'WhatsApp <i>(10 dígitos)</i>', '<input type="tel" id="f-wa" autocomplete="tel-national" inputmode="numeric" maxlength="16" required>') +
      '</div></fieldset>';
    if (ents.length > 1) {
      html += '<fieldset class="grupo"><legend>Entrega</legend>' +
        '<label class="check"><input type="radio" name="entrega" value="envio" checked><span>Envío a domicilio' + (e.envio && e.envio.nota ? '<br><small>' + esc(e.envio.nota) + '</small>' : '') + '</span></label>' +
        '<label class="check"><input type="radio" name="entrega" value="recoger"><span>Recoger' + (e.recoger && e.recoger.nota ? '<br><small>' + esc(e.recoger.nota) + '</small>' : '') + '</span></label></fieldset>';
    }
    html += '<fieldset class="grupo" id="g-direccion"' + (ents[0] === 'recoger' && ents.length === 1 ? ' hidden' : '') + '><legend>Dirección de envío<small>' + esc((e.envio && e.envio.nota) || 'Enviamos a todo México.') + '</small></legend><div class="campos">' +
      campo('f-calle', 'Calle y número', '<input type="text" id="f-calle" autocomplete="address-line1" maxlength="160" required>', true) +
      campo('f-colonia', 'Colonia', '<input type="text" id="f-colonia" autocomplete="address-level3" maxlength="100" required>') +
      campo('f-cp', 'Código postal', '<input type="text" id="f-cp" autocomplete="postal-code" inputmode="numeric" maxlength="5" required>') +
      campo('f-ciudad', 'Ciudad o municipio', '<input type="text" id="f-ciudad" autocomplete="address-level2" maxlength="80" required>') +
      campo('f-estado', 'Estado', '<select id="f-estado" autocomplete="address-level1" required>' + opcionesEstado + '</select>') +
      campo('f-ref', 'Referencias <i>(opcional)</i>', '<input type="text" id="f-ref" maxlength="200" placeholder="Entre calles, color de la casa…">', true) +
      '</div></fieldset>';
    if (pers.length) {
      html += '<fieldset class="grupo"><legend>Tu producto personalizado<small>Solo Ana Laura y su equipo ven tus respuestas y fotos; se usan únicamente para formular tu producto.</small></legend>' +
        pers.map(function (l) {
          var k = esc(l.p.key), nf = l.p.personalizado.fotos || 0;
          return '<div class="pers"><h3>' + esc(l.p.nombre) + '</h3>' +
            campo('f-resp-' + k, esc(l.p.personalizado.pregunta), '<textarea id="f-resp-' + k + '" data-resp="' + k + '" maxlength="1000" required placeholder="Por ejemplo: lacio, grueso, con frizz; quiero más brillo e hidratación"></textarea>', true) +
            (nf ? '<div class="campo"><span class="lbl">Fotos de tu cabello <i>(opcional, hasta ' + nf + ')</i></span><div class="fotos-sel" id="fotos-' + k + '"></div></div>' : '') +
            (l.p.preparacion ? '<p class="campo ayuda">Preparación: ' + esc(l.p.preparacion.charAt(0).toLowerCase() + l.p.preparacion.slice(1)) + '.</p>' : '') + '</div>';
        }).join('') + '</fieldset>';
    }
    html += '<fieldset class="grupo"><legend>Algo más</legend><div class="campos">' +
      campo('f-nota', 'Nota para tu pedido <i>(opcional)</i>', '<textarea id="f-nota" maxlength="500"></textarea>', true) +
      '</div></fieldset>' +
      '<fieldset class="grupo"><legend>Confirmación</legend>' +
      '<label class="check" id="c-priv"><input type="checkbox" id="f-priv" required><span>Acepto el <a href="' + esc(S.tienda.aviso_privacidad_url || 'https://vorka.mx/legal/vende/privacidad-clientas/') + '" target="_blank" rel="noopener">aviso de privacidad</a> y las <a href="#politicas" data-cerrar-pago>políticas de envío, cambios y privacidad</a>.</span></label>' +
      '<label class="check"><input type="checkbox" id="f-promo"><span>Quiero recibir novedades y descuentos especiales <i>(opcional)</i>.</span></label>' +
      '<p class="campo err" id="err-priv" hidden>Para hacer tu pedido acepta el aviso de privacidad.</p>' +
      '</fieldset>' +
      '<div class="error-gral" id="error-gral" role="alert" hidden></div>' +
      '<button class="boton enviar" type="submit" id="f-enviar">Hacer mi pedido</button>' +
      '<p class="seguro" style="margin-top:14px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>Pago por transferencia: al confirmar recibes los datos de la cuenta y ' + ((S.tienda.pago && S.tienda.pago.horas_para_pagar) || 24) + ' horas para transferir. Tus productos quedan apartados mientras tanto.</span></p>' +
      '</form>' +
      '<aside class="pago-res" aria-label="Resumen del pedido"><div class="pegajoso"><p class="res-tit">Tu pedido</p><ul class="res-items" id="res-items"></ul>' +
      '<div class="campo"><label for="f-codigo">Código de descuento</label><div class="codigo-fila"><input type="text" id="f-codigo" maxlength="30" autocomplete="off" spellcheck="false"><button class="mini claro" type="button" id="f-aplicar">Aplicar</button></div><p class="msg" id="msg-codigo" aria-live="polite"></p></div>' +
      '<div class="totales" id="totales"></div><p class="estado-cot" id="estado-cot" aria-live="polite"></p></div></aside></div>';
    $('#pg-titulo').textContent = 'Finalizar pedido';
    $('#pago-cuerpo').innerHTML = html;
    pers.forEach(function (l) { pintarFotos(l.p.key); });
    pintarResumen();
    abrirHoja($('#dlg-pago'));
    $('#dlg-pago').scrollTop = 0;
    cotizar();
  }
  function campo(id, etiqueta, control, ancho) {
    return '<div class="campo' + (ancho ? ' ancho' : '') + '" data-campo="' + id + '"><label for="' + id + '">' + etiqueta + '</label>' + control + '<span class="err" hidden></span></div>';
  }
  function entregaElegida() { var r = $('input[name=entrega]:checked'); return r ? r.value : entregas()[0]; }
  function itemsApi(conRespuesta) {
    return lineas().map(function (l) {
      var it = { producto_id: l.p.id, cantidad: l.item.cantidad };
      if (l.item.variante_id) it.variante_id = l.item.variante_id;
      if (conRespuesta && l.p.personalizado) { var t = $('[data-resp="' + l.p.key + '"]'); it.respuesta = t ? t.value.trim() : ''; }
      return it;
    });
  }

  function pintarResumen() {
    var ul = $('#res-items');
    if (!ul) return;
    ul.innerHTML = lineas().map(function (l) {
      return '<li><span class="mini-foto">' + imgHTML(l.p.fotos[0], '', l.p.marca).replace(/ alt="[^"]*"/, ' alt=""') + '<b>' + l.item.cantidad + '</b></span><span>' + esc(l.p.nombre) + (l.v ? '<br><small>' + esc(l.v.nombre) + '</small>' : '') + '</span><span class="precio">' + pesos(l.importe_c) + '</span></li>';
    }).join('');
    var c = S.cot, sub = c ? c.subtotal_c : subtotal(), est = $('#f-estado') ? $('#f-estado').value : '';
    var envio = !c ? '<span>Por calcular</span>' : c.envio_c === 0 ? '<span>' + (entregaElegida() === 'recoger' ? 'Sin costo' : 'Gratis') + '</span>' : '<span>' + pesos(c.envio_c) + '</span>';
    $('#totales').innerHTML = '<div><span>Subtotal</span><span>' + pesos(sub) + '</span></div>' +
      (c && c.descuento_c ? '<div class="desc"><span>Descuento' + (S.codigo ? ' (' + esc(S.codigo) + ')' : '') + '</span><span>−' + pesos(c.descuento_c) + '</span></div>' : '') +
      '<div><span>' + (entregaElegida() === 'recoger' ? 'Entrega' : 'Envío' + (c && c.envio_c && !est ? ' <small>(estimado)</small>' : '')) + '</span>' + envio + '</div>' +
      '<div class="total"><span>Total</span><span class="precio">' + pesos(c ? c.total_c : sub) + '<small>MXN</small></span></div>';
  }

  var cotT;
  function cotizar(inmediato) {
    clearTimeout(cotT);
    cotT = setTimeout(function () {
      var n = ++S.cotN, est = $('#f-estado') ? $('#f-estado').value : '', ent = entregaElegida();
      var cuerpo = { items: itemsApi(false), entrega: ent };
      if (ent === 'envio' && est) cuerpo.estado = est;
      if (S.codigo) cuerpo.codigo = S.codigo;
      $('#estado-cot').textContent = 'Calculando con los precios de la tienda…';
      api('/cotizar', { method: 'POST', json: cuerpo }).then(function (r) {
        if (n !== S.cotN || !$('#estado-cot')) return;
        if (r.ok && r.datos.valido === false && S.codigo) {
          S.codigo = null;
          mensajeCodigo(r.datos.mensaje || 'Ese código ya no aplica.', false);
          cotizar(true);
          return;
        }
        if (!r.ok) { S.cot = null; $('#estado-cot').textContent = r.datos.error || 'No pudimos calcular el total. Revisa tu conexión.'; pintarResumen(); return; }
        S.cot = r.datos;
        $('#estado-cot').textContent = '';
        pintarResumen();
      });
    }, inmediato ? 0 : 350);
  }
  function mensajeCodigo(t, ok) { var m = $('#msg-codigo'); if (m) { m.textContent = t || ''; m.className = 'msg ' + (ok ? 'ok' : 'mal'); } }
  function aplicarCodigo() {
    var c = ($('#f-codigo').value || '').trim().toUpperCase();
    if (!c) { S.codigo = null; mensajeCodigo('', true); cotizar(true); return; }
    if (!/^[\w-]{1,30}$/.test(c)) { mensajeCodigo('Revisa el código: solo letras, números y guiones.', false); return; }
    var b = $('#f-aplicar'); b.disabled = true;
    var est = $('#f-estado').value, ent = entregaElegida();
    var cuerpo = { codigo: c, items: itemsApi(false), entrega: ent };
    if (ent === 'envio' && est) cuerpo.estado = est;
    api('/promos/validar', { method: 'POST', json: cuerpo }).then(function (r) {
      b.disabled = false;
      if (r.ok && r.datos.valido) { S.codigo = c; S.cot = r.datos; mensajeCodigo(r.datos.mensaje || 'Código aplicado.', true); pintarResumen(); }
      else { S.codigo = null; mensajeCodigo((r.datos && (r.datos.mensaje || r.datos.error)) || 'No pudimos revisar el código. Intenta de nuevo.', false); cotizar(true); }
    });
  }

  // Fotos del producto personalizado (se suben después de crear el pedido)
  function pintarFotos(key) {
    var caja = document.getElementById('fotos-' + key);
    if (!caja) return;
    var p = producto(key), max = (p.personalizado && p.personalizado.fotos) || 0, sel = S.fotos[key] || [];
    caja.innerHTML = sel.map(function (f, i) { return '<figure><img src="' + f.url + '" alt="Foto ' + (i + 1) + ' de tu cabello"><button type="button" data-quitar-foto="' + esc(key) + '" data-i="' + i + '" aria-label="Quitar foto ' + (i + 1) + '">×</button></figure>'; }).join('') +
      (sel.length < max ? '<label class="archivo">+ Agregar foto<input type="file" accept="image/jpeg,image/png,image/webp,image/*" data-fotos="' + esc(key) + '"' + (max - sel.length > 1 ? ' multiple' : '') + '></label>' : '');
  }
  function reducir(file, max, calidad) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var e = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * e); c.height = Math.round(img.naturalHeight * e);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : mal(new Error('foto')); }, 'image/jpeg', calidad);
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error('foto')); };
      img.src = url;
    });
  }

  function validar() {
    var errores = [];
    function marca(id, msg) {
      var c = document.querySelector('[data-campo="' + id + '"]');
      if (!c) return;
      c.classList.toggle('error', !!msg);
      var s = $('.err', c); s.hidden = !msg; s.textContent = msg || '';
      var ctl = document.getElementById(id); if (ctl) ctl.setAttribute('aria-invalid', String(!!msg));
      if (msg) errores.push(id);
    }
    var v = function (id) { var x = document.getElementById(id); return x ? x.value.trim() : ''; };
    marca('f-nombre', v('f-nombre').length < 2 ? 'Escribe tu nombre.' : '');
    marca('f-correo', /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,24}$/i.test(v('f-correo')) ? '' : 'Revisa tu correo: ahí te mandamos tu pedido y los datos para pagar.');
    var wa = v('f-wa').replace(/\D/g, ''); if (wa.length === 12 && wa.indexOf('52') === 0) wa = wa.slice(2); if (wa.length === 13 && wa.indexOf('521') === 0) wa = wa.slice(3);
    marca('f-wa', wa.length === 10 ? '' : 'Escribe los 10 dígitos de tu WhatsApp.');
    if (entregaElegida() === 'envio') {
      marca('f-calle', v('f-calle').length < 3 ? 'Escribe la calle y el número.' : '');
      marca('f-colonia', v('f-colonia') ? '' : 'Escribe la colonia.');
      marca('f-cp', /^\d{5}$/.test(v('f-cp')) ? '' : 'El código postal son 5 números.');
      marca('f-ciudad', v('f-ciudad') ? '' : 'Escribe la ciudad o municipio.');
      marca('f-estado', v('f-estado') ? '' : 'Elige tu estado.');
    }
    $$('[data-resp]').forEach(function (t) { marca(t.id, t.value.trim().length < 3 ? 'Cuéntanos un poco de tu cabello para formular tu shampoo.' : ''); });
    var priv = $('#f-priv').checked;
    $('#err-priv').hidden = priv;
    if (!priv) errores.push('f-priv');
    if (errores.length) { var p = document.getElementById(errores[0]); if (p) { p.focus(); p.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    return { ok: !errores.length, wa: wa };
  }

  function enviarPedido(e) {
    e.preventDefault();
    if (S.enviando) return;
    var val = validar();
    if (!val.ok) return;
    var v = function (id) { var x = document.getElementById(id); return x ? x.value.trim() : ''; };
    var ent = entregaElegida();
    var cuerpo = { cliente: { nombre: v('f-nombre'), correo: v('f-correo').toLowerCase(), whatsapp: val.wa }, entrega: ent, items: itemsApi(true), acepta_privacidad: true, acepta_promociones: $('#f-promo').checked };
    if (ent === 'envio') {
      cuerpo.direccion = { calle: v('f-calle'), colonia: v('f-colonia'), cp: v('f-cp'), ciudad: v('f-ciudad'), estado: v('f-estado') };
      if (v('f-ref')) cuerpo.direccion.referencias = v('f-ref');
    }
    if (v('f-nota')) cuerpo.nota = v('f-nota');
    if (S.codigo) cuerpo.codigo = S.codigo;
    var boton = $('#f-enviar'), err = $('#error-gral');
    S.enviando = true; boton.setAttribute('aria-busy', 'true'); boton.textContent = 'Apartando tus productos…'; err.hidden = true;
    api('/pedidos', { method: 'POST', json: cuerpo }, 20000).then(function (r) {
      if (!r.ok || !r.datos.pedido) {
        S.enviando = false; boton.removeAttribute('aria-busy'); boton.textContent = 'Hacer mi pedido';
        var msg = r.status === 0 ? 'No pudimos conectar con la tienda. Revisa tu conexión e intenta de nuevo.' : (r.datos.error || 'No pudimos crear tu pedido. Intenta de nuevo.');
        err.innerHTML = esc(msg) + ' <a class="enlace" href="' + esc(ligaWhatsapp()) + '" target="_blank" rel="noopener">También puedes pedir por WhatsApp</a>.';
        err.hidden = false;
        err.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (r.status === 409) cotizar(true);
        return;
      }
      var pedido = r.datos.pedido;
      guardar(K_PEDIDO, { numero: pedido.numero, token: pedido.token, t: Date.now() });
      boton.textContent = 'Enviando tus fotos…';
      return subirFotos(pedido).then(function (resFotos) {
        S.bolsa = []; guardarBolsa(); pintarBolsa();
        S.fotos = {}; S.enviando = false; S.codigo = null; S.cot = null;
        pintarConfirmacion(pedido, pedido.token, resFotos);
      });
    });
  }
  function subirFotos(pedido) {
    var tareas = [], usadas = {};
    lineas().forEach(function (l) {
      var sel = S.fotos[l.p.key] || [];
      if (!sel.length) return;
      var partida = null;
      (pedido.items || []).forEach(function (it) { if (partida === null && it.producto_id === l.p.id && it.fotos_pedidas && !usadas[it.partida]) partida = it.partida; });
      if (partida === null) return;
      usadas[partida] = true;
      sel.forEach(function (f) { tareas.push({ partida: partida, blob: f.blob }); });
    });
    var res = { enviadas: 0, fallidas: 0 };
    return tareas.reduce(function (cadena, t) {
      return cadena.then(function () {
        return api('/pedidos/' + encodeURIComponent(pedido.token) + '/fotos/' + t.partida, { method: 'POST', blob: t.blob, tipo: 'image/jpeg' }, 30000)
          .then(function (r) { if (r.ok) res.enviadas++; else res.fallidas++; });
      });
    }, Promise.resolve()).then(function () { return res; });
  }

  // ---------------- Confirmación ----------------
  function pintarConfirmacion(p, token, fotos) {
    var esperando = p.estado === 'esperando_pago' && p.transferencia;
    var url = p.url || (token ? PEDIDO_URL + token : null);
    var tr = p.transferencia || {};
    var clabe = String(tr.clabe || '').replace(/(\d{3})(\d{3})(\d{11})(\d)/, '$1 $2 $3 $4');
    var h = '<div class="confirma">' +
      '<div class="confirma-enc"><span class="sello-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
      '<p class="num-pedido">Pedido<b>' + esc(p.numero) + '</b></p>' +
      '<h2 class="display" id="conf-titulo">' + (esperando ? 'Tus productos están apartados' : esc(p.estado_texto || 'Tu pedido')) + '</h2>' +
      '<p>' + (esperando ? 'Te enviamos este resumen y los datos para pagar a tu correo. Para confirmar tu pedido, transfiere el total y sube tu comprobante.' : 'Estado actual de tu pedido: ' + esc(p.estado_texto || '') + '.') + '</p></div>';
    if (esperando) {
      h += '<div class="limite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>Transfiere antes del <b>' + esc(p.limite_texto || '') + '</b>. Si no registramos tu pago a tiempo, el pedido se cancela y las piezas vuelven a la tienda.</span></div>' +
        '<section class="transferencia" aria-labelledby="t-tit"><div class="cab"><h3 id="t-tit">Datos para transferir</h3><p>Monto exacto: ' + pesos(tr.monto_c) + ' MXN</p></div><dl class="datos-t">' +
        filaDato('Banco', esc(tr.banco || '')) +
        filaDato('CLABE', esc(clabe), tr.clabe, true) +
        filaDato('Titular', esc(tr.titular || '')) +
        filaDato('Concepto', esc(tr.concepto || p.numero), tr.concepto || p.numero) +
        filaDato('Monto', pesos(tr.monto_c), String((tr.monto_c || 0) / 100)) +
        '</dl></section>' +
        '<section class="comprobante" aria-labelledby="c-tit"><h3 id="c-tit">¿Ya transferiste?</h3><p>Sube la captura o el PDF de tu comprobante. Lo revisamos y te avisamos por correo cuando confirmemos tu pago.</p>' +
        (p.comprobante_recibido ? '<p class="msg ok">Ya recibimos tu comprobante. Si necesitas cambiarlo, súbelo de nuevo.</p>' : '') +
        '<div class="fila"><label class="archivo">Subir comprobante<input type="file" id="f-comprobante" accept="image/jpeg,image/png,image/webp,application/pdf"></label>' +
        (url ? '<a class="enlace" href="' + esc(url) + '" target="_blank" rel="noopener">Ver mi pedido en línea</a>' : '') + '</div><p class="msg" id="msg-comprobante" aria-live="polite"></p></section>';
    } else if (url) {
      h += '<p style="text-align:center"><a class="enlace" href="' + esc(url) + '" target="_blank" rel="noopener">Ver el detalle de mi pedido</a></p>';
    }
    if (fotos && (fotos.enviadas || fotos.fallidas)) {
      h += '<p class="msg ' + (fotos.fallidas ? 'mal' : 'ok') + '" style="text-align:center">' + (fotos.fallidas
        ? 'Recibimos ' + fotos.enviadas + ' de ' + (fotos.enviadas + fotos.fallidas) + ' fotos de tu cabello. Mándanos las demás por WhatsApp con tu número de pedido.'
        : 'Recibimos ' + (fotos.enviadas === 1 ? 'tu foto' : 'tus ' + fotos.enviadas + ' fotos') + ' para formular tu shampoo.') + '</p>';
    }
    h += '<div class="resumen-c"><h3>Resumen</h3><ul class="res-items">' + (p.items || []).map(function (i) {
      return '<li><span class="mini-foto">' + imgHTML((producto(keyDeId(i.producto_id)) || { fotos: [] }).fotos[0]).replace(/ alt="[^"]*"/, ' alt=""') + '<b>' + i.cantidad + '</b></span><span>' + esc(i.nombre) +
        (i.preparacion ? '<br><small>Preparación: ' + esc(i.preparacion.toLowerCase()) + '</small>' : '') + '</span><span class="precio">' + pesos(i.importe_c) + '</span></li>';
    }).join('') + '</ul><div class="totales"><div><span>Subtotal</span><span>' + pesos(p.subtotal_c) + '</span></div>' +
      (p.descuento_c ? '<div class="desc"><span>Descuento' + (p.codigo ? ' (' + esc(p.codigo) + ')' : '') + '</span><span>−' + pesos(p.descuento_c) + '</span></div>' : '') +
      '<div><span>' + (p.entrega === 'recoger' ? 'Entrega' : 'Envío') + '</span><span>' + (p.envio_c ? pesos(p.envio_c) : (p.entrega === 'recoger' ? 'Sin costo' : 'Gratis')) + '</span></div>' +
      '<div class="total"><span>Total</span><span class="precio">' + pesos(p.total_c) + '<small>MXN</small></span></div></div></div>' +
      '<p style="text-align:center;display:flex;flex-wrap:wrap;gap:12px;justify-content:center"><button class="boton claro" type="button" data-cerrar>Seguir viendo la colección</button>' +
      '<a class="boton claro" href="' + esc(ligaWhatsapp('Hola, hice el pedido ' + p.numero + ' en la tienda de Ana Laura Makeup.')) + '" target="_blank" rel="noopener">' + ICONO_WA + ' Escribirnos</a></p>' +
      (p.politicas_url ? '<p style="text-align:center;font-size:13.5px;color:var(--suave)">Consulta las <a href="' + esc(p.politicas_url) + '" target="_blank" rel="noopener">políticas de envío, cambios y privacidad</a>.</p>' : '') + '</div>';
    $('#pg-titulo').textContent = 'Pedido ' + p.numero;
    $('#pago-cuerpo').innerHTML = h;
    var d = $('#dlg-pago');
    abrirHoja(d);
    d.scrollTop = 0;
    var comp = $('#f-comprobante');
    if (comp) comp.addEventListener('change', function () { subirComprobante(comp, token); });
  }
  function filaDato(nombre, valorHTML, copiar, grande) {
    return '<div><dt>' + nombre + '</dt><dd' + (grande ? ' class="grande"' : '') + '>' + valorHTML + '</dd>' +
      (copiar != null ? '<button class="copiar" type="button" data-copiar="' + esc(copiar) + '" aria-label="Copiar ' + nombre.toLowerCase() + '">Copiar</button>' : '<span></span>') + '</div>';
  }
  function keyDeId(id) { for (var i = 0; i < S.productos.length; i++) if (S.productos[i].id === id) return S.productos[i].key; return null; }
  function subirComprobante(input, token) {
    var f = input.files && input.files[0], msg = $('#msg-comprobante');
    if (!f || !token) return;
    var tipos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    msg.className = 'msg'; msg.textContent = 'Subiendo tu comprobante…';
    var listoArchivo;
    if (f.type === 'application/pdf') {
      if (f.size > 5 * 1024 * 1024) { msg.className = 'msg mal'; msg.textContent = 'El PDF pesa más de 5 MB. Sube una captura de pantalla del comprobante.'; return; }
      listoArchivo = Promise.resolve({ blob: f, tipo: f.type });
    } else if (tipos.indexOf(f.type) >= 0 && f.size <= 4.5 * 1024 * 1024) listoArchivo = Promise.resolve({ blob: f, tipo: f.type });
    else listoArchivo = reducir(f, 2000, 0.88).then(function (b) { return { blob: b, tipo: 'image/jpeg' }; });
    listoArchivo.then(function (a) {
      return api('/pedidos/' + encodeURIComponent(token) + '/comprobante', { method: 'POST', blob: a.blob, tipo: a.tipo }, 30000);
    }).then(function (r) {
      msg.className = 'msg ' + (r.ok ? 'ok' : 'mal');
      msg.textContent = r.ok ? 'Recibimos tu comprobante. Lo revisamos y te avisamos por correo cuando confirmemos tu pago.' : (r.datos.error || 'No pudimos subir tu comprobante. Intenta de nuevo.');
    }, function () { msg.className = 'msg mal'; msg.textContent = 'No pudimos leer ese archivo. Sube una foto (JPG o PNG) o un PDF.'; });
    input.value = '';
  }
  function verUltimo() {
    var u = leer(K_PEDIDO);
    if (!u || !u.token) return;
    $('#pg-titulo').textContent = 'Tu pedido';
    $('#pago-cuerpo').innerHTML = '<div class="confirma"><p class="estado-cot" style="text-align:center">Buscando tu pedido…</p></div>';
    abrirHoja($('#dlg-pago'));
    api('/pedidos/' + encodeURIComponent(u.token)).then(function (r) {
      if (r.ok && r.datos.pedido) pintarConfirmacion(r.datos.pedido, u.token);
      else {
        if (r.status === 404) guardar(K_PEDIDO, null);
        $('#pago-cuerpo').innerHTML = '<div class="confirma"><p class="estado-cot" style="text-align:center">' + esc(r.datos.error || 'No pudimos abrir tu pedido. Revisa el correo de confirmación.') + '</p></div>';
      }
    });
  }

  // ---------------- Eventos generales ----------------
  document.addEventListener('click', function (e) {
    var ver = e.target.closest('[data-ver]');
    if (ver) { e.preventDefault(); abrirProducto(ver.dataset.ver); return; }
    var ag = e.target.closest('[data-agregar]');
    if (ag) { agregar(ag.dataset.agregar, 1, null); return; }
    var fi = e.target.closest('[data-filtro]');
    if (fi) { S.filtro = fi.dataset.filtro; pintarColeccion(); return; }
    var cp = e.target.closest('[data-copiar]');
    if (cp) {
      var t = cp.dataset.copiar.replace(/\s/g, '');
      var hecho = function () { cp.textContent = 'Copiado'; setTimeout(function () { cp.textContent = 'Copiar'; }, 1800); };
      try { navigator.clipboard.writeText(t).then(hecho, function () { aviso(t, true); }); } catch (x) { aviso(t, true); }
      return;
    }
    var qf = e.target.closest('[data-quitar-foto]');
    if (qf) {
      var k = qf.dataset.quitarFoto, lista = S.fotos[k] || [], f = lista.splice(Number(qf.dataset.i), 1)[0];
      if (f) URL.revokeObjectURL(f.url);
      pintarFotos(k);
      return;
    }
    if (e.target.closest('[data-cerrar-pago]')) { cerrarHoja($('#dlg-pago')); }
  });
  document.addEventListener('submit', function (e) { if (e.target.id === 'f-pago') enviarPedido(e); });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'f-estado' || t.name === 'entrega') {
      if (t.name === 'entrega') { var g = $('#g-direccion'); if (g) g.hidden = t.value !== 'envio'; }
      cotizar();
    }
    if (t.dataset && t.dataset.fotos) {
      var k = t.dataset.fotos, p = producto(k), max = (p && p.personalizado && p.personalizado.fotos) || 0;
      S.fotos[k] = S.fotos[k] || [];
      var archivos = Array.prototype.slice.call(t.files || []).slice(0, Math.max(0, max - S.fotos[k].length));
      Promise.all(archivos.map(function (f) { return reducir(f, 1600, 0.85).catch(function () { return null; }); })).then(function (blobs) {
        blobs.forEach(function (b) { if (b && b.size <= 3 * 1024 * 1024) S.fotos[k].push({ blob: b, url: URL.createObjectURL(b) }); });
        if (blobs.some(function (b) { return !b; })) aviso('Una de las fotos no se pudo leer. Usa JPG o PNG.', true);
        pintarFotos(k);
      });
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'f-codigo') { if (!e.target.value.trim() && S.codigo) { S.codigo = null; mensajeCodigo('', true); cotizar(); } }
    var c = e.target.closest && e.target.closest('.campo.error');
    if (c) { c.classList.remove('error'); var s = $('.err', c); if (s) s.hidden = true; }
    if (e.target.id === 'f-priv') $('#err-priv').hidden = true;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'f-codigo') { e.preventDefault(); aplicarCodigo(); }
  });
  document.addEventListener('click', function (e) { if (e.target.closest('#f-aplicar')) aplicarCodigo(); });
  window.addEventListener('hashchange', function () { if (/^#p\//.test(location.hash)) abrirProducto(decodeURIComponent(location.hash.slice(3))); });

  // ---------------- Inicio ----------------
  pintarColeccion();
  pintarBolsa();
  $('#aviso-wa').href = ligaWhatsapp();
  listo = cargar().catch(function () { ponerModo('whatsapp'); });
  if (/^#p\//.test(location.hash)) { var inicial = decodeURIComponent(location.hash.slice(3)); listo.then(function () { abrirProducto(inicial); }); }
})();
