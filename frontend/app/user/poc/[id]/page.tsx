import { UserPocDetailsScreen } from "@/components/user/UserPocDetailsScreen";

export default async function UserPocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserPocDetailsScreen pocId={id} />;
}
