import { MeetingPage } from "@/components/meeting-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MeetingPage id={id}/>;
}