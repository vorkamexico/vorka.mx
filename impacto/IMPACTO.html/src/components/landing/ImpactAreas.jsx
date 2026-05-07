import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Radio, Users, Leaf, Heart, Lightbulb, GraduationCap, Palette,
} from "lucide-react";

const areas = [
  { icon: Radio, title: "Comunicaciones Sociales", description: "Amplificamos las voces juveniles en medios digitales y comunitarios.", color: "bg-blue-500" },
  { icon: Users, title: "Equidad de Género", description: "Promovemos la igualdad y combatimos la violencia de género.", color: "bg-rose-500" },
  { icon: Leaf, title: "Cuidado Ambiental", description: "Impulsamos prácticas sostenibles para proteger nuestro planeta.", color: "bg-green-500" },
  { icon: Heart, title: "Cuidado Animal", description: "Fomentamos el respeto y protección de todas las formas de vida.", color: "bg-pink-500" },
  { icon: Lightbulb, title: "Emprendimiento Juvenil", description: "Desarrollamos habilidades para generar impacto económico y social.", color: "bg-primary" },
  { icon: GraduationCap, title: "Educación de Calidad", description: "Garantizamos acceso a educación inclusiva y transformadora.", color: "bg-purple-500" },
  { icon: Palette, title: "Arte y Cultura", description: "Usamos el arte como herramienta de cohesión y cambio social.", color: "bg-orange-500" },
];

export default function ImpactAreas() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="areas" className="py-24 lg:py-32 bg-foreground relative overflow-hidden">
      {/* Big decorative text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="font-space font-black text-[18vw] text-white/[0.02] leading-none whitespace-nowrap">
          ÁREAS
        </span>
      </div>
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16"
        >
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest mb-4">
              Nuestras áreas
            </span>
            <h2 className="font-space font-bold text-4xl lg:text-6xl text-white leading-tight">
              Siete esferas
              <br />
              de cambio<span className="text-primary">.</span>
            </h2>
          </div>
          <p className="text-white/50 max-w-sm text-base leading-relaxed">
            Trabajamos en múltiples frentes para construir un México más justo, equitativo y sostenible.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {areas.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${area.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <area.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-space font-semibold text-base text-white mb-2">
                {area.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {area.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}