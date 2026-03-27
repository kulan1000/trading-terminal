import { searchMessages } from "@/lib/queries";
import { TerminalCard } from "@/components/ui/terminal-card";
import { MessageSearch } from "@/components/discord/message-search";
import { MessageList } from "@/components/discord/message-list";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q ?? "";
  const results = query ? await searchMessages(query) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
        Discord Intel — Search
      </h1>

      <MessageSearch />

      <TerminalCard title={`Results for "${query}" (${results.length})`}>
        <MessageList messages={results} />
      </TerminalCard>
    </div>
  );
}
