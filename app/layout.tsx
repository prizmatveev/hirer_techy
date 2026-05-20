import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { BackButton } from '@/components/layout/back-button';
export const metadata:Metadata={title:'HireTech ATS',description:'Minimal hiring platform for tech teams'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang='en'><body><BackButton />{children}<Toaster richColors={false}/></body></html>}
