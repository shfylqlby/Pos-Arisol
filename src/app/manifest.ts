import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "POS Arisol",
    short_name: "POS Arisol",
    description: "Aplikasi kasir lapak risol offline-first",
    start_url: "/kasir",
    display: "standalone",
    orientation: "portrait",
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
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Kasir",
        short_name: "Kasir",
        url: "/kasir",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Laporan",
        short_name: "Laporan",
        url: "/laporan",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
