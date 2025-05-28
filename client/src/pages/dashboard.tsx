import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Globe } from "lucide-react";
import { RequestTable } from "@/components/request-table";
import { CreateRequestModal } from "@/components/create-request-modal";
import { RequestDetailsModal } from "@/components/request-details-modal";
import { FiltersSection } from "@/components/filters-section";
import { useToast } from "@/hooks/use-toast";
import type { Request } from "@shared/schema";

export default function Dashboard() {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    estado: "",
    tipo: "",
    busqueda: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { toast } = useToast();

  // Build query string from applied filters
  const queryString = new URLSearchParams(
    Object.entries(appliedFilters).filter(([_, value]) => value !== "" && value !== "all")
  ).toString();

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

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
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
            <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
            <p className="text-gray-600 mt-1">Gestiona y supervisa todas las solicitudes de flujo de trabajo</p>
          </div>
          <CreateRequestModal onRequestCreated={handleRequestCreated} />
        </div>

        {/* Filters */}
        <FiltersSection
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={handleApplyFilters}
        />

        {/* Requests Table */}
        <RequestTable
          requests={requests}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onDownload={handleDownload}
        />

        {/* Request Details Modal */}
        <RequestDetailsModal
          request={selectedRequest}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}
