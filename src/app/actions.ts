"use server";

import { searchFotMob } from "@/lib/fotmob";

export async function searchAction(term: string) {
  return searchFotMob(term);
}
