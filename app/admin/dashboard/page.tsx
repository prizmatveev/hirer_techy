import { prisma } from '@/lib/prisma';

export default async function AdminDashboard(){
  const [applications,jobs]=await Promise.all([
    prisma.application.findMany({include:{user:true,job:true,notes:true},orderBy:{createdAt:'desc'}}),
    prisma.job.findMany({orderBy:{createdAt:'desc'}})
  ]);
  const newApplicants=applications.filter(a=>Date.now()-new Date(a.createdAt).getTime()<7*24*3600*1000).length;
  return <main className='container py-10 space-y-6'>
    <h1 className='text-3xl font-semibold'>Admin Dashboard</h1>
    <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      <div className='card p-4'>Total applications: {applications.length}</div>
      <div className='card p-4'>Open positions: {jobs.filter(j=>j.isOpen).length}</div>
      <div className='card p-4'>New applicants: {newApplicants}</div>
      <div className='card p-4'>Hiring analytics: {Math.round((applications.filter(a=>a.status==='HIRED').length/Math.max(1,applications.length))*100)}% hired</div>
    </div>

    <section className='card p-4 space-y-3'>
      <h2 className='font-semibold'>Jobs Management</h2>
      <p className='text-sm text-zinc-600'>Use API endpoints to add/edit/delete jobs: POST /api/admin/jobs, PATCH/DELETE /api/admin/jobs/:id.</p>
      <div className='grid gap-2'>{jobs.map(j=><div key={j.id} className='border rounded p-3 flex justify-between'><span>{j.title} ({j.category})</span><span>{j.isOpen?'Open':'Closed'}</span></div>)}</div>
    </section>

    <section className='card p-4 overflow-auto'>
      <h2 className='font-semibold mb-3'>Applicants</h2>
      <table className='w-full text-sm'><thead><tr className='border-b'><th className='text-left p-2'>Candidate</th><th>Role</th><th>Status</th><th>Resume</th><th>Links</th><th>Notes</th></tr></thead><tbody>
        {applications.map(a=><tr key={a.id} className='border-b align-top'><td className='p-2'>{a.user.name}<div className='text-zinc-500'>{a.user.email}<br/>{a.phone}</div></td><td>{a.job.title}</td><td>{a.status}</td><td><a href={a.resume} className='underline'>Download</a></td><td><a className='underline mr-2' href={a.linkedin}>LinkedIn</a><a className='underline' href={a.github}>GitHub</a></td><td>{a.notes.map(n=><div key={n.id}>• {n.note}</div>)}</td></tr>)}
      </tbody></table>
    </section>
  </main>
}
