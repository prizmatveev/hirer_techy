import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main(){await prisma.job.createMany({data:[{title:'Frontend Developer',category:'Web Development',description:'Build UI',location:'Remote',salary:'$100k-$130k',experience:'3+',employmentType:'Full Time',skills:['React','TypeScript']}]});}
main().finally(()=>prisma.$disconnect());
