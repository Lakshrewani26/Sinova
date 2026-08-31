import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { RfqForm } from "./RfqForm";

interface PageProps {
  searchParams: Promise<{
    manufacturerId?: string;
    productId?: string;
    sourcingRequestId?: string;
  }>;
}

export default async function NewRfqPage({ searchParams }: PageProps) {
  const user = await requireBuyer();
  const params = await searchParams;

  let manufacturerId = params.manufacturerId;
  let productId = params.productId;
  const sourcingRequestId = params.sourcingRequestId;

  let sourcingRequest = null;
  if (sourcingRequestId) {
    sourcingRequest = await prisma.sourcingRequest.findFirst({
      where: { id: sourcingRequestId, userId: user.id },
    });
  }

  // If productId provided but manufacturerId missing
  if (productId && !manufacturerId) {
    const p = await prisma.product.findUnique({ where: { id: productId } });
    if (p) {
      manufacturerId = p.manufacturerId;
    }
  }

  // If manufacturerId provided but productId missing
  if (manufacturerId && !productId) {
    const p = await prisma.product.findFirst({
      where: { manufacturerId },
      orderBy: { name: "asc" },
    });
    if (p) {
      productId = p.id;
    }
  }

  // Fallback if neither provided
  if (!manufacturerId || !productId) {
    const p = await prisma.product.findFirst({
      include: { manufacturer: true },
    });
    if (!p) {
      redirect("/suppliers");
    }
    manufacturerId = p.manufacturerId;
    productId = p.id;
  }

  const [manufacturer, product] = await Promise.all([
    prisma.manufacturer.findUnique({ where: { id: manufacturerId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);

  if (!manufacturer || !product) {
    notFound();
  }

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader user={{ name: user.name, email: user.email }} />

      <main className="sinova-dashboard-main">
        <div className="sinova-container" style={{ maxWidth: "840px" }}>
          {/* Breadcrumbs */}
          <div className="sinova-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <Link href="/rfqs">RFQs</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <span className="sinova-breadcrumb-current">Request a Quote</span>
          </div>

          {/* Form Panel Card */}
          <div className="sinova-panel-card">
            <div className="sinova-panel-header">
              <div>
                <span className="sinova-eyebrow">FORMAL SOURCING PROCUREMENT</span>
                <h1 className="sinova-page-title">Request a Quote (RFQ)</h1>
                <p className="sinova-page-subtitle">
                  Configure your quantity, target landed price, and technical specifications for {manufacturer.name}.
                </p>
              </div>
            </div>

            <div className="sinova-panel-body">
              <RfqForm
                manufacturer={manufacturer}
                product={product}
                sourcingRequest={sourcingRequest}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
