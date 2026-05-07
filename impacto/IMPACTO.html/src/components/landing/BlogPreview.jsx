import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";

export default function BlogPreview({ artImage, envImage }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const posts = [
    {
      image: artImage,
      tag: "Arte y Cultura",
      title: "Jóvenes transforman espacios públicos a través del arte urbano",
      date: "15 Mar 2026",
      excerpt: "Un grupo de voluntarios de IMPACTO lideró una intervención artística en tres colonias, conectando a la comunidad a través del muralismo.",
    },
    {
      image: envImage,
      tag: "Cuidado Ambiental",
      title: "IMPACTO lidera jornada de limpieza en ríos de Jalisco",
      date: "8 Mar 2026",
      excerpt: "Más de 120 jóvenes participaron en la limpieza de tres ríos, retirando más de 2 toneladas de residuos.",
    },
  ];

  return (
    <section className="py-24 lg:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">
              Noticias
            </span>
            <h2 className="font-space font-bold text-3xl lg:text-5xl mt-3 text-foreground">
              Últimas historias
            </h2>
          </div>
          <a href="#" className="group inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all">
            Ver todas
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {posts.map((post, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="group cursor-pointer"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-5">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-500" />
                <span className="absolute top-4 left-4 px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-semibold text-foreground">
                  {post.tag}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="w-4 h-4" />
                {post.date}
              </div>
              <h3 className="font-space font-bold text-xl text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
                {post.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {post.excerpt}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}