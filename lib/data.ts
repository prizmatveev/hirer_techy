export type Job={id:string;title:string;category:string;department:string;location:string;salary:string;experience:string;employmentType:string;skills:string[];description:string;isOpen:boolean};
export const categories=["Web Development","App Development","Graphics Design","Explore All Roles"];
export const jobs:Job[]=[
{id:"frontend-dev",title:"Frontend Developer",category:"Web Development",department:"Engineering",location:"Remote, US",salary:"$95k-$125k",experience:"3+ years",employmentType:"Full Time",skills:["React","TypeScript","Tailwind"],description:"Build polished product UI.",isOpen:true},
{id:"flutter-dev",title:"Flutter Developer",category:"App Development",department:"Mobile",location:"Austin, TX",salary:"$90k-$120k",experience:"2+ years",employmentType:"Full Time",skills:["Flutter","Dart","Firebase"],description:"Craft cross-platform apps.",isOpen:true},
{id:"uiux-designer",title:"UI/UX Designer",category:"Graphics Design",department:"Design",location:"New York, NY",salary:"$85k-$110k",experience:"3+ years",employmentType:"Full Time",skills:["Figma","UX Research","Design Systems"],description:"Design intuitive end-to-end experiences.",isOpen:true}
];
