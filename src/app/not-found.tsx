import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="shell py-10 md:py-16">
      <EmptyState
        title="Page not found"
        description="That match, team or player doesn't exist, or the link is out of date."
        icon={<SearchIcon size={22} />}
        action={
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-primary h-10 px-4 text-sm">
              Go to scores
            </Link>
            <Link href="/search" className="btn-ghost h-10 px-4 text-sm">
              Search
            </Link>
          </div>
        }
      />
    </div>
  );
}
