"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="shell py-10 md:py-16">
      <EmptyState
        title="Couldn't load this page"
        description="The football data feed didn't respond. Check your connection and try again."
        icon={<RefreshIcon size={22} />}
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => retry()} className="btn-primary h-10 px-4 text-sm">
              Try again
            </button>
            <Link href="/" className="btn-ghost h-10 px-4 text-sm">
              Go to scores
            </Link>
          </div>
        }
      />
    </div>
  );
}
