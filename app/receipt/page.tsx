import ReceiptView from "../../components/ReceiptView";

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <ReceiptView searchParamsObj={params} />;
}
