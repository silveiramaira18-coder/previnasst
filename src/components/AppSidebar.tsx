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
  UserRound,
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
import { rotuloPapel, usePerfil, type Permissao } from "@/lib/perfil";

const items = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Obras", to: "/obras", icon: Building2, permissao: "gerenciarObras" },
  { title: "Nova Inspeção", to: "/nova-inspecao", icon: CameraIcon, permissao: "criarInspecao" },
  { title: "Inspeções", to: "/inspecoes", icon: ClipboardList },
  { title: "Checklists", to: "/checklists", icon: ListChecks, permissao: "gerenciarChecklists" },
  { title: "Não Conformidades", to: "/nao-conformidades", icon: TriangleAlert },
  { title: "Ações Corretivas", to: "/acoes-corretivas", icon: Wrench },
  { title: "Relatórios", to: "/relatorios", icon: FileText },
  { title: "Meu Perfil", to: "/perfil", icon: UserRound },
  { title: "Configurações", to: "/configuracoes", icon: Settings },
] as const;

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { perfil, pode, isLoading } = usePerfil();
  const visiveis = items.filter(
    (i) => !("permissao" in i) || isLoading || pode(i.permissao as Permissao),
  );

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
              {visiveis.map((item) => (
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
        {perfil ? (
          <>
            <p className="truncate text-sidebar-foreground">{perfil.nome || perfil.email}</p>
            <p className="truncate">{rotuloPapel[perfil.papel]}</p>
          </>
        ) : (
          "Previna SST"
        )}
      </SidebarFooter>
    </Sidebar>
  );
}