import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "SINOVA AI", description: "Intelligent sourcing infrastructure" };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
