import { redirect } from "next/navigation";

// Search is now handled by the main Discord Intel page via query params
interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const target = q ? `/discord-intel?q=${encodeURIComponent(q)}` : "/discord-intel";
  redirect(target);
}
