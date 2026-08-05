import {
  BarChart3,
  BookOpen,
  CalendarRange,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation registry for the application shell.
 * Placeholder only — permissions and dynamic menus land in a later sprint.
 */
export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly to: string;
  readonly icon: LucideIcon;
  readonly description: string;
  /** Shown in the mobile bottom navigation. */
  readonly primary: boolean;
  /** Match the route exactly (used for the root path). */
  readonly exact: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
    description: "Ringkasan aktivitas dan status pembelajaran akan tampil di sini.",
    primary: true,
    exact: true,
  },
  {
    id: "academic",
    label: "Academic",
    to: "/academic",
    icon: CalendarRange,
    description: "Periode akademik, kelas, peserta, pendaftaran, dan penugasan pengajar.",
    primary: true,
    exact: false,
  },
  {
    id: "learning",
    label: "Learning",
    to: "/learning",
    icon: BookOpen,
    description: "Materi dan jalur belajar bahasa Korea akan tersedia di halaman ini.",
    primary: true,
    exact: false,
  },
  {
    id: "knowledge",
    label: "Knowledge",
    to: "/knowledge",
    icon: Library,
    description: "Pusat materi: grammar, kosakata, percakapan, budaya, dan rujukan EPS-TOPIK.",
    primary: false,
    exact: false,
  },

  {
    id: "exam",
    label: "Exam",
    to: "/exam",
    icon: GraduationCap,
    description: "Latihan dan simulasi ujian EPS-TOPIK akan dikelola dari halaman ini.",
    primary: true,
    exact: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    to: "/analytics",
    icon: BarChart3,
    description: "Laporan performa peserta dan kelas akan ditampilkan di halaman ini.",
    primary: true,
    exact: false,
  },
  {
    id: "settings",
    label: "Settings",
    to: "/settings",
    icon: Settings,
    description: "Preferensi aplikasi dan konfigurasi lembaga akan diatur di halaman ini.",
    primary: true,
    exact: false,
  },
  {
    id: "admin",
    label: "Admin",
    to: "/admin",
    icon: ShieldCheck,
    description: "Area administrasi lembaga dan pengelolaan platform akan berada di sini.",
    primary: false,
    exact: false,
  },
] as const;

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.primary);
