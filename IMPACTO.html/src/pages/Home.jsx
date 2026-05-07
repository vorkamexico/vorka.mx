const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import About from "../components/landing/About";
import MissionVision from "../components/landing/MissionVision";
import ImpactAreas from "../components/landing/ImpactAreas";
import Stats from "../components/landing/Stats";
import Testimonials from "../components/landing/Testimonials";
import BlogPreview from "../components/landing/BlogPreview";
import CallToAction from "../components/landing/CallToAction";
import Contact from "../components/landing/Contact";
import Footer from "../components/landing/Footer";

const IMAGES = {
  hero: "https://media.db.com/images/public/69c1bac13e6407793066924c/b7d3a9bac_generated_19a00e50.png",
  education: "https://media.db.com/images/public/69c1bac13e6407793066924c/2bfee377a_generated_72c15a0a.png",
  workshop: "https://media.db.com/images/public/69c1bac13e6407793066924c/c38aa8333_generated_dae7114b.png",
  art: "https://media.db.com/images/public/69c1bac13e6407793066924c/7b5f07340_generated_3d815f93.png",
  environment: "https://media.db.com/images/public/69c1bac13e6407793066924c/2b816e3c2_generated_429a5f41.png",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero heroImage={IMAGES.hero} />
      <About educationImage={IMAGES.education} />
      <MissionVision />
      <ImpactAreas />
      <Stats workshopImage={IMAGES.workshop} />
      <Testimonials />
      <BlogPreview artImage={IMAGES.art} envImage={IMAGES.environment} />
      <CallToAction />
      <Contact />
      <Footer />
    </div>
  );
}