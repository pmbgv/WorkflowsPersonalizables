import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, ArrowUpDown, Plus, Search } from "lucide-react";
import { formatDate, getStatusBadgeVariant } from "@/lib/utils";
import { CreateRequestModal } from "@/components/create-request-modal";
import type { Request } from "@shared/schema";

interface PendingRequestsTableProps {
  requests: Request[];
  isLoading: boolean;
  onViewDetails: (request: Request) => void;
  onDownload: (requestId: number) => void;
  onBulkStatusChange: (requestIds: number[], newStatus: string) => void;
  selectedGroupUsers?: any[];
  selectedUser?: any;
}

export function PendingRequestsTable({ 
  requests, 
  isLoading, 
  onViewDetails, 
  onDownload, 
  onBulkStatusChange,
  selectedGroupUsers = [],
  selectedUser
}: PendingRequestsTableProps) {
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  // Toggle individual request selection
  const toggleRequestSelection = (requestId: number) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  // Toggle all requests selection
  const toggleAllSelection = () => {
    if (selectedRequests.length === currentRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(currentRequests.map(req => req.id));
    }
  };

  // Handle bulk approve
  const handleBulkApprove = () => {
    if (selectedRequests.length > 0) {
      onBulkStatusChange(selectedRequests, "Aprobado");
      setSelectedRequests([]);
    }
  };

  // Handle bulk reject
  const handleBulkReject = () => {
    if (selectedRequests.length > 0) {
      onBulkStatusChange(selectedRequests, "Rechazado");
      setSelectedRequests([]);
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Sort and paginate requests
  const sortedRequests = [...requests].sort((a, b) => {
    if (!sortBy) return 0;
    
    let aValue = a[sortBy as keyof Request];
    let bValue = b[sortBy as keyof Request];
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortOrder === "asc" ? -1 : 1;
    if (bValue == null) return sortOrder === "asc" ? 1 : -1;
    
    if (typeof aValue === "string") aValue = aValue.toLowerCase();
    if (typeof bValue === "string") bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedRequests.length / requestsPerPage);
  const startIndex = (currentPage - 1) * requestsPerPage;
  const currentRequests = sortedRequests.slice(startIndex, startIndex + requestsPerPage);

  const handleRequestCreated = () => {
    setCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Solicitudes pendientes</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Solicitudes pendientes</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear solicitud
          </Button>
          <Button 
            onClick={handleBulkReject}
            disabled={selectedRequests.length === 0}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            Rechazar
          </Button>
          <Button 
            onClick={handleBulkApprove}
            disabled={selectedRequests.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Aprobar
          </Button>
        </div>
      </div>

      {/* Requests count */}
      <div className="text-sm text-gray-600">
        {requests.length} solicitud{requests.length !== 1 ? 'es' : ''} pendiente{requests.length !== 1 ? 's' : ''}
        {selectedRequests.length > 0 && (
          <span className="ml-2 font-medium">
            ({selectedRequests.length} seleccionada{selectedRequests.length !== 1 ? 's' : ''})
          </span>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRequests.length === currentRequests.length && currentRequests.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('usuarioSolicitado')}
              >
                <div className="flex items-center">
                  Nombre
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('identificadorUsuario')}
              >
                <div className="flex items-center">
                  Identificador
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('fechaSolicitada')}
              >
                <div className="flex items-center">
                  Fecha solicitada
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('tipo')}
              >
                <div className="flex items-center">
                  Tipo de solicitud
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('estado')}
              >
                <div className="flex items-center">
                  Estado
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('fechaCreacion')}
              >
                <div className="flex items-center">
                  Fecha de creación
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">Detalle</TableHead>
              <TableHead className="text-center">Descargar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRequests.map((request) => (
              <TableRow key={request.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    checked={selectedRequests.includes(request.id)}
                    onCheckedChange={() => toggleRequestSelection(request.id)}
                  />
                </TableCell>
                <TableCell className="text-sm">
                  {request.usuarioSolicitado || request.solicitadoPor}
                </TableCell>
                <TableCell className="text-sm">
                  {request.identificadorUsuario || request.identificador}
                </TableCell>
                <TableCell className="text-sm">-</TableCell>
                <TableCell className="text-sm">
                  {request.fechaFin ? 
                    `${formatDate(request.fechaSolicitada)} - ${formatDate(request.fechaFin)}` : 
                    formatDate(request.fechaSolicitada)
                  }
                </TableCell>
                <TableCell className="text-sm">{request.tipo}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(request.estado)} className="text-xs">
                    {request.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(request.fechaCreacion)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(request)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(request.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Create Request Modal */}
      <CreateRequestModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onRequestCreated={handleRequestCreated}
        selectedGroupUsers={selectedGroupUsers}
        selectedUser={selectedUser}
      />
    </div>
  );
}