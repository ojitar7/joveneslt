import { ThinkGlaoPresentation } from "@/components/thinkglao-presentation";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ThinkGlaoPresentation id={id}/>}
