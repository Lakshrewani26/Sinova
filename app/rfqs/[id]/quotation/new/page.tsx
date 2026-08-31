import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewQuotationPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (user?.role === "SUPPLIER") {
    redirect(`/supplier/rfqs/${id}`);
  } else {
    redirect(`/rfqs/${id}`);
  }
}
