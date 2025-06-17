import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Globe, User, Star, FileText, Users, Calendar, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestTable } from "@/components/request-table";
import { PendingRequestsTable } from "@/components/pending-requests-table";
import { CreateRequestModal } from "@/components/create-request-modal";
import { RequestDetailsModal } from "@/components/request-details-modal";
import { FiltersSection } from "@/components/filters-section";
import { ApprovalSchemas } from "@/components/approval-schemas";
import { GroupsModal } from "@/components/groups-modal";
import { UserSelector } from "@/components/user-selector";
import { useToast } from "@/hooks/use-toast";
import type { Request } from "@shared/schema";

export default function Dashboard() {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("lista");
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    tipoFecha: "fechaCreacion",
    estado: "",
    tipo: "",
    busqueda: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener información de la empresa
  const { data: companyData } = useQuery<{ name: string }>({
    queryKey: ["/api/company"],
  });

  // Mutation for updating request status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, newStatus }: { requestId: number; newStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/requests/${requestId}/status`, { estado: newStatus });
      const updatedRequest = await response.json();
      
      // Si el estado cambió a "Aprobado", sincronizar con GeoVictoria
      if (newStatus === "Aprobado" && updatedRequest.tipo === "Permiso") {
        try {
          const syncResponse = await apiRequest("POST", "/api/sync-to-geovictoria", {
            userIdentifier: updatedRequest.identificador,
            motivo: updatedRequest.motivo,
            startDate: updatedRequest.fechaSolicitada,
            endDate: updatedRequest.fechaFin || updatedRequest.fechaSolicitada
          });
          
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log("Successfully synced to GeoVictoria:", syncResult);
          } else {
            console.error("Failed to sync to GeoVictoria:", await syncResponse.text());
          }
        } catch (syncError) {
          console.error("Error syncing to GeoVictoria:", syncError);
          // No failing the main operation if sync fails
        }
      }
      
      return updatedRequest;
    },
    onSuccess: (updatedRequest, { newStatus }) => {
      // Invalidate all user-centric queries
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/pending-approval"] });
      
      let description = "El estado de la solicitud ha sido actualizado exitosamente.";
      if (newStatus === "Aprobado" && updatedRequest.tipo === "Permiso") {
        description += " La solicitud ha sido sincronizada con GeoVictoria.";
      }
      
      toast({
        title: "Estado actualizado",
        description,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado de la solicitud.",
        variant: "destructive",
      });
    },
  });

  // Build query string from applied filters
  const queryString = new URLSearchParams(
    Object.entries(appliedFilters).filter(([_, value]) => value !== "" && value !== "all")
  ).toString();

  // Query for user's own requests (Mis solicitudes)
  const { 
    data: requests = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<Request[]>({
    queryKey: ["/api/requests/my-requests", selectedUser?.Identifier || selectedUser?.Id, queryString],
    queryFn: async () => {
      const userId = selectedUser?.Identifier || selectedUser?.Id;
      if (!userId) return [];
      const url = queryString ? 
        `/api/requests/my-requests/${userId}?${queryString}` : 
        `/api/requests/my-requests/${userId}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch user requests");
      }
      return response.json();
    },
    enabled: !!(selectedUser?.Identifier || selectedUser?.Id),
  });

  // Query for pending approval requests (Solicitudes pendientes)
  const { 
    data: pendingRequests = [], 
    isLoading: isLoadingPending,
    error: errorPending,
    refetch: refetchPending
  } = useQuery<Request[]>({
    queryKey: ["/api/requests/pending-approval", selectedUser?.Identifier, selectedUser?.UserProfile, queryString],
    queryFn: async () => {
      if (!selectedUser?.Identifier || !selectedUser?.UserProfile) return [];
      
      // Build query parameters including userProfile
      const params = new URLSearchParams();
      if (queryString) {
        const existingParams = new URLSearchParams(queryString);
        existingParams.forEach((value, key) => params.append(key, value));
      }
      params.append('userProfile', selectedUser.UserProfile);
      
      const url = `/api/requests/pending-approval/${selectedUser.Identifier}?${params.toString()}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch pending requests");
      }
      return response.json();
    },
    enabled: !!selectedUser?.Identifier && !!selectedUser?.UserProfile,
  });

  // Query for all requests (Todas las Solicitudes) - kept for admin view
  const { 
    data: allRequests = [], 
    isLoading: isLoadingAll, 
    error: errorAll,
    refetch: refetchAll 
  } = useQuery<Request[]>({
    queryKey: ["/api/requests", "all", queryString],
    queryFn: async () => {
      const url = queryString ? `/api/requests?${queryString}` : "/api/requests";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch all requests");
      }
      return response.json();
    },
    enabled: selectedUser?.UserProfile && ["#JefeGrupo#", "#adminCuenta#"].includes(selectedUser.UserProfile),
  });

  useEffect(() => {
    if (error || errorAll || errorPending) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes.",
        variant: "destructive",
      });
    }
  }, [error, errorAll, errorPending, toast]);

  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const handleStatusChange = (requestId: number, newStatus: string) => {
    updateStatusMutation.mutate({ requestId, newStatus });
  };

  const handleBulkStatusChange = (requestIds: number[], newStatus: string) => {
    requestIds.forEach(requestId => {
      updateStatusMutation.mutate({ requestId, newStatus });
    });
    toast({
      title: "Estado actualizado",
      description: `${requestIds.length} solicitud${requestIds.length !== 1 ? 'es' : ''} ${newStatus.toLowerCase()}${requestIds.length !== 1 ? 's' : ''}`,
    });
  };

  const handleDownload = (requestId: number) => {
    toast({
      title: "Descarga iniciada",
      description: `Descargando solicitud #${requestId}`,
    });
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleRequestCreated = () => {
    refetch();
    refetchPending();
    refetchAll();
  };

  const handleGroupSelect = (groupName: string, users: any[]) => {
    setSelectedGroup(groupName);
    setSelectedGroupUsers(users);
  };

  const handleUserSelect = (user: any) => {
    console.log("Usuario seleccionado:", user);
    setSelectedUser(user);
    
    // Switch to available tab based on user profile
    if (user?.UserProfile === "#usuario#") {
      setActiveTab("lista");
    } else if (user?.UserProfile === "#JefeGrupo#" && activeTab === "esquemas") {
      setActiveTab("lista");
    }
    // adminCuenta can access all tabs, so no need to change
  };

  return (
    <>
      {/* Portal Header */}
      <div className="portal-header">
        <div className="header-content">
          <img 
            src="https://www.geovictoria.com/hubfs/social-suggested-images/info.geovictoria.comhubfscropped-Logo-WEB-5-1.png" 
            width="112" 
            alt="Logo"
          />
          <div className="divider"></div>
          <div className="color-lightblue2">Control de Solicitudes</div>
          <div className="divider"></div>
          <input 
            className="gv-input" 
            type="text" 
            placeholder="Buscar..."
          />
        </div>
        
        <div className="header-content flex items-center gap-4">
          <div className="info-buttons cursor-pointer" onClick={() => setGroupsModalOpen(true)}>
            <Globe className="h-5 w-5 color-lightblue2" />
          </div>
          
          <div className="info-buttons company min-w-0 flex-shrink-0">
            <div className="text-sm font-medium truncate">{companyData?.name || "Empresa"}</div>
          </div>

          <div className="flex-1 min-w-0">
            <UserSelector
              users={selectedGroupUsers}
              selectedGroup={selectedGroup}
              onUserSelect={handleUserSelect}
            />
          </div>
        </div>
      </div>
      
      <div className="portal-body">
        <div className="side-menu">
          <Star className="h-5 w-5" />
          <FileText className="h-5 w-5" />
          <User className="h-5 w-5" />
          <Users className="h-5 w-5" />
          <Calendar className="h-5 w-5" />
          <Settings className="h-5 w-5" />
        </div>
        
        <div className="container-fluid">
          {/* Breadcrumb Navigation */}
          <div className="breadcrumb">
            <span className="breadcrumb-item">Planificación</span>
            <ChevronRight className="h-4 w-4" />
            <span className="breadcrumb-item current">Solicitudes</span>
          </div>


        {/* Filters - Only show for request tabs */}
        {activeTab !== "esquemas" && (
          <FiltersSection
            filters={filters}
            onFiltersChange={setFilters}
            onApplyFilters={handleApplyFilters}
          />
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full mb-6 ${
            selectedUser?.UserProfile === "#usuario#" ? "grid-cols-1" :
            selectedUser?.UserProfile === "#JefeGrupo#" ? "grid-cols-3" :
            selectedUser?.UserProfile === "#adminCuenta#" ? "grid-cols-4" :
            "grid-cols-4"
          }`}>
            <TabsTrigger value="lista">Mis Solicitudes</TabsTrigger>
            {selectedUser?.UserProfile && ["#JefeGrupo#", "#adminCuenta#"].includes(selectedUser.UserProfile) && (
              <TabsTrigger value="pendientes">Solicitudes pendientes</TabsTrigger>
            )}
            {selectedUser?.UserProfile && ["#JefeGrupo#", "#adminCuenta#"].includes(selectedUser.UserProfile) && (
              <TabsTrigger value="todas">Todas las Solicitudes</TabsTrigger>
            )}
            {selectedUser?.UserProfile === "#adminCuenta#" && (
              <TabsTrigger value="esquemas">Configuración Esquemas</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="lista" className="space-y-6">
            {/* Requests Table */}
            <RequestTable
              requests={requests}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onDownload={handleDownload}
              title="Mis Solicitudes"
              showCreateButton={true}
              onRequestCreated={handleRequestCreated}
              selectedGroupUsers={selectedGroupUsers}
              selectedUser={selectedUser}
            />
          </TabsContent>

          {selectedUser?.UserProfile && ["#JefeGrupo#", "#adminCuenta#"].includes(selectedUser.UserProfile) && (
            <TabsContent value="pendientes" className="space-y-6">
              {/* Pending Requests Table with Checkboxes */}
              <PendingRequestsTable
                requests={pendingRequests}
                isLoading={isLoadingPending}
                onViewDetails={handleViewDetails}
                onDownload={handleDownload}
                onBulkStatusChange={handleBulkStatusChange}
                selectedGroupUsers={selectedGroupUsers}
                selectedUser={selectedUser}
              />
            </TabsContent>
          )}
          
          {selectedUser?.UserProfile && ["#JefeGrupo#", "#adminCuenta#"].includes(selectedUser.UserProfile) && (
            <TabsContent value="todas" className="space-y-6">
              {/* All Requests Table */}
              <RequestTable
                requests={allRequests}
                isLoading={isLoadingAll}
                onViewDetails={handleViewDetails}
                onDownload={handleDownload}
                title="Todas las Solicitudes"
                allowStatusChange={true}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
          )}
          
          {selectedUser?.UserProfile === "#adminCuenta#" && (
            <TabsContent value="esquemas" className="space-y-6">
              {/* Approval Schemas Configuration */}
              <ApprovalSchemas selectedUser={selectedUser} />
            </TabsContent>
          )}
        </Tabs>

          {/* Request Details Modal */}
          <RequestDetailsModal
            request={selectedRequest}
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
            onDownload={handleDownload}
            onStatusChange={handleStatusChange}
            isAllRequestsTab={activeTab === "todas"}
            currentUser={selectedUser}
          />

          {/* Groups Modal */}
          <GroupsModal
            open={groupsModalOpen}
            onOpenChange={setGroupsModalOpen}
            onGroupSelect={handleGroupSelect}
          />
        </div>
      </div>
    </>
  );
}
