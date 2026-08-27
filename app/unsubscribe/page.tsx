import { UnsubscribeResult } from "@/components/subscription/UnsubscribeResult";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const resultStatus = status === "success" ? "success" : "failed";

  return (
    <main className="max-w-[1040px] mx-auto px-6 py-12">
      <UnsubscribeResult status={resultStatus} />
    </main>
  );
}
