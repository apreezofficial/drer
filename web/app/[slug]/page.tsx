import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pages } from "@/lib/page-data";
import DetailPage from "@/components/detail-page";
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};
  return {
    title: `${page.eyebrow.replace(" / RESEARCH", "")} | DRER`,
    description: page.description,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return <DetailPage slug={slug} page={page} />;
}
