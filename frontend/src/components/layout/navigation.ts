import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards
} from "lucide-react";

export const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clientes", href: "/clients", icon: Users },
  { label: "Projetos", href: "/projects", icon: FolderKanban },
  { label: "Orçamentos", href: "/budgets", icon: BriefcaseBusiness },
  { label: "Financeiro", href: "/financial", icon: WalletCards },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList },
  { label: "Visitas", href: "/visits", icon: CalendarDays },
  { label: "Relatórios", href: "/reports", icon: BarChart3 },
  { label: "Configurações", href: "/settings", icon: Settings }
];
