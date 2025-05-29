import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Globe } from "lucide-react";
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Solicitudes</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Solicitudes</span>
          <Globe className="h-4 w-4 text-blue-500 ml-2" />
        </nav>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
          </div>
          <CreateRequestModal onRequestCreated={handleRequestCreated} />
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
            <TabsTrigger value="lista">Lista de Solicitudes</TabsTrigger>
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
              title="Lista de Solicitudes"
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
  );
}
