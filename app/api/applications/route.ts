import { NextResponse } from 'next/server';
export async function POST(){return NextResponse.json({ok:true,message:'Application received and confirmation email queued.'});}
