import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Santo Terço Book Club",
    short_name: "Santo Terço",
    description: "O próximo livro, os jantares, os vinhos e os bitaites do clube.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f8",
    theme_color: "#171a3b",
    lang: "pt-PT",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
