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
import { useToast } from "@/hooks/use-toast";
import type { Request } from "@shared/schema";

export default function Dashboard() {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portal Header */}
      <div className="portal-header bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="https://www.geovictoria.com/hubfs/social-suggested-images/info.geovictoria.comhubfscropped-Logo-WEB-5-1.png" 
              width="112" 
              alt="Logo"
              className="h-8"
            />
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="text-blue-600 font-medium">Control de Solicitudes</div>
            <div className="h-6 w-px bg-gray-300"></div>
            <input 
              className="px-3 py-1 border border-gray-300 rounded text-sm bg-gray-50" 
              type="text" 
              placeholder="Buscar..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-blue-600 hover:bg-gray-100 rounded">
              <Globe className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded">
              <span className="text-sm">Empresa</span>
              <img 
                src="https://cdn.countryflags.com/thumbs/chile/flag-round-250.png" 
                height="20" 
                alt="Chile"
                className="w-5 h-5"
              />
            </div>

            <button className="p-2 text-blue-600 hover:bg-gray-100 rounded">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Side Menu */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
          <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded">
            <Star className="h-5 w-5" />
          </button>
          <button className="p-3 text-blue-600 bg-blue-50 rounded">
            <FileText className="h-5 w-5" />
          </button>
          <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded">
            <User className="h-5 w-5" />
          </button>
          <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded">
            <Users className="h-5 w-5" />
          </button>
          <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded">
            <Calendar className="h-5 w-5" />
          </button>
          <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Breadcrumb */}
          <div className="bg-white px-6 py-3 border-b border-gray-200">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Planificación</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Solicitudes</span>
            </nav>
          </div>

          <div className="container mx-auto px-6 py-6 max-w-7xl">


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
          </div>
        </div>
      </div>
    </div>
  );
}
