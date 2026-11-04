import { requireStudent } from "@/lib/auth/authorization";

export const metadata = { title: "Overview" };

export default async function StudentOverviewPage() {
  await requireStudent();
  return <main />;
}
