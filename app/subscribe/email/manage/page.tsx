import { EmailManageForm } from "@/components/subscription/EmailManageForm";

export default async function EmailManagePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="max-w-[1040px] mx-auto px-6 py-12">
      <EmailManageForm token={token} />
    </main>
  );
}
