import { PocDetailsScreen } from "@/components/developer/PocDetailsScreen";

export default async function DeveloperPocDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PocDetailsScreen pocId={id} />;
}
