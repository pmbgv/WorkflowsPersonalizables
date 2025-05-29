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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalles de la Solicitud
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Tipo de solicitud</label>
                <p className="mt-1 text-gray-900">{request.tipo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Fecha solicitada</label>
                <p className="mt-1 text-gray-900">
                  {request.fechaFin ? 
                    `${request.fechaSolicitada} - ${request.fechaFin}` : 
                    request.fechaSolicitada
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Estado actual</label>
                <div className="mt-1">
                  {getStatusBadge(request.estado)}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Solicitado por</label>
                <p className="mt-1 text-gray-900">{request.solicitadoPor}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Fecha de creación</label>
                <p className="mt-1 text-gray-900">{formatDate(request.fechaCreacion)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">ID de solicitud</label>
                <p className="mt-1 text-gray-900 font-mono">
                  #REQ-2025-{String(request.id).padStart(3, '0')}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Asunto</label>
            <p className="mt-2 text-gray-900 bg-gray-50 p-4 rounded-lg">
              {request.asunto}
            </p>
          </div>

          {request.descripcion && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Descripción</label>
              <p className="mt-2 text-gray-900 bg-gray-50 p-4 rounded-lg">
                {request.descripcion}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-3">Historial de la solicitud</label>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900"><strong>Solicitud creada</strong></p>
                  <p className="text-xs text-gray-500">{formatDate(request.fechaCreacion)} - 09:30 AM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  request.estado === 'Pendiente' ? 'bg-yellow-500' : 
                  request.estado === 'Aprobado' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900"><strong>{request.estado}</strong></p>
                  <p className="text-xs text-gray-500">{formatDate(request.fechaActualizacion)} - 09:31 AM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              {onStatusChange && (
                <>
                  {request.estado === 'Pendiente' && (
                    <>
                      {isAllRequestsTab ? (
                        // All Requests tab: Show Accept/Reject
                        <>
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onStatusChange(request.id, "Aprobado")}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Aceptar
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => onStatusChange(request.id, "Rechazado")}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                        </>
                      ) : (
                        // List Requests tab: Show only Cancel
                        <Button 
                          variant="destructive"
                          onClick={() => onStatusChange(request.id, "Cancelada")}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </>
                  )}
                  {request.estado === 'Aprobado' && (
                    <Button 
                      variant="destructive"
                      onClick={() => onStatusChange(request.id, "Anulada")}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Anular
                    </Button>
                  )}
                </>
              )}
            </div>
            <Button 
              variant="outline"
              onClick={() => onDownload(request.id)}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
