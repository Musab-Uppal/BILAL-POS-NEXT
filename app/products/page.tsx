import Link from "next/link";
import ProductEditor from "../../components/ProductEditor";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const params = await searchParams;
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    return (
      <div className="p-5">
        <div className="max-w-[520px] bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Edit Product
          </h2>
          <p className="text-gray-700 mb-4">Product not found</p>
          <Link
            href="/"
            className="inline-block py-2 px-3.5 rounded-md border border-gray-300 bg-white text-gray-700 font-semibold"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  return <ProductEditor id={id} />;
}
