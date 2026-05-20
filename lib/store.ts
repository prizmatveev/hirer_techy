import { create } from 'zustand';
type Store={category:string;setCategory:(category:string)=>void;savedJobs:string[];toggleSaveJob:(id:string)=>void};
export const useAppStore=create<Store>((set)=>({category:'Explore All Roles',setCategory:(category)=>set({category}),savedJobs:[],toggleSaveJob:(id)=>set((s)=>({savedJobs:s.savedJobs.includes(id)?s.savedJobs.filter((x)=>x!==id):[...s.savedJobs,id]}))}));
