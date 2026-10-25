import type { Metadata } from "next";
import { GlobeIcon, TrophyIcon } from "@/components/icons";
import { LeagueBrowser } from "@/components/league-browser";
import { PageIntro, Pill } from "@/components/ui";
import { getAllLeagues } from "@/lib/fotmob";

export const metadata: Metadata = {
  title: "All football leagues & competitions",
  description:
    "Browse every football competition in the world — Premier League, Champions League, LaLiga, Serie A and hundreds more.",
};

export default async function LeaguesPage() {
  const data = await getAllLeagues();
  const international = data.international ?? [];
  const countries = data.countries ?? [];
  const total = new Set(
    [...international, ...countries].flatMap((group) => group.leagues.map((league) => league.id)),
  ).size;

  return (
    <div className="shell py-6 md:py-8">
      <PageIntro
        eyebrow="Competitions"
        title="Every league on earth"
        description="Tables, fixtures, form guides and stat leaders for more than a hundred countries."
        aside={
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">
              <TrophyIcon size={12} /> {total} competitions
            </Pill>
            <Pill>
              <GlobeIcon size={12} /> {countries.length} countries
            </Pill>
          </div>
        }
      />
      <LeagueBrowser
        popular={data.popular.map(({ id, name, ccode }) => ({ id, name, ccode }))}
        international={international}
        countries={countries}
      />
    </div>
  );
}
