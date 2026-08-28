import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  CameraIcon,
  ClipboardList,
  ListChecks,
  TriangleAlert,
  Wrench,
  FileText,
  Settings,
  HardHat,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Obras", to: "/obras", icon: Building2 },
  { title: "Nova Inspeção", to: "/nova-inspecao", icon: CameraIcon },
  { title: "Inspeções", to: "/inspecoes", icon: ClipboardList },
  { title: "Checklists", to: "/checklists", icon: ListChecks },
  { title: "Não Conformidades", to: "/nao-conformidades", icon: TriangleAlert },
  { title: "Ações Corretivas", to: "/acoes-corretivas", icon: Wrench },
  { title: "Relatórios", to: "/relatorios", icon: FileText },
  { title: "Configurações", to: "/configuracoes", icon: Settings },
] as const;

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <HardHat className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-none">Previna SST</p>
            <p className="mt-1 truncate text-xs text-sidebar-foreground/60">
              Inspeções de Segurança
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild size="lg" className="text-[15px]">
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === "/" }}
                      activeProps={{
                        className:
                          "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                      }}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <item.icon className="size-5 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
        Versão de demonstração — dados fictícios
      </SidebarFooter>
    </Sidebar>
  );
}