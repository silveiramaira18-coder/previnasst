import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  CameraIcon,
  ClipboardList,
  ListChecks,
  TriangleAlert,
  FileText,
  Settings,
  HardHat,
  UserRound,
  LifeBuoy,
  ShieldCheck,
  KanbanSquare,
  TrendingUp,
  FolderOpen,
} from "lucide-react";

import { AvatarPerfil } from "@/components/AvatarPerfil";
import { BotaoInstalarApp } from "@/components/BotaoInstalarApp";
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
import { useIdioma } from "@/lib/i18n";
import { rotuloPapel, usePerfil, type Permissao } from "@/lib/perfil";

const items = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Obras", to: "/obras", icon: Building2, permissao: "gerenciarObras" },
  { title: "Nova Inspeção", to: "/nova-inspecao", icon: CameraIcon, permissao: "criarInspecao" },
  { title: "Inspeções Realizadas", to: "/inspecoes", icon: ClipboardList },
  {
    title: "Lista de Verificação",
    to: "/checklists",
    icon: ListChecks,
    permissao: "gerenciarChecklists",
  },
  { title: "Não Conformidades", to: "/nao-conformidades", icon: TriangleAlert },
  { title: "Gestão Documental", to: "/documentos", icon: FolderOpen },
  { title: "Plano de Ação", to: "/plano-acao", icon: KanbanSquare, somenteAdminPrincipal: true },
  {
    title: "Dashboard de Tendências",
    to: "/admin/dashboard-v2",
    icon: TrendingUp,
    somenteAdminPrincipal: true,
  },
  { title: "Relatórios", to: "/relatorios", icon: FileText, somenteAdminPrincipal: true },
  { title: "Painel Administrativo", to: "/admin", icon: ShieldCheck, somenteAdminPrincipal: true },
  { title: "Meu Perfil", to: "/perfil", icon: UserRound },
  { title: "Suporte", to: "/suporte", icon: LifeBuoy },
  { title: "Configurações", to: "/configuracoes", icon: Settings },
] as const;

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { perfil, pode, isLoading, adminPrincipal } = usePerfil();
  const { t } = useIdioma();
  const visiveis = items.filter(
    (i) =>
      (!("permissao" in i) || pode(i.permissao as Permissao)) &&
      (!("somenteAdminPrincipal" in i) || adminPrincipal),
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3 rounded-xl p-1 transition-colors hover:bg-sidebar-accent"
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <HardHat className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-none">Previna SST</p>
            <p className="mt-1 truncate text-xs text-sidebar-foreground/60">
              {t("Inspeções de Segurança")}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("Navegação")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isLoading ? items.filter((i) => !("permissao" in i) && !("somenteAdminPrincipal" in i)) : visiveis).map((item) => (
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
                      <span className="truncate">{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <BotaoInstalarApp variante="menu" onAcao={() => isMobile && setOpenMobile(false)} />
        {perfil ? (
          <Link
            to="/perfil"
            className="flex min-w-0 items-center gap-3 rounded-xl p-1 transition-colors hover:bg-sidebar-accent"
            onClick={() => isMobile && setOpenMobile(false)}
          >
            <AvatarPerfil caminho={perfil.avatar_url} nome={perfil.nome || perfil.email} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {perfil.nome || perfil.email}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {perfil.cargo || rotuloPapel[perfil.papel]}
              </p>
            </div>
          </Link>
        ) : (
          <p className="text-xs text-sidebar-foreground/60">Previna SST</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
