import {
  CalendarDays,
  ClipboardList,
  FileStack,
  Gauge,
  Landmark,
  Map,
  Settings,
  Sprout,
  Warehouse
} from "lucide-react";

export const navigationItems = [
  { href: "/", label: "Home", icon: Gauge },
  { href: "/campi", label: "Campi", icon: Map },
  { href: "/lavorazioni", label: "Lavorazioni", icon: Sprout },
  { href: "/bolle-ddt", label: "Bolle / DDT", icon: FileStack },
  { href: "/magazzino", label: "Magazzino", icon: Warehouse },
  { href: "/schede-prodotti", label: "Schede Prodotti", icon: ClipboardList },
  { href: "/finanza", label: "Finanza", icon: Landmark },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings }
] as const;
