import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { number: "+700", label: "Integrantes", description: "Jóvenes comprometidos" },
  { number: "+12", label: "Estados", description: "En toda la república" },
  { number: "7", label: "Áreas", description: "De impacto social" },
];

export default function Stats({ workshopImage }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="stats" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/40" />

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest mb-4">
            Números reales
          </span>
          <h2 className="font-space font-bold text-4xl lg:text-6xl text-foreground leading-tight">
            Alcance que habla
            <span className="text-primary">.</span>
          </h2>
        </motion.div>

        {/* Stats row */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative bg-foreground rounded-3xl p-8 lg:p-10 overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
              <p className="font-space font-black text-6xl lg:text-8xl text-primary leading-none">
                {s.number}
              </p>
              <p className="font-space font-bold text-xl text-white mt-3">{s.label}</p>
              <p className="text-white/40 text-sm mt-1">{s.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Full image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative rounded-3xl overflow-hidden aspect-[21/9] shadow-2xl"
        >
          <img
            src={workshopImage}
            alt="IMPACTO en acción comunitaria"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/20 to-transparent" />
          <div className="absolute inset-0 flex items-end p-8 lg:p-12">
            <div>
              <p className="text-primary font-bold text-sm uppercase tracking-widest mb-2">
                IMPACTO en el campo
              </p>
              <p className="text-white font-space font-bold text-2xl lg:text-4xl max-w-lg">
                Proyectos reales, comunidades reales.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}