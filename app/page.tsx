import { redirect } from "next/navigation";
/** The original branded homepage is intentionally served unchanged from /index.html. */
export default function Home() { redirect("/index.html"); }
