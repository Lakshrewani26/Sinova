import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { NewRequirementForm } from "./NewRequirementForm";

export default async function NewRequirementPage() {
  const user = await requireBuyer();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader user={{ name: user.name, email: user.email }} />

      <main className="sinova-dashboard-main">
        <div className="sinova-container" style={{ maxWidth: "840px" }}>
          {/* Breadcrumbs */}
          <div className="sinova-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <span className="sinova-breadcrumb-current">New Sourcing Request</span>
          </div>

          <div className="sinova-panel-card">
            <div className="sinova-panel-header">
              <div>
                <span className="sinova-eyebrow">AI MATCHING ENGINE</span>
                <h1 className="sinova-page-title">Create Sourcing Request</h1>
                <p className="sinova-page-subtitle">
                  Define your product specifications and budget. SINOVA will calculate estimated landed costs and rank catalog manufacturers.
                </p>
              </div>
            </div>

            <div className="sinova-panel-body">
              <NewRequirementForm categories={categories} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
