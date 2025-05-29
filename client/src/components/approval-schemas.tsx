import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Search } from "lucide-react";
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
  "Reportes Jefes",
  "Jefe grupo",
  "Seleccionar",
  "Supervisor",
  "Administrador",
  "Usuario",
  "Jefe grupo",
  "Administradora Asistencia",
  "Supervisor Asistencia"
];

export function ApprovalSchemas() {
  const [selectedSchema, setSelectedSchema] = useState<ApprovalSchema | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newSchemaName, setNewSchemaName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [profileSearch, setProfileSearch] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      tipoSolicitud: "Permiso", // Default type
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

  const filteredSchemas = schemas.filter(schema =>
    schema.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProfiles = PROFILES.filter(profile =>
    profile.toLowerCase().includes(profileSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
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
      <div className="space-y-4">
        {selectedSchema ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{selectedSchema.nombre}</CardTitle>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSchemaMutation.mutate(selectedSchema.id)}
                  disabled={deleteSchemaMutation.isPending}
                >
                  Desactivar
                </Button>
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
              </CardContent>
            </Card>

            {/* Approval Steps */}
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
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
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

      {/* Right Panel - Permissions */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Permisos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PERMISSION_TYPES.map((permission) => (
              <div key={permission} className="flex items-center space-x-2">
                <Checkbox
                  id={permission}
                  checked={selectedPermissions.includes(permission)}
                  onCheckedChange={() => handlePermissionToggle(permission)}
                />
                <Label htmlFor={permission} className="text-sm">
                  {permission}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component for individual approval step row
function ApprovalStepRow({ 
  step, 
  onDelete, 
  isDeleting 
}: { 
  step: ApprovalStep; 
  onDelete: () => void; 
  isDeleting: boolean; 
}) {
  return (
    <div className="grid grid-cols-4 gap-2 items-center py-2 border-b border-gray-100">
      <div className="text-sm">{step.orden}</div>
      <Input 
        defaultValue={step.descripcion} 
        className="text-sm h-8"
        readOnly
      />
      <Select defaultValue={step.perfil} disabled>
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