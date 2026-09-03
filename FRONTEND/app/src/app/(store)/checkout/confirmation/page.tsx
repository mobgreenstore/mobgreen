import { redirect } from "next/navigation";

/** Backwards-compatible redirect for old confirmation bookmarks. */
export default async function LegacyConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const intent = (await searchParams).intent;
  redirect(
    intent
      ? `/allverification?intent=${encodeURIComponent(intent)}`
      : "/allverification",
  );
}
