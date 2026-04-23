import ReceiptView from "../../../components/ReceiptView";

export default async function ReceiptByIdPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  return (
    <ReceiptView initialReceiptId={routeParams.id} searchParamsObj={query} />
  );
}
