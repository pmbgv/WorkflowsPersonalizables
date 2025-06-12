import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Search, Save, GripVertical, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import type { ApprovalSchema, ApprovalStep, InsertApprovalSchema, InsertApprovalStep } from "@shared/schema";

const PERMISSION_TYPES = [
  "Permiso administrativo",
  "Permiso parcial", 
  "Permiso lactancia",
  "Permiso por horas",
  "Permiso otro"
];

const PROFILES = [
  "Administrador",
  "Jefe de Grupo", 
  "Perfil Personalizado 1",
  "Perfil Personalizado 2",
  "Supervisor"
].sort();



export function ApprovalSchemas() {
  const [selectedSchema, setSelectedSchema] = useState<ApprovalSchema | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [stepChanges, setStepChanges] = useState<Record<number, Partial<ApprovalStep>>>({});
  const [visibilityPermissions, setVisibilityPermissions] = useState<string[]>([]);
  const [approvalPermissions, setApprovalPermissions] = useState<string[]>([]);
  const [newSchemaName, setNewSchemaName] = useState("");
  const [newSchemaType, setNewSchemaType] = useState("Permiso");
  const [newSchemaMotivos, setNewSchemaMotivos] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("general");
  
  // Estados para configuración del esquema
  const [schemaConfig, setSchemaConfig] = useState({
    adjuntarDocumentos: false,
    adjuntarDocumentosObligatorio: false,
    permitirModificarDocumentos: false,
    comentarioRequerido: false,
    comentarioObligatorio: false,
    comentarioOpcional: true,
    enviarCorreoNotificacion: false,
    solicitudCreada: false,
    solicitudAprobadaRechazada: false,
    permitirSolicitudTerceros: false,
    diasMinimo: "",
    diasMaximo: "",
    diasMultiplo: "",
    tipoDias: "calendario"
  });

  // Estados para configuración de saldos (vacaciones)
  const [saldosConfig, setSaldosConfig] = useState({
    tipoLiberacion: "diaria", // diaria o anual
    fechasLiberacion: "actual", // actual o siguiente
    anoActual: new Date().getFullYear().toString(),
    anoSiguiente: (new Date().getFullYear() + 1).toString(),
    caducidadPeriodoActual: "",
    minimoInicioSolicitud: "12",
    excluirSabado: false,
    excluirDomingo: false,
    excluirFeriado: false,
    excluirDescanso: false,
    extenderDiasNoLaborables: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado local para los pasos de aprobación (para drag and drop)
  const [localSteps, setLocalSteps] = useState<ApprovalStep[]>([]);
  
  // Estado para el diálogo de alerta de motivos duplicados
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateMotivos, setDuplicateMotivos] = useState<string[]>([]);
  
  // Estado para el diálogo de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Estado para navegación por pasos en la pestaña Saldos
  const [currentSaldosStep, setCurrentSaldosStep] = useState(1);
  
  // Estado para el modal de crear esquema
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reset changes and load schema data when switching schemas
  useEffect(() => {
    setStepChanges({});
    setSelectedPermissions([]);
    
    if (selectedSchema) {
      // Load existing permissions from schema
      console.log("Cargando esquema:", selectedSchema);
      console.log("Permisos de visualización:", selectedSchema.visibilityPermissions);
      console.log("Permisos de aprobación:", selectedSchema.approvalPermissions);
      setVisibilityPermissions(selectedSchema.visibilityPermissions || []);
      setApprovalPermissions(selectedSchema.approvalPermissions || []);
      
      // Load existing motivos for editing
      if (selectedSchema.motivos && selectedSchema.motivos.length > 0) {
        setNewSchemaMotivos(selectedSchema.motivos);
      } else {
        setNewSchemaMotivos([]);
      }
      
      // Load schema configuration
      setSchemaConfig({
        adjuntarDocumentos: (selectedSchema as any).adjuntarDocumentos === "true",
        adjuntarDocumentosObligatorio: (selectedSchema as any).adjuntarDocumentosObligatorio === "true",
        permitirModificarDocumentos: (selectedSchema as any).permitirModificarDocumentos === "true",
        comentarioRequerido: (selectedSchema as any).comentarioRequerido === "true",
        comentarioObligatorio: (selectedSchema as any).comentarioObligatorio === "true",
        comentarioOpcional: (selectedSchema as any).comentarioOpcional !== "false",
        enviarCorreoNotificacion: (selectedSchema as any).enviarCorreoNotificacion === "true",
        solicitudCreada: (selectedSchema as any).solicitudCreada === "true",
        solicitudAprobadaRechazada: (selectedSchema as any).solicitudAprobadaRechazada === "true",
        permitirSolicitudTerceros: (selectedSchema as any).permitirSolicitudTerceros === "true",
        diasMinimo: (selectedSchema as any).diasMinimo?.toString() || "",
        diasMaximo: (selectedSchema as any).diasMaximo?.toString() || "",
        diasMultiplo: (selectedSchema as any).diasMultiplo?.toString() || "",
        tipoDias: (selectedSchema as any).tipoDias || "calendario"
      });
    } else {
      setVisibilityPermissions([]);
      setApprovalPermissions([]);
      setNewSchemaMotivos([]);
      setSchemaConfig({
        adjuntarDocumentos: false,
        adjuntarDocumentosObligatorio: false,
        permitirModificarDocumentos: false,
        comentarioRequerido: false,
        comentarioObligatorio: false,
        comentarioOpcional: true,
        enviarCorreoNotificacion: false,
        solicitudCreada: false,
        solicitudAprobadaRechazada: false,
        permitirSolicitudTerceros: false,
        diasMinimo: "",
        diasMaximo: "",
        diasMultiplo: "",
        tipoDias: "calendario"
      });
    }
  }, [selectedSchema]);

  // Fetch approval schemas
  const { data: schemas = [], isLoading: isLoadingSchemas } = useQuery<ApprovalSchema[]>({
    queryKey: ["/api/approval-schemas"],
    queryFn: async () => {
      const response = await fetch("/api/approval-schemas");
      if (!response.ok) throw new Error("Failed to fetch schemas");
      return response.json();
    },
  });

  // Fetch motivos desde GeoVictoria API organizados por tipo
  const { data: motivosData = { permisosCompletos: [], permisosParciales: [] } } = useQuery<{permisosCompletos: string[], permisosParciales: string[]}>({
    queryKey: ["/api/timeoff-types"],
    queryFn: async () => {
      const response = await fetch("/api/timeoff-types");
      if (!response.ok) throw new Error("Failed to fetch timeoff types");
      return response.json();
    },
  });

  // Fetch steps for selected schema
  const { data: steps = [], isLoading: isLoadingSteps } = useQuery<ApprovalStep[]>({
    queryKey: ["/api/approval-schemas", selectedSchema?.id, "steps"],
    queryFn: async () => {
      if (!selectedSchema) return [];
      const response = await fetch(`/api/approval-schemas/${selectedSchema.id}/steps`);
      if (!response.ok) throw new Error("Failed to fetch steps");
      return response.json();
    },
    enabled: !!selectedSchema,
  });

  // Sincronizar pasos locales con los datos de la base de datos
  useEffect(() => {
    setLocalSteps(steps);
  }, [steps]);

  // Función para validar motivos duplicados
  const validateDuplicateMotivos = (selectedMotivos: string[]): string[] => {
    const duplicates: string[] = [];
    
    for (const schema of schemas) {
      if (schema.motivos && schema.motivos.length > 0) {
        const commonMotivos = selectedMotivos.filter(motivo => 
          schema.motivos!.includes(motivo)
        );
        duplicates.push(...commonMotivos);
      }
    }
    
    // Remove duplicates manually
    const uniqueDuplicates: string[] = [];
    for (const duplicate of duplicates) {
      if (!uniqueDuplicates.includes(duplicate)) {
        uniqueDuplicates.push(duplicate);
      }
    }
    
    return uniqueDuplicates;
  };

  // Función para manejar el drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localSteps.findIndex((step) => step.id === active.id);
      const newIndex = localSteps.findIndex((step) => step.id === over.id);
      
      const newSteps = arrayMove(localSteps, oldIndex, newIndex);
      
      // Actualizar el orden de los pasos
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        orden: index + 1
      }));
      
      setLocalSteps(updatedSteps);
      
      // Marcar los cambios para guardar
      updatedSteps.forEach(step => {
        setStepChanges(prev => ({
          ...prev,
          [step.id]: { ...prev[step.id], orden: step.orden }
        }));
      });
    }
  };

  // Update schema mutation
  const updateSchemaMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<ApprovalSchema> }) => {
      const response = await apiRequest("PATCH", `/api/approval-schemas/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-schemas"] });
      toast({
        title: "Configuración actualizada",
        description: "La configuración del esquema ha sido actualizada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la configuración.",
        variant: "destructive",
      });
    },
  });

  // Create schema mutation
  const createSchemaMutation = useMutation({
    mutationFn: async (data: InsertApprovalSchema) => {
      const response = await apiRequest("POST", "/api/approval-schemas", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Schema created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/approval-schemas"] });
      toast({
        title: "Esquema creado",
        description: "El esquema de aprobación ha sido creado exitosamente.",
      });
      setNewSchemaName("");
    },
    onError: (error) => {
      console.error("Error creating schema:", error);
      toast({
        title: "Error",
        description: `Ocurrió un error al crear el esquema: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create step mutation
  const createStepMutation = useMutation({
    mutationFn: async (data: InsertApprovalStep) => {
      const response = await apiRequest("POST", "/api/approval-steps", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-schemas", selectedSchema?.id, "steps"] });
      toast({
        title: "Paso agregado",
        description: "El paso de aprobación ha sido agregado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Ocurrió un error al agregar el paso.",
        variant: "destructive",
      });
    },
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: number) => {
      await apiRequest("DELETE", `/api/approval-steps/${stepId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-schemas", selectedSchema?.id, "steps"] });
      toast({
        title: "Paso eliminado",
        description: "El paso de aprobación ha sido eliminado.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el paso.",
        variant: "destructive",
      });
    },
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, updates }: { stepId: number; updates: Partial<ApprovalStep> }) => {
      const response = await apiRequest("PATCH", `/api/approval-steps/${stepId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-schemas", selectedSchema?.id, "steps"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el paso.",
        variant: "destructive",
      });
    },
  });



  // Handle update schema configuration
  const handleUpdateSchema = () => {
    if (!selectedSchema) return;
    
    const updates = {
      motivos: newSchemaMotivos.length > 0 ? newSchemaMotivos : selectedSchema.motivos,
      visibilityPermissions,
      approvalPermissions,
      adjuntarDocumentos: schemaConfig.adjuntarDocumentos ? "true" : "false",
      adjuntarDocumentosObligatorio: schemaConfig.adjuntarDocumentosObligatorio ? "true" : "false",
      permitirModificarDocumentos: schemaConfig.permitirModificarDocumentos ? "true" : "false",
      comentarioRequerido: schemaConfig.comentarioRequerido ? "true" : "false",
      comentarioObligatorio: schemaConfig.comentarioObligatorio ? "true" : "false",
      comentarioOpcional: schemaConfig.comentarioOpcional ? "true" : "false",
      enviarCorreoNotificacion: schemaConfig.enviarCorreoNotificacion ? "true" : "false",
      solicitudCreada: schemaConfig.solicitudCreada ? "true" : "false",
      solicitudAprobadaRechazada: schemaConfig.solicitudAprobadaRechazada ? "true" : "false",
      permitirSolicitudTerceros: schemaConfig.permitirSolicitudTerceros ? "true" : "false",
      diasMinimo: schemaConfig.diasMinimo ? parseInt(schemaConfig.diasMinimo) : null,
      diasMaximo: schemaConfig.diasMaximo ? parseInt(schemaConfig.diasMaximo) : null,
      diasMultiplo: schemaConfig.diasMultiplo ? parseInt(schemaConfig.diasMultiplo) : null,
      tipoDias: schemaConfig.tipoDias,
    };

    updateSchemaMutation.mutate({ id: selectedSchema.id, updates });
  };

  // Delete schema mutation
  const deleteSchemaMutation = useMutation({
    mutationFn: async (schemaId: number) => {
      await apiRequest("DELETE", `/api/approval-schemas/${schemaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-schemas"] });
      setSelectedSchema(null);
      toast({
        title: "Esquema eliminado",
        description: "El esquema de aprobación ha sido eliminado.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el esquema.",
        variant: "destructive",
      });
    },
  });

  // Save schema changes mutation
  const saveSchemaChangesMutation = useMutation({
    mutationFn: async (schemaId: number) => {
      // Save all pending step changes
      const stepPromises = Object.entries(stepChanges).map(([stepId, changes]) => 
        updateStepMutation.mutateAsync({ stepId: parseInt(stepId), updates: changes })
      );
      
      // Save schema configuration changes (includes all config, permissions, and motivos)
      const schemaUpdates = {
        motivos: selectedSchema?.motivos || null,
        visibilityPermissions: visibilityPermissions,
        approvalPermissions: approvalPermissions,
        adjuntarDocumentos: schemaConfig.adjuntarDocumentos ? "true" : "false",
        adjuntarDocumentosObligatorio: schemaConfig.adjuntarDocumentosObligatorio ? "true" : "false",
        permitirModificarDocumentos: schemaConfig.permitirModificarDocumentos ? "true" : "false",
        comentarioRequerido: schemaConfig.comentarioRequerido ? "true" : "false",
        comentarioObligatorio: schemaConfig.comentarioObligatorio ? "true" : "false",
        comentarioOpcional: schemaConfig.comentarioOpcional ? "true" : "false",
        enviarCorreoNotificacion: schemaConfig.enviarCorreoNotificacion ? "true" : "false",
        solicitudCreada: schemaConfig.solicitudCreada ? "true" : "false",
        solicitudAprobadaRechazada: schemaConfig.solicitudAprobadaRechazada ? "true" : "false",
        permitirSolicitudTerceros: schemaConfig.permitirSolicitudTerceros ? "true" : "false",
        diasMinimo: schemaConfig.diasMinimo ? parseInt(schemaConfig.diasMinimo) : null,
        diasMaximo: schemaConfig.diasMaximo ? parseInt(schemaConfig.diasMaximo) : null,
        diasMultiplo: schemaConfig.diasMultiplo ? parseInt(schemaConfig.diasMultiplo) : null,
        tipoDias: schemaConfig.tipoDias
      };
      
      console.log("Guardando cambios del esquema:", schemaUpdates);
      const schemaPromise = apiRequest("PATCH", `/api/approval-schemas/${schemaId}`, schemaUpdates);
      
      // Execute all promises
      const allPromises = [...stepPromises, schemaPromise];
      
      if (allPromises.length > 0) {
        await Promise.all(allPromises);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      setStepChanges({}); // Clear pending changes
      queryClient.invalidateQueries({ queryKey: ["/api/approval-schemas"] });
      toast({
        title: "Configuración guardada",
        description: "Los cambios en el esquema han sido guardados exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los cambios.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSchema = () => {
    if (!newSchemaName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa un nombre para el esquema.",
        variant: "destructive",
      });
      return;
    }

    // Validar que para permisos se haya seleccionado al menos un motivo
    if (newSchemaType === "Permiso" && newSchemaMotivos.length === 0) {
      toast({
        title: "Motivos requeridos",
        description: "Por favor selecciona al menos un motivo para el permiso.",
        variant: "destructive",
      });
      return;
    }

    // Validar motivos duplicados solo para esquemas de permisos
    if (newSchemaType === "Permiso") {
      const duplicates = validateDuplicateMotivos(newSchemaMotivos);
      if (duplicates.length > 0) {
        setDuplicateMotivos(duplicates);
        setShowDuplicateAlert(true);
        return;
      }
    }

    createSchemaMutation.mutate({
      nombre: newSchemaName,
      tipoSolicitud: newSchemaType,
      motivos: newSchemaType === "Permiso" ? newSchemaMotivos : null,
    });
  };

  const handleAddStep = () => {
    if (!selectedSchema) return;

    const nextOrder = steps.length + 1;
    createStepMutation.mutate({
      schemaId: selectedSchema.id,
      orden: nextOrder,
      descripcion: `paso ${nextOrder}`,
      perfil: "Seleccionar",
      obligatorio: "Si",
    });
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleStepChange = (stepId: number, field: string, value: any) => {
    setStepChanges(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [field]: value
      }
    }));
  };

  const handleVisibilityPermissionToggle = (permission: string) => {
    setVisibilityPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleApprovalPermissionToggle = (permission: string) => {
    setApprovalPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const filteredSchemas = schemas.filter(schema =>
    schema.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProfiles = PROFILES.filter(profile =>
    profile.toLowerCase().includes(profileSearch.toLowerCase())
  );

  // Combinar todos los motivos para mantener compatibilidad con código existente
  const motivosDisponibles = [...motivosData.permisosCompletos, ...motivosData.permisosParciales];

  return (
    <div className={`grid gap-6 h-full ${
      selectedSchema 
        ? "grid-cols-1 lg:grid-cols-[1fr_2fr]" 
        : "grid-cols-1 lg:grid-cols-3"
    }`}>
      {/* Left Panel - Schema List */}
      <div className="space-y-4">
        {/* Create Schema Button */}
        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear esquema
            </Button>
          </CardContent>
        </Card>

        {/* Schema List */}
        <Card>
          <CardHeader>
            <CardTitle>Esquemas</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Escribir al menos 3 caracteres"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredSchemas.map((schema) => (
                <div
                  key={schema.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                    selectedSchema?.id === schema.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-transparent'
                  }`}
                  onClick={() => setSelectedSchema(schema)}
                >
                  <p className="font-medium text-sm">{schema.nombre}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Motivos Section */}
        {selectedSchema?.tipoSolicitud === "Permiso" && (
          <Card>
            <CardContent className="p-4">
              {/* Motivos asociados al esquema */}
              {selectedSchema.motivos && selectedSchema.motivos.length > 0 && (
                <div className="space-y-3 mb-6">
                  <Label className="text-sm font-medium text-gray-700">Motivos asociados</Label>
                  <div className="space-y-2">
                    {selectedSchema.motivos.map((motivo, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`associated-motivo-${index}`}
                          checked={true}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              // Remover motivo del esquema
                              const newMotivos = selectedSchema.motivos?.filter(m => m !== motivo) || [];
                              setSelectedSchema(prev => prev ? { ...prev, motivos: newMotivos } : null);
                            }
                          }}
                        />
                        <Label htmlFor={`associated-motivo-${index}`} className="text-sm">
                          {motivo}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Motivos sin esquema */}
              {motivosData && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Motivos sin esquema</Label>
                  <div className="space-y-4">
                    {/* Permisos Completos */}
                    {motivosData.permisosCompletos && motivosData.permisosCompletos.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">Permisos Completos</Label>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {motivosData.permisosCompletos.filter((motivo: string) => {
                            // Filtrar motivos ya configurados en cualquier esquema
                            const isConfigured = schemas.some(schema => 
                              schema.tipoSolicitud === "Permiso" && 
                              schema.motivos && 
                              schema.motivos.includes(motivo)
                            );
                            return !isConfigured;
                          }).map((motivo: string, index: number) => (
                            <div key={`available-completo-${index}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`available-completo-${index}`}
                                checked={false}
                                onCheckedChange={(checked) => {
                                  if (checked && selectedSchema) {
                                    // Agregar motivo al esquema actual
                                    const newMotivos = [...(selectedSchema.motivos || []), motivo];
                                    setSelectedSchema(prev => prev ? { ...prev, motivos: newMotivos } : null);
                                  }
                                }}
                              />
                              <Label htmlFor={`available-completo-${index}`} className="text-xs">
                                {motivo}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Permisos Parciales */}
                    {motivosData.permisosParciales && motivosData.permisosParciales.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">Permisos Parciales</Label>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {motivosData.permisosParciales.filter((motivo: string) => {
                            // Filtrar motivos ya configurados en cualquier esquema
                            const isConfigured = schemas.some(schema => 
                              schema.tipoSolicitud === "Permiso" && 
                              schema.motivos && 
                              schema.motivos.includes(motivo)
                            );
                            return !isConfigured;
                          }).map((motivo: string, index: number) => (
                            <div key={`available-parcial-${index}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`available-parcial-${index}`}
                                checked={false}
                                onCheckedChange={(checked) => {
                                  if (checked && selectedSchema) {
                                    // Agregar motivo al esquema actual
                                    const newMotivos = [...(selectedSchema.motivos || []), motivo];
                                    setSelectedSchema(prev => prev ? { ...prev, motivos: newMotivos } : null);
                                  }
                                }}
                              />
                              <Label htmlFor={`available-parcial-${index}`} className="text-xs">
                                {motivo}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Center Panel - Schema Details */}
      <div className="space-y-4 relative">
        {selectedSchema ? (
          <>
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
              <TabsList className={`grid w-full ${selectedSchema?.tipoSolicitud === 'Vacaciones' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="general">General</TabsTrigger>
                {selectedSchema?.tipoSolicitud === 'Vacaciones' && (
                  <TabsTrigger value="saldos">Saldos</TabsTrigger>
                )}
                <TabsTrigger value="pasos">Pasos de Aprobación</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input value={selectedSchema.nombre} readOnly />
                    </div>
                    <div>
                      <Label>Tipo de solicitud</Label>
                      <Select value={selectedSchema.tipoSolicitud} disabled>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Permiso">Permisos</SelectItem>
                          <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                          <SelectItem value="Marca">Marcas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>



                    

                    {/* Configuración */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Configuración</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Adjuntar documentos */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="adjuntar-docs" className="text-sm">Adjuntar documentos</Label>
                            <Switch
                              id="adjuntar-docs"
                              checked={schemaConfig.adjuntarDocumentos}
                              onCheckedChange={(checked) => 
                                setSchemaConfig(prev => ({ ...prev, adjuntarDocumentos: checked }))
                              }
                            />
                          </div>
                          {schemaConfig.adjuntarDocumentos && (
                            <div className="ml-4 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="docs-obligatorio"
                                  checked={schemaConfig.adjuntarDocumentosObligatorio}
                                  onCheckedChange={(checked) => 
                                    setSchemaConfig(prev => ({ ...prev, adjuntarDocumentosObligatorio: !!checked }))
                                  }
                                />
                                <Label htmlFor="docs-obligatorio" className="text-sm">Obligatorio</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="modificar-docs"
                                  checked={schemaConfig.permitirModificarDocumentos}
                                  onCheckedChange={(checked) => 
                                    setSchemaConfig(prev => ({ ...prev, permitirModificarDocumentos: !!checked }))
                                  }
                                />
                                <Label htmlFor="modificar-docs" className="text-sm">Permite modificar documentos</Label>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Comentario */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="comentario" className="text-sm">Comentario</Label>
                            <Switch
                              id="comentario"
                              checked={schemaConfig.comentarioRequerido}
                              onCheckedChange={(checked) => 
                                setSchemaConfig(prev => ({ ...prev, comentarioRequerido: checked }))
                              }
                            />
                          </div>
                          {schemaConfig.comentarioRequerido && (
                            <div className="ml-4 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="comentario-obligatorio"
                                  checked={schemaConfig.comentarioObligatorio}
                                  onCheckedChange={(checked) => {
                                    setSchemaConfig(prev => ({ 
                                      ...prev, 
                                      comentarioObligatorio: !!checked,
                                      comentarioOpcional: !checked
                                    }));
                                  }}
                                />
                                <Label htmlFor="comentario-obligatorio" className="text-sm">Obligatorio</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="comentario-opcional"
                                  checked={schemaConfig.comentarioOpcional}
                                  onCheckedChange={(checked) => {
                                    setSchemaConfig(prev => ({ 
                                      ...prev, 
                                      comentarioOpcional: !!checked,
                                      comentarioObligatorio: !checked
                                    }));
                                  }}
                                />
                                <Label htmlFor="comentario-opcional" className="text-sm">Opcional</Label>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Enviar correo de notificación */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email-notif" className="text-sm">Enviar correo de notificación</Label>
                            <Switch
                              id="email-notif"
                              checked={schemaConfig.enviarCorreoNotificacion}
                              onCheckedChange={(checked) => 
                                setSchemaConfig(prev => ({ ...prev, enviarCorreoNotificacion: checked }))
                              }
                            />
                          </div>
                          {schemaConfig.enviarCorreoNotificacion && (
                            <div className="ml-4 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="solicitud-creada"
                                  checked={schemaConfig.solicitudCreada}
                                  onCheckedChange={(checked) => 
                                    setSchemaConfig(prev => ({ ...prev, solicitudCreada: !!checked }))
                                  }
                                />
                                <Label htmlFor="solicitud-creada" className="text-sm">Solicitud creada</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="solicitud-aprobada"
                                  checked={schemaConfig.solicitudAprobadaRechazada}
                                  onCheckedChange={(checked) => 
                                    setSchemaConfig(prev => ({ ...prev, solicitudAprobadaRechazada: !!checked }))
                                  }
                                />
                                <Label htmlFor="solicitud-aprobada" className="text-sm">Solicitud aprobada o rechazada</Label>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Permitir solicitud a terceros */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="terceros" className="text-sm">Permitir solicitud a terceros</Label>
                          <Switch
                            id="terceros"
                            checked={schemaConfig.permitirSolicitudTerceros}
                            onCheckedChange={(checked) => 
                              setSchemaConfig(prev => ({ ...prev, permitirSolicitudTerceros: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cantidad de días - Solo para esquemas de Vacaciones */}
                    {selectedSchema?.tipoSolicitud === 'Vacaciones' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">Cantidad de días</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Establece los límites mínimos, máximos y múltiplos para las solicitudes de vacaciones</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div>
                          <div className="mb-3">
                            <Label className="text-sm mb-2 block">Tipo de días</Label>
                            <Select 
                              value={schemaConfig.tipoDias || "calendario"} 
                              onValueChange={(value) => 
                                setSchemaConfig(prev => ({ ...prev, tipoDias: value }))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar tipo de días" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="calendario">Días calendario</SelectItem>
                                <SelectItem value="laborales">Días laborales</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <div>
                              <Label htmlFor="dias-min" className="text-xs text-gray-600">Mínimo</Label>
                              <Input
                                id="dias-min"
                                type="number"
                                placeholder="0"
                                value={schemaConfig.diasMinimo}
                                onChange={(e) => 
                                  setSchemaConfig(prev => ({ ...prev, diasMinimo: e.target.value }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="dias-max" className="text-xs text-gray-600">Máximo</Label>
                              <Input
                                id="dias-max"
                                type="number"
                                placeholder="0"
                                value={schemaConfig.diasMaximo}
                                onChange={(e) => 
                                  setSchemaConfig(prev => ({ ...prev, diasMaximo: e.target.value }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="dias-mult" className="text-xs text-gray-600">Múltiplo</Label>
                              <Input
                                id="dias-mult"
                                type="number"
                                placeholder="0"
                                value={schemaConfig.diasMultiplo}
                                onChange={(e) => 
                                  setSchemaConfig(prev => ({ ...prev, diasMultiplo: e.target.value }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}


                    
                    {/* Visibility section */}
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="text-base font-medium">Visibilidad</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Permiso para visualización */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Permiso para visualización</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="vis-usuarios"
                                checked={visibilityPermissions.includes("Usuarios")}
                                onCheckedChange={() => handleVisibilityPermissionToggle("Usuarios")}
                              />
                              <Label htmlFor="vis-usuarios" className="text-sm">Usuarios</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="vis-jefes"
                                checked={visibilityPermissions.includes("Jefes de grupo")}
                                onCheckedChange={() => handleVisibilityPermissionToggle("Jefes de grupo")}
                              />
                              <Label htmlFor="vis-jefes" className="text-sm">Jefes de grupo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="vis-rrhh"
                                checked={visibilityPermissions.includes("Recursos humanos")}
                                onCheckedChange={() => handleVisibilityPermissionToggle("Recursos humanos")}
                              />
                              <Label htmlFor="vis-rrhh" className="text-sm">Recursos humanos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="vis-admin"
                                checked={visibilityPermissions.includes("Administradores")}
                                onCheckedChange={() => handleVisibilityPermissionToggle("Administradores")}
                              />
                              <Label htmlFor="vis-admin" className="text-sm">Administradores</Label>
                            </div>
                          </div>
                        </div>

                        
                      </div>
                    </div>

                    
                    {/* Save Configuration Button */}
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleUpdateSchema}
                        disabled={updateSchemaMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {updateSchemaMutation.isPending ? "Guardando..." : "Guardar Configuración"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña Saldos - Solo para esquemas de Vacaciones */}
              {selectedSchema?.tipoSolicitud === 'Vacaciones' && (
                <TabsContent value="saldos" className="space-y-4">
                  <div className="flex gap-6">
                    {/* Sidebar con pasos */}
                    <div className="w-48 space-y-1">
                      <div 
                        className={`p-3 rounded cursor-pointer flex items-center gap-3 ${
                          currentSaldosStep === 1 ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentSaldosStep(1)}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentSaldosStep === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          1
                        </div>
                        <span className="text-sm">Configuración</span>
                      </div>
                      
                      <div 
                        className={`p-3 rounded cursor-pointer flex items-center gap-3 ${
                          currentSaldosStep === 2 ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentSaldosStep(2)}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentSaldosStep === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          2
                        </div>
                        <div className="text-sm">
                          <div>Vacaciones</div>
                          <div>base</div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-3 rounded cursor-pointer flex items-center gap-3 ${
                          currentSaldosStep === 3 ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentSaldosStep(3)}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentSaldosStep === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          3
                        </div>
                        <div className="text-sm">
                          <div>Vacaciones</div>
                          <div>progresivas</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenido principal */}
                    <div className="flex-1">
                      <Card>
                        <CardContent className="p-6">
                          {/* Paso 1: Configuración */}
                          {currentSaldosStep === 1 && (
                            <div className="space-y-6">
                              {/* Tipo de liberación de días */}
                              <div className="space-y-3">
                                <Label className="text-base font-medium">Tipo de liberación de días</Label>
                                <RadioGroup 
                                  value={saldosConfig.tipoLiberacion}
                                  onValueChange={(value) => setSaldosConfig(prev => ({ ...prev, tipoLiberacion: value }))}
                                  className="flex space-x-6"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="diaria" id="liberacion-diaria" />
                                    <Label htmlFor="liberacion-diaria" className="text-sm">Liberación diaria</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="anual" id="liberacion-anual" />
                                    <Label htmlFor="liberacion-anual" className="text-sm">Liberación anual</Label>
                                  </div>
                                </RadioGroup>
                              </div>

                              {/* Fechas de liberación de períodos */}
                              <div className="space-y-3">
                                <Label className="text-base font-medium">
                                  Fechas de liberación de períodos
                                  <span className="ml-2 text-blue-500 cursor-pointer">ℹ</span>
                                </Label>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                    <div>Período actual</div>
                                    <div>Período siguiente</div>
                                    <div>Caducidad del período actual</div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <Input
                                      type="number"
                                      value={saldosConfig.anoActual}
                                      onChange={(e) => setSaldosConfig(prev => ({ ...prev, anoActual: e.target.value }))}
                                      placeholder="2025"
                                    />
                                    <Input
                                      type="number"
                                      value={saldosConfig.anoSiguiente}
                                      onChange={(e) => setSaldosConfig(prev => ({ ...prev, anoSiguiente: e.target.value }))}
                                      placeholder="2025"
                                    />
                                    <div className="flex items-center space-x-1">
                                      <span className="text-sm">del</span>
                                      <Input
                                        value={saldosConfig.caducidadPeriodoActual}
                                        onChange={(e) => setSaldosConfig(prev => ({ ...prev, caducidadPeriodoActual: e.target.value }))}
                                        className="w-16"
                                      />
                                      <Input
                                        value={saldosConfig.anoActual}
                                        readOnly
                                        className="w-16"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Excluir de la solicitud */}
                              <div className="space-y-3">
                                <Label className="text-base font-medium">
                                  Excluir de la solicitud
                                  <span className="ml-2 text-blue-500 cursor-pointer">ℹ</span>
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="excluir-sabado"
                                      checked={saldosConfig.excluirSabado}
                                      onCheckedChange={(checked) => 
                                        setSaldosConfig(prev => ({ ...prev, excluirSabado: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="excluir-sabado" className="text-sm">Sábado</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="excluir-domingo"
                                      checked={saldosConfig.excluirDomingo}
                                      onCheckedChange={(checked) => 
                                        setSaldosConfig(prev => ({ ...prev, excluirDomingo: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="excluir-domingo" className="text-sm">Domingo</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="excluir-feriado"
                                      checked={saldosConfig.excluirFeriado}
                                      onCheckedChange={(checked) => 
                                        setSaldosConfig(prev => ({ ...prev, excluirFeriado: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="excluir-feriado" className="text-sm">Feriado</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="excluir-descanso"
                                      checked={saldosConfig.excluirDescanso}
                                      onCheckedChange={(checked) => 
                                        setSaldosConfig(prev => ({ ...prev, excluirDescanso: !!checked }))
                                      }
                                    />
                                    <Label htmlFor="excluir-descanso" className="text-sm">Descanso</Label>
                                  </div>
                                </div>
                              </div>

                              {/* Extender días no laborables */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="extender-dias" className="text-sm">
                                    Extender días no laborables
                                    <span className="ml-2 text-blue-500 cursor-pointer">ℹ</span>
                                  </Label>
                                  <Switch
                                    id="extender-dias"
                                    checked={saldosConfig.extenderDiasNoLaborables}
                                    onCheckedChange={(checked) => 
                                      setSaldosConfig(prev => ({ ...prev, extenderDiasNoLaborables: checked }))
                                    }
                                  />
                                </div>
                              </div>
                              
                              {/* Botón Siguiente */}
                              <div className="flex justify-end pt-4">
                                <Button 
                                  onClick={() => setCurrentSaldosStep(2)}
                                  className="bg-gray-500 hover:bg-gray-600 text-white"
                                >
                                  Siguiente
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Paso 2: Vacaciones base */}
                          {currentSaldosStep === 2 && (
                            <div className="space-y-6">
                              <div className="space-y-3">
                                <Label className="text-base font-medium">Mínimo inicio de solicitud</Label>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    value={saldosConfig.minimoInicioSolicitud}
                                    onChange={(e) => setSaldosConfig(prev => ({ ...prev, minimoInicioSolicitud: e.target.value }))}
                                    className="w-20"
                                  />
                                  <span className="text-sm">meses</span>
                                </div>
                              </div>
                              
                              {/* Botones de navegación */}
                              <div className="flex justify-end pt-4">
                                <Button 
                                  onClick={() => setCurrentSaldosStep(3)}
                                  className="bg-gray-500 hover:bg-gray-600 text-white"
                                >
                                  Siguiente
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Paso 3: Vacaciones progresivas */}
                          {currentSaldosStep === 3 && (
                            <div className="space-y-6">
                              <div className="text-center text-gray-500 py-8">
                                <p>Configuración de vacaciones progresivas</p>
                                <p className="text-sm mt-2">Esta funcionalidad estará disponible próximamente</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="pasos" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Pasos de aprobación</CardTitle>
                    <Button onClick={handleAddStep} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar paso
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-5 gap-2 text-sm font-medium text-gray-600 border-b pb-2 pl-10">
                        <div>Orden</div>
                        <div>Descripción</div>
                        <div>Perfil</div>
                        <div>Tipo</div>
                        <div></div>
                      </div>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={localSteps.map(step => step.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {localSteps.map((step) => (
                            <SortableApprovalStepRow 
                              key={step.id} 
                              step={step} 
                              onDelete={() => deleteStepMutation.mutate(step.id)}
                              isDeleting={deleteStepMutation.isPending}
                              onChange={handleStepChange}
                              pendingChanges={stepChanges[step.id]}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons - Positioned at bottom right */}
            <div className="absolute bottom-0 right-0 flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteSchemaMutation.isPending}
              >
                Desactivar
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">
                Selecciona un esquema para ver los detalles
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de alerta para motivos duplicados */}
      <AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Motivos duplicados detectados</AlertDialogTitle>
            <AlertDialogDescription>
              Ya tienes un esquema con uno o más de los motivos seleccionados:
              <br />
              <strong>{duplicateMotivos.join(", ")}</strong>
              <br />
              <br />
              No se puede crear un esquema con motivos que ya están asignados a otro esquema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDuplicateAlert(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminar esquema */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará permanentemente el esquema "{selectedSchema?.nombre}". 
              No podrás revertir esta acción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowDeleteConfirm(false)}
              className="mr-2"
            >
              Cancelar
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => {
                if (selectedSchema) {
                  deleteSchemaMutation.mutate(selectedSchema.id);
                }
                setShowDeleteConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para crear esquema */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear esquema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Turnos sede central"
                value={newSchemaName}
                onChange={(e) => setNewSchemaName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo de solicitud</Label>
              <Select value={newSchemaType} onValueChange={(value) => {
                setNewSchemaType(value);
                setNewSchemaMotivos([]); // Reset motivos when type changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permiso">Permiso</SelectItem>
                  <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Campo motivos - Solo para permisos */}
            {newSchemaType === "Permiso" && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Motivos aplicables</Label>
                <div className="max-h-48 overflow-y-auto space-y-4">
                  {/* Permisos Completos */}
                  {motivosData.permisosCompletos.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600">Permisos Completos</Label>
                      <div className="grid grid-cols-1 gap-2 pl-2">
                        {motivosData.permisosCompletos.filter((motivo: string) => {
                          // Filtrar motivos ya configurados para no mostrarlos en el modal de creación
                          const isConfiguredInOtherSchema = schemas.some(schema => 
                            schema.tipoSolicitud === "Permiso" && 
                            schema.motivos && 
                            schema.motivos.includes(motivo)
                          );
                          return !isConfiguredInOtherSchema;
                        }).map((motivo: string, index: number) => {
                          return (
                            <div key={`completo-${motivo}-${index}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`motivo-completo-${index}`}
                                checked={newSchemaMotivos.includes(motivo)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    // Permitir múltiples motivos
                                    setNewSchemaMotivos(prev => [...prev, motivo]);
                                  } else {
                                    // Remover motivo de la lista
                                    setNewSchemaMotivos(prev => prev.filter(m => m !== motivo));
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`motivo-completo-${index}`} 
                                className="text-xs"
                              >
                                {motivo}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Permisos Parciales */}
                  {motivosData.permisosParciales.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600">Permisos Parciales</Label>
                      <div className="grid grid-cols-1 gap-2 pl-2">
                        {motivosData.permisosParciales.filter((motivo: string) => {
                          // Filtrar motivos ya configurados para no mostrarlos en el modal de creación
                          const isConfiguredInOtherSchema = schemas.some(schema => 
                            schema.tipoSolicitud === "Permiso" && 
                            schema.motivos && 
                            schema.motivos.includes(motivo)
                          );
                          return !isConfiguredInOtherSchema;
                        }).map((motivo: string, index: number) => {
                          return (
                            <div key={`parcial-${motivo}-${index}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`motivo-parcial-${index}`}
                                checked={newSchemaMotivos.includes(motivo)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    // Permitir múltiples motivos
                                    setNewSchemaMotivos(prev => [...prev, motivo]);
                                  } else {
                                    // Remover motivo de la lista
                                    setNewSchemaMotivos(prev => prev.filter(m => m !== motivo));
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`motivo-parcial-${index}`} 
                                className="text-xs"
                              >
                                {motivo}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                handleCreateSchema();
                setShowCreateModal(false);
              }}
              disabled={createSchemaMutation.isPending}
            >
              {createSchemaMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Componente sortable para pasos de aprobación
function SortableApprovalStepRow({ 
  step, 
  onDelete, 
  isDeleting, 
  onChange, 
  pendingChanges 
}: {
  step: ApprovalStep;
  onDelete: () => void;
  isDeleting: boolean;
  onChange: (id: number, field: keyof ApprovalStep, value: string) => void;
  pendingChanges?: Partial<ApprovalStep>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentObligatorio = pendingChanges?.obligatorio ?? step.obligatorio;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-3 border rounded-lg bg-white"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="flex-1 grid grid-cols-4 gap-3 items-center">
        <div>
          <Label className="text-xs text-gray-600">Orden</Label>
          <div className="text-sm font-medium">{step.orden}</div>
        </div>
        
        <div>
          <Label className="text-xs text-gray-600">Descripción</Label>
          <Input
            value={pendingChanges?.descripcion ?? step.descripcion}
            onChange={(e) => onChange(step.id, "descripcion", e.target.value)}
            className="text-sm"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-600">Perfil</Label>
          <Select
            value={pendingChanges?.perfil ?? step.perfil}
            onValueChange={(value) => onChange(step.id, "perfil", value)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Recursos humanos">Recursos humanos</SelectItem>
              <SelectItem value="Jefes de grupo">Jefes de grupo</SelectItem>
              <SelectItem value="Administradores">Administradores</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs text-gray-600">Tipo</Label>
          <Select
            value={currentObligatorio}
            onValueChange={(value) => onChange(step.id, "obligatorio", value)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Si">Obligatorio</SelectItem>
              <SelectItem value="No">Opcional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Component for individual approval step row
function ApprovalStepRow({ 
  step, 
  onDelete, 
  isDeleting,
  onChange,
  pendingChanges 
}: { 
  step: ApprovalStep; 
  onDelete: () => void; 
  isDeleting: boolean;
  onChange: (stepId: number, field: keyof ApprovalStep, value: string) => void;
  pendingChanges?: Partial<ApprovalStep>;
}) {
  const currentPerfil = pendingChanges?.perfil ?? step.perfil;
  
  return (
    <div className="grid grid-cols-4 gap-2 items-center py-2 border-b border-gray-100">
      <div className="text-sm">{step.orden}</div>
      <Input 
        defaultValue={step.descripcion} 
        className="text-sm h-8"
        readOnly
      />
      <Select 
        value={currentPerfil}
        onValueChange={(value) => onChange(step.id, 'perfil', value)}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROFILES.map((profile) => (
            <SelectItem key={profile} value={profile}>
              {profile}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center justify-between">
        <Select defaultValue={step.obligatorio} disabled>
          <SelectTrigger className="h-8 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Si">Si</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}