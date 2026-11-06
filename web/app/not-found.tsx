import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="not-found-page">
      <span className="x-eyebrow">404 / PAGE NOT FOUND</span>
      <h1>A little off course.</h1>
      <p>This page is not part of the DRER project.</p>
      <Link href="/" className="page-primary">
        Back to DRER →
      </Link>
    </main>
  );
}
