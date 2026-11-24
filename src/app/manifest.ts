import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "POS Risol",
    short_name: "POS Risol",
    description: "Aplikasi kasir lapak risol offline-first",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFBF5",
    theme_color: "#C2410C",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
