"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogin(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState(''); const router=useRouter();
  const submit=async(e:React.FormEvent)=>{e.preventDefault();const res=await fetch('/api/admin/login',{method:'POST',body:JSON.stringify({email,password})});const data=await res.json();if(!res.ok) return setMsg(data.error||'Login failed');router.push('/admin/dashboard');};
  return <main className='min-h-screen grid place-items-center p-6'><form onSubmit={submit} className='card p-8 w-full max-w-md space-y-4'><h1 className='text-2xl font-semibold'>Recruiter Login</h1><input className='border rounded-lg p-3 w-full' placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)}/><input type='password' className='border rounded-lg p-3 w-full' placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)}/><button className='w-full btn-primary'>Sign In</button><p className='text-sm text-zinc-600'>{msg}</p><Link href='/admin/register' className='text-sm underline'>Create admin account</Link></form></main>
}
