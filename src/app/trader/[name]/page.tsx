import { TraderProfileView } from "@/components/trader/trader-profile-view";

export const revalidate = 60;

interface Props {
  params: Promise<{ name: string }>;
}

export default async function TraderPage({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  return (
    <div className="animate-fade-in space-y-6">
      <TraderProfileView author={decoded} />
    </div>
  );
}
