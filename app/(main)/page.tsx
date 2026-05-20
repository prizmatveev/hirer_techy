"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Handshake, Store, ShoppingBag, Building2, Users, ShieldCheck, Truck } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { useAppStore } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";

type Job = {
  id: string;
  title: string;
  category: string;
  location: string;
  employmentType: string;
};

const baseCategories = ["Web Development", "App Development", "Graphics Design", "Explore All Roles"];

export default function Home() {
  const { category, setCategory } = useAppStore();
  const [jobs, setJobs] = useState<Job[]>([]);

  const loadJobs = async () => {
    const res = await fetch('/api/jobs', { cache: 'no-store' });
    if (!res.ok) return;
    setJobs(await res.json());
  };

  useEffect(() => {
    void loadJobs();

    const intervalId = window.setInterval(() => {
      void loadJobs();
    }, 5000);

    const handleFocus = () => {
      void loadJobs();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set(jobs.map((j) => j.category).filter(Boolean)));
    return Array.from(new Set([...baseCategories.slice(0, 3), ...dynamic, 'Explore All Roles']));
  }, [jobs]);

  const filtered = category === "Explore All Roles" ? jobs : jobs.filter((j) => j.category === category);

  return (
    <main className="pb-12">
      <Navbar />
      <section className="container shell p-8 md:p-12 grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl leading-tight font-extrabold">Work with Us</h1>
          <p className="text-[#4A5568] text-lg max-w-xl">Find jobs that match your interests and abilities with a minimal, modern hiring experience.</p>
          <button className="btn-primary" onClick={() => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" })}>Get Started</button>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[#e5f2f4] min-h-[360px]" />
      </section>

      <section className="container -mt-8 relative z-10">
        <div className="card p-4 md:p-5 grid md:grid-cols-4 gap-3">
          {categories.map((c) => {
            const isExploreAll = c === "Explore All Roles";
            return (
              <button key={c} onClick={() => { setCategory(c); document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" }); }} className={`rounded-xl border border-[var(--line)] px-4 py-3 text-sm transition ${isExploreAll ? "bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200" : "hover:bg-[color:rgba(123,208,211,0.12)] hover:border-[#c2dfe2]"}`}>{c}</button>
            );
          })}
        </div>
      </section>

      <section id="jobs" className="container py-12 space-y-4">
        <div className="flex justify-end">
          <button className="border rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 transition" onClick={() => void loadJobs()}>Refresh Jobs</button>
        </div>
        {filtered.map((job) => (
          <motion.article key={job.id} whileHover={{ scale: 1.01 }} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <p className="text-sm text-zinc-600">{job.category} • {job.location} • {job.employmentType}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="border rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 transition" onClick={() => void loadJobs()}>Refresh Jobs</button>
              <Link href={`/jobs/${job.id}`} className="btn-primary text-sm">Apply Now</Link>
            </div>
          </motion.article>
        ))}
      </section>

      <section id="about" className="container py-6 space-y-5">
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-2">About LocalSM</h2>
          <p className="text-zinc-600">Jabalpur's premier online marketplace, connecting buyers and sellers within our city. Empowering local businesses and making shopping convenient for everyone.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Handshake, value: '55+', label: 'Happy Customers' },
            { icon: Store, value: '17+', label: 'Local Sellers' },
            { icon: ShoppingBag, value: '19+', label: 'Products Listed' },
            { icon: Building2, value: 'Jabalpur', label: 'Our City' },
          ].map((item) => (
            <div key={item.label} className="card p-6 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[var(--accent)] text-[#0f2526] grid place-items-center"><item.icon size={24} /></div>
              <p className="text-4xl font-bold">{item.value}</p>
              <p className="text-zinc-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Store, title: 'Local Products', text: 'Curated selection of products from Jabalpur sellers' },
            { icon: Users, title: 'Community First', text: 'Supporting local businesses and entrepreneurs' },
            { icon: ShieldCheck, title: 'Secure Shopping', text: 'Safe transactions with Cash on Delivery' },
            { icon: Truck, title: 'Fast Delivery', text: 'Quick delivery within Jabalpur city' },
          ].map((item) => (
            <div key={item.title} className="card p-6 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[var(--accent)] text-[#0f2526] grid place-items-center"><item.icon size={24} /></div>
              <h3 className="text-2xl font-semibold">{item.title}</h3>
              <p className="text-zinc-500 mt-2">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="container py-2">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-5"><p className="text-sm text-zinc-500">Email</p><p className="font-semibold break-all">aadiyandubey@gmail.com</p></div>
          <div className="card p-5"><p className="text-sm text-zinc-500">Phone</p><p className="font-semibold">+917089152020</p></div>
          <div className="card p-5"><p className="text-sm text-zinc-500">Address</p><p className="font-semibold">Jabalpur</p></div>
        </div>
      </section>

    </main>
  );
}
