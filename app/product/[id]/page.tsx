"use client";

import { useParams } from "next/navigation";
import ProductEditor from "../../../components/ProductEditor";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  return <ProductEditor id={params.id} />;
}
