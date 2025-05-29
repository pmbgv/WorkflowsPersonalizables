import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Search, Save } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("general");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset changes when switching schemas
  useEffect(() => {
    setStepChanges({});
    setSelectedPermissions([]);
    setVisibilityPermissions([]);
    setApprovalPermissions([]);
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
      
      // Save schema configuration changes (permissions)
      const schemaUpdates: any = {};
      if (visibilityPermissions.length > 0 || approvalPermissions.length > 0) {
        schemaUpdates.visibilityPermissions = visibilityPermissions;
        schemaUpdates.approvalPermissions = approvalPermissions;
      }
      
      const schemaPromise = Object.keys(schemaUpdates).length > 0 
        ? apiRequest("PATCH", `/api/approval-schemas/${schemaId}`, schemaUpdates)
        : Promise.resolve();
      
      // Execute all promises
      const allPromises = [...stepPromises];
      if (Object.keys(schemaUpdates).length > 0) {
        allPromises.push(schemaPromise);
      }
      
      if (allPromises.length > 0) {
        await Promise.all(allPromises);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      setStepChanges({}); // Clear pending changes
      setVisibilityPermissions([]);
      setApprovalPermissions([]);
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

    createSchemaMutation.mutate({
      nombre: newSchemaName,
      tipoSolicitud: newSchemaType,
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

  const handleStepChange = (stepId: number, field: keyof ApprovalStep, value: string) => {
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

  return (
    <div className={`grid gap-6 h-full ${
      selectedSchema 
        ? "grid-cols-1 lg:grid-cols-[1fr_2fr]" 
        : "grid-cols-1 lg:grid-cols-3"
    }`}>
      {/* Left Panel - Schema List */}
      <div className="space-y-4">
        {/* Create Schema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear esquema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nombre del esquema"
              value={newSchemaName}
              onChange={(e) => setNewSchemaName(e.target.value)}
            />
            <Select value={newSchemaType} onValueChange={setNewSchemaType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de solicitud" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Permiso">Permiso</SelectItem>
                <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                <SelectItem value="Licencia">Licencia</SelectItem>
                <SelectItem value="Capacitación">Capacitación</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleCreateSchema}
              disabled={createSchemaMutation.isPending}
              className="w-full"
            >
              {createSchemaMutation.isPending ? "Creando..." : "Crear"}
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
      </div>

      {/* Center Panel - Schema Details */}
      <div className="space-y-4 relative">
        {selectedSchema ? (
          <>
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
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

                        {/* Permiso para aprobación */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Permiso para aprobación</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="apr-rrhh"
                                checked={approvalPermissions.includes("Recursos humanos")}
                                onCheckedChange={() => handleApprovalPermissionToggle("Recursos humanos")}
                              />
                              <Label htmlFor="apr-rrhh" className="text-sm">Recursos humanos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="apr-jefes"
                                checked={approvalPermissions.includes("Jefes de grupo")}
                                onCheckedChange={() => handleApprovalPermissionToggle("Jefes de grupo")}
                              />
                              <Label htmlFor="apr-jefes" className="text-sm">Jefes de grupo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="apr-admin"
                                checked={approvalPermissions.includes("Administradores")}
                                onCheckedChange={() => handleApprovalPermissionToggle("Administradores")}
                              />
                              <Label htmlFor="apr-admin" className="text-sm">Administradores</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Permissions section for Permiso type */}
                    {selectedSchema.tipoSolicitud === "Permiso" && (
                      <div className="space-y-3 pt-4 border-t">
                        <Label className="text-base font-medium">Permisos</Label>
                        <div className="space-y-3">
                          {PERMISSION_TYPES.map((permission, index) => (
                            <div key={`permission-${index}-${permission}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`permission-${index}`}
                                checked={selectedPermissions.includes(permission)}
                                onCheckedChange={() => handlePermissionToggle(permission)}
                              />
                              <Label htmlFor={`permission-${index}`} className="text-sm">
                                {permission}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
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
                      <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-600 border-b pb-2">
                        <div>Orden</div>
                        <div>Descripción</div>
                        <div>Perfiles</div>
                        <div>Obligatorio</div>
                      </div>
                      {steps.map((step) => (
                        <ApprovalStepRow 
                          key={step.id} 
                          step={step} 
                          onDelete={() => deleteStepMutation.mutate(step.id)}
                          isDeleting={deleteStepMutation.isPending}
                          onChange={handleStepChange}
                          pendingChanges={stepChanges[step.id]}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons - Positioned at bottom right */}
            <div className="absolute bottom-0 right-0 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveSchemaChangesMutation.mutate(selectedSchema.id)}
                disabled={saveSchemaChangesMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteSchemaMutation.mutate(selectedSchema.id)}
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