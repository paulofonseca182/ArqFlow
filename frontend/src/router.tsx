import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ClientsPage } from "./pages/Clients/ClientsPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "projects", element: <PlaceholderPage title="Projetos" /> },
      { path: "budgets", element: <PlaceholderPage title="Orçamentos" /> },
      { path: "financial", element: <PlaceholderPage title="Financeiro" /> },
      { path: "tasks", element: <PlaceholderPage title="Tarefas" /> },
      { path: "visits", element: <PlaceholderPage title="Visitas" /> },
      { path: "documents", element: <PlaceholderPage title="Documentos" /> },
      { path: "briefings", element: <PlaceholderPage title="Briefings" /> },
      { path: "reports", element: <PlaceholderPage title="Relatórios" /> },
      { path: "settings", element: <PlaceholderPage title="Configurações" /> }
    ]
  }
]);
