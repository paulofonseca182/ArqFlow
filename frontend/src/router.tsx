import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { BudgetsPage } from "./pages/Budgets/BudgetsPage";
import { ClientsPage } from "./pages/Clients/ClientsPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { FinancialPage } from "./pages/Financial/FinancialPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProjectsPage } from "./pages/Projects/ProjectsPage";
import { TasksPage } from "./pages/Tasks/TasksPage";
import { VisitsPage } from "./pages/Visits/VisitsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "budgets", element: <BudgetsPage /> },
      { path: "financial", element: <FinancialPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "visits", element: <VisitsPage /> },
      { path: "documents", element: <PlaceholderPage title="Documentos" /> },
      { path: "briefings", element: <PlaceholderPage title="Briefings" /> },
      { path: "reports", element: <PlaceholderPage title="Relatórios" /> },
      { path: "settings", element: <PlaceholderPage title="Configurações" /> }
    ]
  }
]);
