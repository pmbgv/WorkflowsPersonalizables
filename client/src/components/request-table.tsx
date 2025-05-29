import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";
import type { Request } from "@shared/schema";

interface RequestTableProps {
  requests: Request[];
  isLoading: boolean;
  onViewDetails: (request: Request) => void;
  onDownload: (requestId: number) => void;
  title?: string;
  allowStatusChange?: boolean;
  onStatusChange?: (requestId: number, newStatus: string) => void;
}

export function RequestTable({ requests, isLoading, onViewDetails, onDownload, title = "Lista de Solicitudes", allowStatusChange = false, onStatusChange }: RequestTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = requests.slice(startIndex, endIndex);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
        {status}
      </span>
    );
  };

  const renderStatusCell = (request: Request) => {
    // Show dropdown only if status change is allowed, status is "Pendiente", and we have the callback
    if (allowStatusChange && request.estado === "Pendiente" && onStatusChange) {
      return (
        <Select 
          defaultValue={request.estado}
          onValueChange={(newStatus) => onStatusChange(request.id, newStatus)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Aprobado">Aprobado</SelectItem>
            <SelectItem value="Rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    // Otherwise show the regular badge
    return getStatusBadge(request.estado);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando solicitudes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="text-sm text-gray-500">
          Mostrando {startIndex + 1} a {Math.min(endIndex, requests.length)} de {requests.length} solicitudes
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
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
                  onClick={() => handleSort('solicitadoPor')}
                >
                  <div className="flex items-center">
                    Solicitado por
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
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell className="text-sm">
                    {request.fechaFin ? 
                      `${request.fechaSolicitada} - ${request.fechaFin}` : 
                      request.fechaSolicitada
                    }
                  </TableCell>
                  <TableCell className="text-sm">{request.tipo}</TableCell>
                  <TableCell>{renderStatusCell(request)}</TableCell>
                  <TableCell className="text-sm">{request.solicitadoPor}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(request.fechaCreacion)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(request)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(request.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {currentRequests.map((request) => (
            <div key={request.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{request.tipo}</h4>
                  <p className="text-sm text-gray-500">
                    {request.fechaFin ? 
                      `${request.fechaSolicitada} - ${request.fechaFin}` : 
                      request.fechaSolicitada
                    }
                  </p>
                </div>
                {renderStatusCell(request)}
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Solicitado por:</span>
                  <span>{request.solicitadoPor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha de creación:</span>
                  <span>{formatDate(request.fechaCreacion)}</span>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-3 pt-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(request)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver detalles
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(request.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Mostrando {startIndex + 1} a {Math.min(endIndex, requests.length)} de {requests.length} resultados
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {page}
                  </Button>
                );
              })}
              
              {totalPages > 5 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
