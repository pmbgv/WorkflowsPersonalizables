import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Globe, User, Star, FileText, Users, Calendar, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestTable } from "@/components/request-table";
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
  const [activeTab, setActiveTab] = useState("lista");
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la solicitud ha sido actualizado exitosamente.",
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

  // Query for filtered requests (Lista de Solicitudes)
  const { 
    data: requests = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<Request[]>({
    queryKey: ["/api/requests", queryString],
    queryFn: async () => {
      const url = queryString ? `/api/requests?${queryString}` : "/api/requests";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }
      return response.json();
    },
  });

  // Query for all requests with filters applied (Todas las Solicitudes)
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
  });

  useEffect(() => {
    if (error || errorAll) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes.",
        variant: "destructive",
      });
    }
  }, [error, errorAll, toast]);

  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const handleStatusChange = (requestId: number, newStatus: string) => {
    updateStatusMutation.mutate({ requestId, newStatus });
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
    refetchAll();
  };

  const handleGroupSelect = (groupName: string, users: any[]) => {
    setSelectedGroup(groupName);
    setSelectedGroupUsers(users);
  };

  const handleUserSelect = (user: any) => {
    console.log("Usuario seleccionado:", user);
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
        
        <div className="header-content">
          <div className="info-buttons cursor-pointer" onClick={() => setGroupsModalOpen(true)}>
            <Globe className="h-5 w-5 color-lightblue2" />
          </div>
          
          <div className="info-buttons company">
            <div>{companyData?.name || "Empresa"}</div>
          </div>

          <UserSelector
            users={selectedGroupUsers}
            selectedGroup={selectedGroup}
            onUserSelect={handleUserSelect}
          />
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="lista">Mis Solicitudes</TabsTrigger>
            <TabsTrigger value="todas">Todas las Solicitudes</TabsTrigger>
            <TabsTrigger value="esquemas">Configuración Esquemas</TabsTrigger>
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
            />
          </TabsContent>
          
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
          
          <TabsContent value="esquemas" className="space-y-6">
            {/* Approval Schemas Configuration */}
            <ApprovalSchemas />
          </TabsContent>
        </Tabs>

          {/* Request Details Modal */}
          <RequestDetailsModal
            request={selectedRequest}
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
            onDownload={handleDownload}
            onStatusChange={handleStatusChange}
            isAllRequestsTab={activeTab === "todas"}
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
