import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Touchline",
    short_name: "Touchline",
    description: "Live football scores, fixtures, tables and stats.",
    start_url: "/",
    display: "standalone",
    background_color: "#e3ded8",
    theme_color: "#e3ded8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
