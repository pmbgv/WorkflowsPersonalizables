import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Check, X } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";
import type { Request } from "@shared/schema";

interface RequestDetailsModalProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (requestId: number) => void;
  onStatusChange?: (requestId: number, newStatus: string) => void;
  isAllRequestsTab?: boolean;
}

export function RequestDetailsModal({ request, open, onOpenChange, onDownload, onStatusChange, isAllRequestsTab = false }: RequestDetailsModalProps) {
  if (!request) return null;

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
        {status}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-lg font-medium text-gray-900">
            Detalle de solicitud
          </DialogTitle>
          <Button
            variant="ghost"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Estado */}
          <div className="flex items-center justify-start gap-2">
            <span className="text-sm font-medium text-gray-600">Estado</span>
            {getStatusBadge(request.estado)}
          </div>

          {/* Grid de información principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Nombre usuario</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">{request.solicitadoPor}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Grupo</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">Santiago Admin.</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Tipo de solicitud</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">{request.tipo}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Fecha de creación</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">{formatDate(request.fechaCreacion)}</div>
              </div>
              
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Identificador</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">{request.identificador || "16345990-8"}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Fecha solicitada</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">
                  {request.fechaFin ? 
                    `${formatDate(request.fechaSolicitada)} - ${formatDate(request.fechaFin)}` : 
                    formatDate(request.fechaSolicitada)
                  }
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Motivo</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">{request.motivo || "Permiso parcial MHR"}</div>
              </div>
            </div>
          </div>

          {/* Justificación de la solicitud */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Justificación de la solicitud</label>
            <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900 min-h-[60px]">
              {request.descripcion || "Datos"}
            </div>
          </div>

          {/* Solicitado por */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Solicitado por</label>
            <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">
              Pedro Ramirez Gonzalez - 22.456.789-2
            </div>
          </div>

          {/* Tabla de aprobadores */}
          <div>
            <div className="grid grid-cols-4 gap-4 mb-2">
              <div className="text-sm font-medium text-gray-600">Perfil aprobador</div>
              <div className="text-sm font-medium text-gray-600">Fecha de aprobación</div>
              <div className="text-sm font-medium text-gray-600">Aprobado por</div>
              <div className="text-sm font-medium text-gray-600">Comentario</div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 py-2 border-b">
              <div className="p-2 bg-gray-100 rounded text-sm">Jefes de grupo</div>
              <div className="p-2 bg-gray-100 rounded text-sm">08/04/2025</div>
              <div className="p-2 bg-gray-100 rounded text-sm">Juan Pérez</div>
              <div className="p-2 bg-gray-100 rounded text-sm flex justify-center">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-600">
                  💬
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 py-2 border-b">
              <div className="p-2 bg-gray-100 rounded text-sm">Jefes de grupo</div>
              <div className="p-2 bg-gray-100 rounded text-sm">08/04/2025</div>
              <div className="p-2 bg-gray-100 rounded text-sm">Juan Pérez</div>
              <div className="p-2 bg-gray-100 rounded text-sm flex justify-center">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-600">
                  💬
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600">Justificación</label>
              <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900 min-h-[40px]">
                Datos
              </div>
            </div>
          </div>

          {/* Historial de estados */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">Historial de estados</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{formatDate(request.fechaCreacion)}</span>
                  <span className="text-sm font-medium">Estado: Pendiente</span>
                  <span className="text-sm text-gray-600">Por: {request.solicitadoPor}</span>
                </div>
                <span className="text-xs text-gray-500">Solicitud creada</span>
              </div>
              
              {request.estado !== "Pendiente" && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{formatDate(request.fechaCreacion)}</span>
                    <span className="text-sm font-medium">Estado: {request.estado}</span>
                    <span className="text-sm text-gray-600">Por: Sistema</span>
                  </div>
                  <span className="text-xs text-gray-500">Cambio de estado</span>
                </div>
              )}
            </div>
          </div>

          {/* Acciones de aprobación */}
          {isAllRequestsTab && onStatusChange && request.estado === "Pendiente" && (
            <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
              <Button
                onClick={() => onStatusChange(request.id, "Aprobado")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
              <Button
                onClick={() => onStatusChange(request.id, "Rechazado")}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}