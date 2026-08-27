import { EmailSubscribeForm } from "@/components/subscription/EmailSubscribeForm";
import { EmailConfirmResult } from "@/components/subscription/EmailConfirmResult";

export default async function EmailSubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const { verify } = await searchParams;
  const verifyStatus = verify === "success" || verify === "failed" ? verify : undefined;

  return (
    <main className="max-w-[1040px] mx-auto px-6 py-12">
      {verifyStatus ? (
        <EmailConfirmResult status={verifyStatus} />
      ) : (
        <EmailSubscribeForm />
      )}
    </main>
  );
}
