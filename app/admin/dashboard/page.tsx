"use client";

import { useEffect, useMemo, useState } from "react";

type Job = {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  salary: string;
  experience: string;
  employmentType: string;
  skills: string[];
  isOpen: boolean;
};

type Note = { id: string; note: string };
type AppRow = {
  id: string;
  phone: string;
  resume: string;
  linkedin: string;
  github: string;
  portfolio?: string | null;
  status: "PENDING" | "REVIEWING" | "SHORTLISTED" | "REJECTED" | "HIRED";
  createdAt: string;
  user: { name: string; email: string };
  job: { title: string; category: string };
  notes: Note[];
  location?: string | null;
  yearsExperience?: string | null;
  currentCompany?: string | null;
  expectedSalary?: string | null;
  coverLetter?: string | null;
};

const statusOptions = ["PENDING", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"] as const;
const defaultCategories = ["Web Development", "App Development", "Graphics Design"];
const experienceOptions = ["Intern", "Fresher", "Mid-level", "Experienced"];
const employmentTypeOptions = ["Part Time", "Full Time"];

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<AppRow | null>(null);
  const [jobForm, setJobForm] = useState({ title: "", category: defaultCategories[0], description: "", location: "", salary: "", experience: experienceOptions[0], employmentType: employmentTypeOptions[1], skills: "" });
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const load = async () => {
    const [jobsResult, appsResult] = await Promise.allSettled([
      fetch(`/api/admin/jobs?t=${Date.now()}`, { cache: "no-store" }),
      fetch(`/api/admin/applications?t=${Date.now()}`, { cache: "no-store" }),
    ]);

    if (jobsResult.status === "fulfilled" && jobsResult.value.ok) {
      const loadedJobs: Job[] = await jobsResult.value.json();
      setJobs(loadedJobs);
      const fromJobsCategories = Array.from(new Set(loadedJobs.map((j) => j.category).filter(Boolean)));
      const fromJobsSkills = Array.from(new Set(loadedJobs.flatMap((j) => j.skills || []).map((s) => s.trim()).filter(Boolean)));
      const savedCategories = JSON.parse(localStorage.getItem("admin_categories") || "[]") as string[];
      const savedSkills = JSON.parse(localStorage.getItem("admin_skill_suggestions") || "[]") as string[];
      const mergedCategories = Array.from(new Set([...defaultCategories, ...fromJobsCategories, ...savedCategories]));
      const mergedSkills = Array.from(new Set([...fromJobsSkills, ...savedSkills]));
      setCategories(mergedCategories);
      setSkillSuggestions(mergedSkills);
      localStorage.setItem("admin_categories", JSON.stringify(mergedCategories));
      localStorage.setItem("admin_skill_suggestions", JSON.stringify(mergedSkills));
    }

    if (appsResult.status === "fulfilled" && appsResult.value.ok) {
      setApplications(await appsResult.value.json());
    }
  };

  useEffect(() => {
    void load();

    const intervalId = window.setInterval(() => {
      void load();
    }, 5000);

    const handleFocus = () => {
      void load();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  const filteredApplications = useMemo(() => applications.filter((a) => {
    const q = query.toLowerCase();
    const matchesQ = !q || a.user.name.toLowerCase().includes(q) || a.user.email.toLowerCase().includes(q) || a.job.title.toLowerCase().includes(q);
    const matchesS = !statusFilter || a.status === statusFilter;
    return matchesQ && matchesS;
  }), [applications, query, statusFilter]);

  const newApplicants = applications.filter((a) => Date.now() - new Date(a.createdAt).getTime() < 7 * 24 * 3600 * 1000).length;
  const hiredRate = Math.round((applications.filter((a) => a.status === "HIRED").length / Math.max(1, applications.length)) * 100);

  const parseSkills = (value: string) => value.split(",").map((s) => s.trim()).filter(Boolean);

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSkills = parseSkills(skillInput || jobForm.skills);
    await fetch("/api/admin/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...jobForm, skills: parsedSkills, isOpen: true }) });
    const mergedSkills = Array.from(new Set([...skillSuggestions, ...parsedSkills]));
    setSkillSuggestions(mergedSkills);
    localStorage.setItem("admin_skill_suggestions", JSON.stringify(mergedSkills));
    setJobForm({ title: "", category: categories[0] || defaultCategories[0], description: "", location: "", salary: "", experience: experienceOptions[0], employmentType: employmentTypeOptions[1], skills: "" });
    setSkillInput("");
    await load();
  };

  const handleCategoryChange = (value: string) => {
    if (value !== "__add__") {
      setJobForm((prev) => ({ ...prev, category: value }));
      return;
    }
    const newCategory = prompt("Add new category")?.trim();
    if (!newCategory) return;
    const merged = Array.from(new Set([...categories, newCategory]));
    setCategories(merged);
    localStorage.setItem("admin_categories", JSON.stringify(merged));
    setJobForm((prev) => ({ ...prev, category: newCategory }));
  };

  const handleSkillsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const entered = parseSkills(skillInput);
    if (!entered.length) return;
    const mergedSkills = Array.from(new Set([...skillSuggestions, ...entered]));
    setSkillSuggestions(mergedSkills);
    localStorage.setItem("admin_skill_suggestions", JSON.stringify(mergedSkills));
  };

  const addSuggestedSkill = (skill: string) => {
    const current = parseSkills(skillInput);
    if (current.includes(skill)) return;
    const next = [...current, skill].join(", ");
    setSkillInput(next);
    setJobForm((prev) => ({ ...prev, skills: next }));
  };

  const currentSkillTokens = parseSkills(skillInput);
  const visibleSkillSuggestions = skillSuggestions.filter((s) => !currentSkillTokens.includes(s)).slice(0, 8);


  return <main className="container py-10 space-y-6">
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <button className="border rounded-lg px-3 py-2 text-sm" onClick={() => void load()}>Refresh</button>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card p-4">Total applications: {applications.length}</div>
      <div className="card p-4">Open positions: {jobs.filter((j) => j.isOpen).length}</div>
      <div className="card p-4">New applicants: {newApplicants}</div>
      <div className="card p-4">Hiring analytics: {hiredRate}% hired</div>
    </div>

    <section className="card p-4 space-y-3">
      <h2 className="font-semibold">Jobs Management</h2>
      <form onSubmit={addJob} className="grid md:grid-cols-4 gap-2">
        <input className="border rounded p-2" placeholder="Title" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required />
        <select className="border rounded p-2" value={jobForm.category} onChange={(e) => handleCategoryChange(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__add__">+ Add</option>
        </select>
        <input className="border rounded p-2" placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} required />
        <input className="border rounded p-2" placeholder="Salary" value={jobForm.salary} onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })} required />
        <select className="border rounded p-2" value={jobForm.experience} onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}>
          {experienceOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select className="border rounded p-2" value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}>
          {employmentTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="md:col-span-2 space-y-2">
          <input className="border rounded p-2 w-full" placeholder="Skills comma separated" value={skillInput} onChange={(e) => { setSkillInput(e.target.value); setJobForm({ ...jobForm, skills: e.target.value }); }} onKeyDown={handleSkillsKeyDown} />
          {visibleSkillSuggestions.length > 0 && <div className="flex flex-wrap gap-2">{visibleSkillSuggestions.map((skill) => <button key={skill} type="button" className="text-xs border rounded-full px-2 py-1 hover:bg-zinc-50" onClick={() => addSuggestedSkill(skill)}>{skill}</button>)}</div>}
        </div>
        <textarea className="border rounded p-2 md:col-span-4" placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} required />
        <button className="btn-primary md:col-span-1" type="submit">Add Job</button>
      </form>

      <div className="grid gap-2">
        {jobs.map((j) => <div key={j.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span>{j.title} ({j.category}) - {j.location}</span>
          <div className="flex gap-2">
            <button className="border rounded px-3 py-1" onClick={async () => { await fetch(`/api/admin/jobs/${j.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isOpen: !j.isOpen }) }); await load(); }}>{j.isOpen ? "Mark Closed" : "Mark Open"}</button>
            <button className="border rounded px-3 py-1" onClick={async () => { const title = prompt("Edit job title", j.title); if (!title) return; await fetch(`/api/admin/jobs/${j.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) }); await load(); }}>Edit</button>
            <button className="border rounded px-3 py-1 text-red-600" onClick={async () => { await fetch(`/api/admin/jobs/${j.id}`, { method: "DELETE" }); await load(); }}>Delete</button>
          </div>
        </div>)}
      </div>
    </section>

    <section className="card p-4 overflow-auto space-y-3">
      <h2 className="font-semibold">Applicants</h2>
      <div className="flex flex-col md:flex-row gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search candidate, email, role" className="border rounded-lg p-2 md:min-w-72" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg p-2">
          <option value="">All statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="border-b"><th className="text-left p-2">Candidate</th><th>Field</th><th>Role</th><th>Status</th><th>Resume</th><th>Actions</th></tr></thead>
        <tbody>
          {filteredApplications.map((a) => <tr key={a.id} className="border-b align-top"><td className="p-2">{a.user.name}<div className="text-zinc-500">{a.user.email}<br />{a.phone}</div></td><td>{a.job.category}</td><td>{a.job.title}</td><td>{a.status}</td><td><a href={`/api/admin/applications/${a.id}/resume?download=1`} className="underline" target="_blank" rel="noopener noreferrer">Download</a></td><td className="p-2"><div className="flex gap-2 flex-wrap">
            <select className="border rounded p-1" value={a.status} onChange={async (e) => {
              const nextStatus = e.target.value as AppRow["status"];
              setApplications((prev) => prev.map((row) => row.id === a.id ? { ...row, status: nextStatus } : row));
              const res = await fetch(`/api/admin/applications/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
              if (!res.ok) {
                await load();
                return;
              }
              await load();
            }}>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="border rounded px-2" onClick={() => { setSelected(a); setNoteDraft(""); }}>Profile</button>
          </div></td></tr>)}
        </tbody>
      </table>
    </section>

    {selected && <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={() => setSelected(null)}>
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold">Candidate Profile</h3>
        <p>{selected.user.name} • {selected.user.email} • {selected.phone}</p>
        <p><a className="underline mr-2" href={selected.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a><a className="underline mr-2" href={selected.github} target="_blank" rel="noopener noreferrer">GitHub</a>{selected.portfolio && <a className="underline" href={selected.portfolio} target="_blank" rel="noopener noreferrer">Portfolio</a>}</p>
        <p><a className="underline mr-2" href={`/api/admin/applications/${selected.id}/resume`} target="_blank" rel="noopener noreferrer">Resume Preview</a><a className="underline" href={`/api/admin/applications/${selected.id}/resume?download=1`} target="_blank" rel="noopener noreferrer">Download Resume</a></p>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Current Location:</span> {selected.location || "—"}</p>
          <p><span className="font-medium">Years of Experience:</span> {selected.yearsExperience || "—"}</p>
          <p><span className="font-medium">Current Company:</span> {selected.currentCompany || "—"}</p>
          <p><span className="font-medium">Expected Salary:</span> {selected.expectedSalary || "—"}</p>
        </div>
        <div>
          <h4 className="font-medium">Cover Letter</h4>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{selected.coverLetter || "—"}</p>
        </div>
        <div className="space-y-2"><h4 className="font-medium">Notes</h4>{selected.notes.length === 0 && <p className="text-sm text-zinc-500">No notes yet.</p>}{selected.notes.map((n) => <div key={n.id}>• {n.note}</div>)}
          <form className="flex flex-col sm:flex-row gap-2" onSubmit={async (e) => {
            e.preventDefault();
            const note = noteDraft.trim();
            if (!note) return;
            setIsSavingNote(true);
            const res = await fetch(`/api/admin/applications/${selected.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ note }),
            });
            setIsSavingNote(false);
            if (!res.ok) return;
            setNoteDraft("");
            setSelected((prev) => prev ? { ...prev, notes: [...prev.notes, { id: `tmp-${Date.now()}`, note }] } : prev);
            await load();
          }}>
            <input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="border rounded p-2 flex-1"
              placeholder="Write a note about this candidate"
            />
            <button type="submit" className="border rounded px-3 py-2" disabled={isSavingNote || !noteDraft.trim()}>{isSavingNote ? "Saving..." : "Add Note"}</button>
          </form>
        </div>
      </div>
    </div>}
  </main>;
}
