import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Globe, Instagram } from "lucide-react";

const links = [
  {
    icon: Mail,
    label: "Email",
    value: "impactoo.mex@gmail.com",
    href: "mailto:impactoo.mex@gmail.com",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@impacto.mex",
    href: "https://instagram.com/impacto.mex",
  },
  {
    icon: Globe,
    label: "Sitio web",
    value: "impacto.org",
    href: "https://impacto.org",
  },
];

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="contact" className="py-24 lg:py-32 bg-gradient-to-b from-background to-secondary/30">
      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Contacto
          </span>
          <h2 className="font-space font-bold text-3xl lg:text-5xl mt-3 text-foreground">
            Conectemos
          </h2>
          <p className="text-muted-foreground text-lg mt-4 max-w-xl mx-auto">
            ¿Tienes preguntas, ideas o quieres colaborar? Estamos a un mensaje de distancia.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {links.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-400"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <link.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{link.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{link.value}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}