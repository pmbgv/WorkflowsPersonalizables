import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Upload, Calendar as CalendarIcon, X, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { format, differenceInDays, isWeekend, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import type { InsertRequest, Request, UserVacationBalance, ApprovalSchema } from "@shared/schema";
import type { DateRange } from "react-day-picker";

interface CreateRequestModalProps {
  onRequestCreated?: () => void;
  selectedGroupUsers?: any[];
  selectedUser?: any;
}

export function CreateRequestModal({ onRequestCreated, selectedGroupUsers = [], selectedUser }: CreateRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showDateConflictAlert, setShowDateConflictAlert] = useState(false);
  const [showMinimumDaysAlert, setShowMinimumDaysAlert] = useState(false);
  const [minimumDaysError, setMinimumDaysError] = useState({ requested: 0, minimum: 0 });
  const [showMaximumDaysAlert, setShowMaximumDaysAlert] = useState(false);
  const [maximumDaysError, setMaximumDaysError] = useState({ requested: 0, maximum: 0 });
  const [showMultipleDaysAlert, setShowMultipleDaysAlert] = useState(false);
  const [multipleDaysError, setMultipleDaysError] = useState({ requested: 0, multiple: 0 });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [vacationCalculation, setVacationCalculation] = useState({
    diasDisponibles: 0,
    diasSolicitados: 0,
    diasEfectivos: 0,
    diasRestantes: 0
  });
  const [formData, setFormData] = useState<Partial<InsertRequest>>({
    tipo: "",
    fechaSolicitada: "",
    fechaFin: "",
    asunto: "",
    descripcion: "",
    solicitadoPor: selectedUser ? `${selectedUser.Name} ${selectedUser.LastName}` : "",
    identificador: selectedUser ? selectedUser.Identifier : "",
    motivo: "",
    archivosAdjuntos: [],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener usuarios reales de la API
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Usar usuarios del grupo seleccionado si están disponibles, sino todos los usuarios
  const users = selectedGroupUsers.length > 0 ? selectedGroupUsers.map(user => ({
    id: user.Id,
    employee_id: user.Identifier,
    name: `${user.Name} ${user.LastName}`.trim(),
    group_name: user.GroupDescription,
    position_name: user.PositionDescription
  })) : allUsers;

  // Obtener motivos desde GeoVictoria API
  const { data: timeoffTypes } = useQuery({
    queryKey: ["/api/timeoff-types"],
    queryFn: async () => {
      const response = await fetch("/api/timeoff-types");
      if (!response.ok) throw new Error("Failed to fetch timeoff types");
      return response.json();
    },
  });

  // Obtener esquemas de aprobación para aplicar configuración
  const { data: approvalSchemas = [] } = useQuery<ApprovalSchema[]>({
    queryKey: ["/api/approval-schemas"],
    queryFn: async () => {
      const response = await fetch("/api/approval-schemas");
      if (!response.ok) throw new Error("Failed to fetch approval schemas");
      return response.json();
    },
  });

  // Verificar si el usuario actual es admin o jefe de grupo
  const isAdminOrManager = selectedUser && ["#JefeGrupo#", "#adminCuenta#"].includes(selectedUser.UserProfile);

  // Obtener el esquema activo para el tipo de solicitud y motivo seleccionados
  const activeSchema = approvalSchemas.find(schema => {
    if (formData.tipo === "Vacaciones") {
      return schema.tipoSolicitud === "Vacaciones";
    } else if (formData.tipo === "Permiso") {
      return schema.tipoSolicitud === "Permiso" && 
             (schema as any).motivos && 
             (schema as any).motivos.includes(formData.motivo);
    }
    return false;
  });

  // Verificar si el usuario actual puede hacer solicitudes para terceros
  const canRequestForOthers = () => {
    // Si no hay esquema activo, permitir (comportamiento por defecto)
    if (!activeSchema) return true;
    
    // Si permitir solicitud a terceros está desactivado en el esquema
    if (!activeSchema.permitirSolicitudTerceros) {
      return false;
    }
    
    return true;
  };

  // Update form data when selected user changes
  useEffect(() => {
    if (selectedUser) {
      // Si es usuario normal o si es admin/manager pero no puede solicitar para terceros
      if (!isAdminOrManager || (isAdminOrManager && !canRequestForOthers())) {
        setFormData(prev => ({
          ...prev,
          solicitadoPor: `${selectedUser.Name} ${selectedUser.LastName}`,
          identificador: selectedUser.Identifier
        }));
      }
    }
  }, [selectedUser, activeSchema]);

  // Obtener todas las solicitudes existentes para verificar conflictos de fechas
  const { data: existingRequests = [] } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/requests");
      return response.json();
    },
  });

  // Obtener saldo de vacaciones del usuario
  const { data: userVacationBalance } = useQuery({
    queryKey: ['vacation-balance', formData.identificador],
    queryFn: async () => {
      const response = await fetch(`/api/vacation-balance/${formData.identificador}`);
      return response.json();
    },
    enabled: Boolean(open && formData.identificador && formData.tipo === "Vacaciones"),
  });

  // Función para calcular días laborables (excluyendo fines de semana)
  const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
    if (!startDate || !endDate) return 0;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.filter(day => !isWeekend(day)).length;
  };

  // Efecto para calcular días de vacaciones cuando cambian las fechas
  useEffect(() => {
    if (formData.tipo === "Vacaciones" && dateRange?.from && dateRange?.to && userVacationBalance) {
      const diasSolicitados = differenceInDays(dateRange.to, dateRange.from) + 1;
      const diasEfectivos = calculateWorkingDays(dateRange.from, dateRange.to);
      const diasRestantes = userVacationBalance.diasDisponibles - diasEfectivos;

      setVacationCalculation({
        diasDisponibles: userVacationBalance.diasDisponibles || 0,
        diasSolicitados,
        diasEfectivos,
        diasRestantes
      });
    }
  }, [dateRange, formData.tipo, userVacationBalance]);

  const createRequestMutation = useMutation({
    mutationFn: async (data: InsertRequest) => {
      const response = await apiRequest("POST", "/api/requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Solicitud creada",
        description: "La solicitud ha sido creada exitosamente.",
      });
      setOpen(false);
      resetForm();
      onRequestCreated?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la solicitud.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      tipo: "",
      fechaSolicitada: "",
      fechaFin: "",
      asunto: "",
      descripcion: "",
      solicitadoPor: "Andrés Acevedo",
      identificador: "16345990-8",
      motivo: "",
      archivosAdjuntos: [],
    });
    setDateRange(undefined);
  };

  // Función para verificar conflictos de fechas
  const checkDateConflicts = (startDate: string, endDate?: string): boolean => {
    if (!startDate) return false;

    const requestStart = new Date(startDate);
    const requestEnd = endDate ? new Date(endDate) : requestStart;

    const conflicts = existingRequests.filter(request => {
      // Solo verificar solicitudes del mismo usuario
      if (request.solicitadoPor !== formData.solicitadoPor) return false;
      
      // Solo verificar solicitudes que no estén rechazadas o canceladas
      if (request.estado === "Rechazada" || request.estado === "Cancelada") return false;
      
      // Verificar que las fechas de la solicitud existente sean válidas
      if (!request.fechaSolicitada || request.fechaSolicitada === "") return false;
      
      const existingStart = new Date(request.fechaSolicitada);
      const existingEnd = request.fechaFin && request.fechaFin !== "" ? new Date(request.fechaFin) : existingStart;

      // Verificar que las fechas sean válidas
      if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) return false;
      if (isNaN(requestStart.getTime()) || isNaN(requestEnd.getTime())) return false;

      // Verificar si hay solapamiento
      const hasOverlap = (requestStart <= existingEnd) && (requestEnd >= existingStart);
      
      if (hasOverlap) {
        console.log("Conflicto detectado:", {
          solicitudExistente: request,
          fechasSolicitadas: { inicio: startDate, fin: endDate },
          solapamiento: hasOverlap
        });
      }
      
      return hasOverlap;
    });

    console.log("Validación de fechas:", {
      fechaSolicitada: startDate,
      fechaFin: endDate,
      solicitudesExistentes: existingRequests.length,
      conflictosEncontrados: conflicts.length
    });

    return conflicts.length > 0;
  };

  // Función para manejar el cambio de rango de fechas
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      handleInputChange('fechaSolicitada', format(range.from, "yyyy-MM-dd"));
    }
    if (range?.to) {
      handleInputChange('fechaFin', format(range.to, "yyyy-MM-dd"));
    } else {
      handleInputChange('fechaFin', "");
    }
  };

  // Define motivos based on tipo selection
  const getMotivosForTipo = (tipo: string) => {
    if (!timeoffTypes) return [];
    
    switch (tipo) {
      case "Permiso":
        // Combine all permission types into a single array
        const allMotivos = [
          ...(timeoffTypes.permisosCompletos || []),
          ...(timeoffTypes.permisosParciales || []),
          ...(timeoffTypes.permisosComunes || [])
        ];
        // Remove duplicates using filter
        return allMotivos.filter((motivo, index) => allMotivos.indexOf(motivo) === index);
      default:
        return [];
    }
  };

  const handleTipoChange = (value: string) => {
    handleInputChange('tipo', value);
    // Set appropriate motivo based on tipo
    if (value === "Vacaciones") {
      handleInputChange('motivo', "Vacaciones");
    } else {
      handleInputChange('motivo', "");
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Generate file URLs for display/storage
      const fileUrls = newFiles.map(file => {
        return URL.createObjectURL(file);
      });
      
      // Update form data with file names/links
      const currentFiles = formData.archivosAdjuntos || [];
      const newFileNames = newFiles.map(file => file.name);
      setFormData(prev => ({
        ...prev,
        archivosAdjuntos: [...currentFiles, ...newFileNames]
      }));
      
      toast({
        title: "Archivos subidos",
        description: `Se han subido ${newFiles.length} archivo(s) exitosamente.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al subir los archivos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    
    const currentFiles = formData.archivosAdjuntos || [];
    const newFileNames = currentFiles.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      archivosAdjuntos: newFileNames
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo || !formData.solicitadoPor) {
      toast({
        title: "Campos requeridos",
        description: "Por favor selecciona un tipo de solicitud.",
        variant: "destructive",
      });
      return;
    }

    // Validar campos obligatorios según configuración del esquema
    if (activeSchema) {
      // Validar comentario obligatorio
      if ((activeSchema as any).comentarioRequerido === "true" && 
          (activeSchema as any).comentarioObligatorio === "true" && 
          (!formData.descripcion || formData.descripcion.trim() === "")) {
        toast({
          title: "Campo obligatorio",
          description: "El comentario es obligatorio para este tipo de solicitud.",
          variant: "destructive",
        });
        return;
      }

      // Validar adjuntar documentos obligatorio
      if ((activeSchema as any).adjuntarDocumentos === "true" && 
          (activeSchema as any).adjuntarDocumentosObligatorio === "true" && 
          (!formData.archivosAdjuntos || formData.archivosAdjuntos.length === 0)) {
        toast({
          title: "Campo obligatorio",
          description: "Es obligatorio adjuntar documentos para este tipo de solicitud.",
          variant: "destructive",
        });
        return;
      }
    }

    // Verificar conflictos de fechas si hay fechas seleccionadas
    if (formData.fechaSolicitada && checkDateConflicts(formData.fechaSolicitada, formData.fechaFin ?? undefined)) {
      setShowDateConflictAlert(true);
      return;
    }

    // Preparar datos según el tipo de solicitud
    let requestData;
    
    if (formData.tipo === "Vacaciones") {
      const requestedDays = vacationCalculation.diasEfectivos || vacationCalculation.diasSolicitados;
      
      // Validar días mínimos para vacaciones
      if (activeSchema && activeSchema.diasMinimo && activeSchema.diasMinimo > 0) {
        const minimumDays = activeSchema.diasMinimo;
        
        if (requestedDays < minimumDays) {
          setMinimumDaysError({ requested: requestedDays, minimum: minimumDays });
          setShowMinimumDaysAlert(true);
          return;
        }
      }
      
      // Validar días máximos para vacaciones
      if (activeSchema && activeSchema.diasMaximo && activeSchema.diasMaximo > 0) {
        const maximumDays = activeSchema.diasMaximo;
        
        if (requestedDays > maximumDays) {
          setMaximumDaysError({ requested: requestedDays, maximum: maximumDays });
          setShowMaximumDaysAlert(true);
          return;
        }
      }
      
      // Validar múltiplo de días para vacaciones
      if (activeSchema && activeSchema.diasMultiplo && activeSchema.diasMultiplo > 0) {
        const multipleDays = activeSchema.diasMultiplo;
        
        if (requestedDays % multipleDays !== 0) {
          setMultipleDaysError({ requested: requestedDays, multiple: multipleDays });
          setShowMultipleDaysAlert(true);
          return;
        }
      }
      
      requestData = {
        ...formData,
        asunto: formData.asunto || "Solicitud de Vacaciones",
        motivo: "Vacaciones",
        diasSolicitados: vacationCalculation.diasSolicitados,
        diasEfectivos: vacationCalculation.diasEfectivos,
      };
    } else {
      requestData = {
        ...formData,
        asunto: formData.asunto || "Solicitud de Permiso",
      };
    }

    createRequestMutation.mutate(requestData as InsertRequest);
  };

  const handleInputChange = (field: keyof InsertRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Crear solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">
            Crear solicitud
          </DialogTitle>
          <DialogDescription>
            Complete los campos para crear una nueva solicitud
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos básicos iniciales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-gray-700">Usuario</Label>
              {selectedUser && !isAdminOrManager ? (
                <Input
                  value={`${selectedUser.Name} ${selectedUser.LastName} - ${selectedUser.Identifier}`}
                  disabled
                  className="bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              ) : (
                <>
                  {isAdminOrManager && !canRequestForOthers() ? (
                    <div className="space-y-2">
                      <Input
                        value={selectedUser ? `${selectedUser.Name} ${selectedUser.LastName} - ${selectedUser.Identifier}` : ""}
                        disabled
                        className="bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <Info className="h-4 w-4" />
                        <span>Las solicitudes a terceros están desactivadas para este tipo de solicitud</span>
                      </div>
                    </div>
                  ) : (
                    <Select
                      value={formData.identificador || ""}
                      onValueChange={(value) => {
                        const selectedUser = users.find((user: any) => user.employee_id === value);
                        if (selectedUser) {
                          handleInputChange('solicitadoPor', selectedUser.name);
                          handleInputChange('identificador', selectedUser.employee_id);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((user: any) => user.employee_id && user.employee_id.trim() !== "")
                          .map((user: any) => (
                            <SelectItem key={user.id} value={user.employee_id}>
                              {user.name} - {user.employee_id}
                              {user.group_name && <span className="text-gray-500 text-xs block">{user.group_name}</span>}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="identificador" className="text-gray-700">Identificador</Label>
              <Input
                id="identificador"
                value={formData.identificador || ""}
                className="bg-gray-100"
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-gray-700">Tipo de solicitud</Label>
            <Select 
              value={formData.tipo} 
              onValueChange={handleTipoChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Permiso">Permiso</SelectItem>
                <SelectItem value="Vacaciones">Vacaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos adicionales que aparecen cuando se selecciona Permiso */}
          {formData.tipo === "Permiso" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Fecha</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={() => setCalendarOpen(true)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy", { locale: es })
                          )
                        ) : (
                          "Seleccionar"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateRangeChange}
                        numberOfMonths={2}
                        locale={es}
                      />
                      <div className="flex justify-end space-x-2 p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDateRange(undefined);
                            handleInputChange('fechaSolicitada', "");
                            handleInputChange('fechaFin', "");
                            setCalendarOpen(false);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setCalendarOpen(false);
                          }}
                        >
                          Aplicar
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo" className="text-gray-700">Motivo</Label>
                  <Select 
                    value={formData.motivo ?? ""} 
                    onValueChange={(value) => handleInputChange('motivo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {getMotivosForTipo(formData.tipo).map((motivo: string) => (
                        <SelectItem key={motivo} value={motivo}>
                          {motivo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Adjuntar archivos - Condicional según configuración del esquema */}
              {activeSchema && (activeSchema as any).adjuntarDocumentos === "true" && (
                <div className="space-y-2">
                  <Label className="text-gray-700">
                    Adjuntar archivos
                    {(activeSchema as any).adjuntarDocumentosObligatorio === "true" && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-600 mb-4">
                      Arrastra tu archivo aquí o utiliza el siguiente botón
                    </p>
                    <Button 
                      type="button"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                    >
                      Subir archivo
                    </Button>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    {(activeSchema as any).adjuntarDocumentosObligatorio === "true" && (
                      <p className="text-red-500 text-sm mt-2">
                        * Este campo es obligatorio
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="comentario" className="text-gray-700">Comentario</Label>
                <Textarea
                  id="comentario"
                  placeholder=""
                  rows={4}
                  value={formData.descripcion ?? ""}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}

          {/* Campos específicos para Vacaciones */}
          {formData.tipo === "Vacaciones" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Días disponibles</Label>
                  <Input
                    value={vacationCalculation.diasDisponibles.toString()}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Identificador</Label>
                  <Input
                    value={formData.identificador || ""}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Fecha</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => setCalendarOpen(true)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: es })
                        )
                      ) : (
                        "Seleccionar"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                      locale={es}
                    />
                    <div className="flex justify-end space-x-2 p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange(undefined);
                          handleInputChange('fechaSolicitada', "");
                          handleInputChange('fechaFin', "");
                          setCalendarOpen(false);
                        }}
                      >
                        Limpiar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setCalendarOpen(false)}
                      >
                        Confirmar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Días solicitados</Label>
                  <Input
                    value={vacationCalculation.diasSolicitados.toString()}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Días efectivos</Label>
                  <Input
                    value={vacationCalculation.diasEfectivos.toString()}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Días restantes</Label>
                  <Input
                    value={vacationCalculation.diasRestantes.toString()}
                    readOnly
                    className={`${vacationCalculation.diasRestantes < 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}
                  />
                </div>
              </div>

              {/* Información sobre fines de semana */}
              {dateRange?.from && dateRange?.to && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">1 día no se tomó en cuenta por los siguientes motivos:</p>
                    <ul className="mt-1 space-y-1">
                      <li>[ Fecha: {format(dateRange.from, "dd/MM/yyyy", { locale: es })} Razón: Domingo ]</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Validación de días insuficientes */}
              {vacationCalculation.diasRestantes < 0 && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">No tienes suficientes días de vacaciones disponibles.</p>
                    <p>Necesitas {Math.abs(vacationCalculation.diasRestantes)} días adicionales.</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="comentario" className="text-gray-700">Comentario</Label>
                <Textarea
                  id="comentario"
                  placeholder=""
                  rows={4}
                  value={formData.descripcion ?? ""}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-6 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50 rounded"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createRequestMutation.isPending || !formData.tipo || (formData.tipo === "Vacaciones" && vacationCalculation.diasRestantes < 0)}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {createRequestMutation.isPending ? "Creando..." : "Solicitar"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Modal de alerta para conflicto de fechas */}
      <AlertDialog open={showDateConflictAlert} onOpenChange={setShowDateConflictAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateConflictAlert(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogTitle className="text-lg font-medium text-gray-900">
              Ya tienes una solicitud en las fechas seleccionadas.
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-2">
              No puedes enviar esta nueva solicitud porque ya existe otra que coincide con las fechas seleccionadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <Button
              onClick={() => setShowDateConflictAlert(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded"
            >
              Cerrar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de alerta para días mínimos */}
      <AlertDialog open={showMinimumDaysAlert} onOpenChange={setShowMinimumDaysAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMinimumDaysAlert(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogTitle className="text-lg font-medium text-gray-900">
              La cantidad de días es menor al mínimo configurado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-2">
              Has solicitado {minimumDaysError.requested} días, pero el mínimo configurado en el esquema es de {minimumDaysError.minimum} días.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <Button
              onClick={() => setShowMinimumDaysAlert(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded"
            >
              Cerrar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de alerta para días máximos */}
      <AlertDialog open={showMaximumDaysAlert} onOpenChange={setShowMaximumDaysAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMaximumDaysAlert(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogTitle className="text-lg font-medium text-gray-900">
              La cantidad de días excede el máximo configurado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-2">
              Has solicitado {maximumDaysError.requested} días, pero el máximo configurado en el esquema es de {maximumDaysError.maximum} días.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <Button
              onClick={() => setShowMaximumDaysAlert(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded"
            >
              Cerrar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de alerta para múltiplo de días */}
      <AlertDialog open={showMultipleDaysAlert} onOpenChange={setShowMultipleDaysAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMultipleDaysAlert(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogTitle className="text-lg font-medium text-gray-900">
              La cantidad de días no cumple con el múltiplo configurado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-2">
              Has solicitado {multipleDaysError.requested} días, pero debes solicitar en múltiplos de {multipleDaysError.multiple}. 
              Puedes solicitar: {multipleDaysError.multiple}, {multipleDaysError.multiple * 2}, {multipleDaysError.multiple * 3}, etc.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <Button
              onClick={() => setShowMultipleDaysAlert(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded"
            >
              Cerrar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
