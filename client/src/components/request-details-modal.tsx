import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, FileText, Check, X, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Request } from "@shared/schema";

interface RequestDetailsModalProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (requestId: number) => void;
  onStatusChange?: (requestId: number, newStatus: string) => void;
  isAllRequestsTab?: boolean;
  currentUser?: any;
}

export function RequestDetailsModal({ request, open, onOpenChange, onDownload, onStatusChange, isAllRequestsTab = false, currentUser }: RequestDetailsModalProps) {
  if (!request) return null;

  const [comentario, setComentario] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get approval steps for this request
  const { data: approvalSteps = [], isLoading: isLoadingSteps } = useQuery({
    queryKey: ["/api/requests", request?.id, "approval-steps"],
    queryFn: async () => {
      if (!request?.id) return [];
      const response = await fetch(`/api/requests/${request.id}/approval-steps`);
      if (!response.ok) throw new Error("Failed to fetch approval steps");
      return response.json();
    },
    enabled: !!request?.id && open,
  });

  // Process approval mutation
  const processApprovalMutation = useMutation({
    mutationFn: async ({ action, stepId }: { action: "Aprobado" | "Rechazado"; stepId: number }) => {
      if (!request?.id || !currentUser?.UserProfile) {
        throw new Error("Missing request ID or user profile");
      }
      
      return apiRequest("PATCH", `/api/requests/${request.id}/process-approval`, {
        stepId,
        action,
        userProfile: currentUser.UserProfile,
        comentario: comentario.trim() || undefined
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Acción procesada",
        description: data.message,
      });
      
      // Invalidate queries to refresh data using the exact query keys from dashboard
      // This ensures that all tables (mis solicitudes, solicitudes pendientes, todas las solicitudes) refresh
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/pending-approval"] }); 
      queryClient.invalidateQueries({ queryKey: ["/api/requests", "all-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", request?.id, "approval-steps"] });
      
      // Also invalidate the general requests queries to be safe
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      
      // Note: Do not call onStatusChange here - the approval process 
      // manages request status internally. Calling onStatusChange would 
      // interfere with sequential approval workflow logic.
      
      // Close modal if request is completed
      if (data.requestStatus === "Aprobado" || data.requestStatus === "Rechazado") {
        onOpenChange(false);
      }
      
      // Clear comment
      setComentario("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la acción",
        variant: "destructive",
      });
    },
  });

  // Check if current user can approve this request
  const currentStep = approvalSteps.find((step: any) => 
    step.requestApprovalStep?.estado === "Pendiente" && 
    step.approvalStep?.perfil === currentUser?.UserProfile
  );

  const canApprove = !!currentStep && request.estado === "Pendiente";

  if (!request) return null;

  // Determine if current user can cancel/anular the request
  const canCancelRequest = () => {
    if (!currentUser || request.estado !== "Pendiente") return false;
    
    // If current user created the request for themselves, they can "cancelar"
    const isOwnRequest = request.identificador === currentUser.Identifier;
    
    // If current user is admin/manager and created the request for someone else, they can "anular"
    const isThirdPartyRequest = !isOwnRequest && 
      ["#adminCuenta#", "#JefeGrupo#"].includes(currentUser.UserProfile);
    
    return isOwnRequest || isThirdPartyRequest;
  };

  const getCancelButtonText = () => {
    if (!currentUser) return "";
    
    // If current user created the request for themselves
    const isOwnRequest = request.identificador === currentUser.Identifier;
    
    return isOwnRequest ? "Cancelar" : "Anular";
  };



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
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">{request.grupo || "No especificado"}</div>
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
              {/* Approval Steps Section */}
              {approvalSteps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Flujo de Aprobación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isLoadingSteps ? (
                      <p className="text-sm text-muted-foreground">Cargando pasos de aprobación...</p>
                    ) : (
                      approvalSteps.map((step: any, index: number) => (
                        <div key={step.requestApprovalStep?.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            {step.requestApprovalStep?.estado === "Aprobado" ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : step.requestApprovalStep?.estado === "Rechazado" ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                Paso {step.approvalStep.orden}: {step.approvalStep.descripcion}
                              </p>
                              <Badge variant={step.approvalStep.obligatorio === "Si" ? "default" : "outline"} className="text-xs">
                                {step.approvalStep.obligatorio === "Si" ? "Obligatorio" : "Opcional"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Perfil: {step.approvalStep.perfil}
                            </p>
                            {step.requestApprovalStep?.fechaAprobacion && (
                              <p className="text-xs text-muted-foreground">
                                {step.requestApprovalStep?.estado} el{" "}
                                {format(new Date(step.requestApprovalStep.fechaAprobacion), "dd/MM/yyyy HH:mm", { locale: es })}
                              </p>
                            )}
                            {step.requestApprovalStep?.comentario && (
                              <p className="text-xs text-gray-600 mt-1 italic">
                                "{step.requestApprovalStep.comentario}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Approval Actions Section */}
              {canApprove && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Acciones de Aprobación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="comentario">Comentario (opcional)</Label>
                      <Textarea
                        id="comentario"
                        placeholder="Agregar comentario sobre la decisión..."
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => processApprovalMutation.mutate({ action: "Aprobado", stepId: currentStep.requestApprovalStep.id })}
                        disabled={processApprovalMutation.isPending}
                        className="flex-1"
                        variant="default"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => processApprovalMutation.mutate({ action: "Rechazado", stepId: currentStep.requestApprovalStep.id })}
                        disabled={processApprovalMutation.isPending}
                        className="flex-1"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                    {processApprovalMutation.isPending && (
                      <p className="text-sm text-muted-foreground text-center">
                        Procesando acción...
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600">Identificador</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">{request.identificador || "No especificado"}</div>
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
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">{request.motivo || "No especificado"}</div>
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
              {request.solicitadoPor} - {request.identificador}
            </div>
          </div>

          {/* Historial de aprobaciones */}
          {approvalSteps.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">Historial de aprobaciones</label>
              <div className="grid grid-cols-4 gap-4 mb-2">
                <div className="text-sm font-medium text-gray-600">Perfil aprobador</div>
                <div className="text-sm font-medium text-gray-600">Fecha de aprobación</div>
                <div className="text-sm font-medium text-gray-600">Estado</div>
                <div className="text-sm font-medium text-gray-600">Comentario</div>
              </div>
              
              {approvalSteps.map((step: any, index: number) => (
                <div key={step.requestApprovalStep?.id || index} className="grid grid-cols-4 gap-4 py-2 border-b">
                  <div className="p-2 bg-gray-100 rounded text-sm">{step.approvalStep?.perfil || "No especificado"}</div>
                  <div className="p-2 bg-gray-100 rounded text-sm">
                    {step.requestApprovalStep?.fechaAprobacion ? 
                      format(new Date(step.requestApprovalStep.fechaAprobacion), "dd/MM/yyyy", { locale: es }) :
                      "Pendiente"
                    }
                  </div>
                  <div className="p-2 bg-gray-100 rounded text-sm">
                    {step.requestApprovalStep?.estado || "Pendiente"}
                  </div>
                  <div className="p-2 bg-gray-100 rounded text-sm">
                    {step.requestApprovalStep?.comentario || "Sin comentario"}
                  </div>
                </div>
              ))}
            </div>
          )}



          {/* Acciones de aprobación - solo visible en pestaña "Todas las solicitudes" */}
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

          {/* Acciones de cancelar/anular - basado en quien creó la solicitud */}
          {canCancelRequest() && onStatusChange && (
            <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
              <Button
                onClick={() => onStatusChange(request.id, "Cancelada")}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                {getCancelButtonText()} solicitud
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}