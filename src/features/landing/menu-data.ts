export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export const MENU_ITEMS: MenuItem[] = [
  { id: "mayo-sosis", name: "Risol Mayo Sosis Telur", price: 3000, category: "Risol Mayo" },
  { id: "mayo-beef", name: "Risol Mayo Smoked Beef", price: 3500, category: "Risol Mayo" },
  { id: "mayo-crab-keju", name: "Risol Mayo Crab Stick Keju", price: 3500, category: "Risol Mayo" },
  { id: "mayo-crab-telur", name: "Risol Mayo Crab Stick Telur", price: 3500, category: "Risol Mayo" },
  {
    id: "ayam-bolognese",
    name: "Risoles Chicken Mushroom Bolognese",
    price: 4000,
    category: "Risoles Ayam / Pedas",
  },
  {
    id: "ayam-suwir",
    name: "Risoles Ayam Suwir Pedas",
    price: 3500,
    category: "Risoles Ayam / Pedas",
  },
  {
    id: "ayam-ragout",
    name: "Risoles Ragout Ayam Sayur",
    price: 3500,
    category: "Risoles Ayam / Pedas",
  },
  {
    id: "manis-banana",
    name: "Risoles Banana Choco Crunchy",
    price: 4000,
    category: "Risoles Manis",
  },
  {
    id: "manis-choco",
    name: "Risoles Choco Crunchy Cheese",
    price: 4000,
    category: "Risoles Manis",
  },
  { id: "manis-matcha", name: "Risoles Matcha", price: 4000, category: "Risoles Manis" },
  {
    id: "manis-tiramisu",
    name: "Risoles Tiramisu Oreo",
    price: 3500,
    category: "Risoles Manis",
  },
  { id: "kebab-medium", name: "Kebab Medium", price: 7500, category: "Kebab" },
];

export const MENU_CATEGORIES = Array.from(new Set(MENU_ITEMS.map((item) => item.category)));

export const MENU_POSTERS = [
  { src: "/menu-harga-arisol/4.jpg", label: "Risol mayo & kebab" },
  { src: "/menu-harga-arisol/2.jpg", label: "Risoles ayam & manis" },
  { src: "/menu-harga-arisol/1.jpg", label: "Menu klasik" },
  { src: "/menu-harga-arisol/3.jpg", label: "Menu hemat" },
];
