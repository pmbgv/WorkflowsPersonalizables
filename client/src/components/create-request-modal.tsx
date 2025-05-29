import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertRequest } from "@shared/schema";

interface CreateRequestModalProps {
  onRequestCreated?: () => void;
}

export function CreateRequestModal({ onRequestCreated }: CreateRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertRequest>>({
    tipo: "",
    fechaSolicitada: "",
    fechaFin: "",
    asunto: "",
    descripcion: "",
    solicitadoPor: "Andrés Acevedo", // Default user
    motivo: "",
    archivosAdjuntos: [],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      motivo: "",
      archivosAdjuntos: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo || !formData.fechaSolicitada || !formData.asunto || !formData.solicitadoPor) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate(formData as InsertRequest);
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
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nueva Solicitud
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de solicitud *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => handleInputChange('tipo', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permiso">Permiso</SelectItem>
                  <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Select 
                value={formData.motivo ?? ""} 
                onValueChange={(value) => handleInputChange('motivo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  {formData.tipo === "Permiso" && (
                    <>
                      <SelectItem value="Permiso Licencia Médica">Permiso Licencia Médica</SelectItem>
                      <SelectItem value="Permiso con goce">Permiso con goce</SelectItem>
                      <SelectItem value="Permiso por horas">Permiso por horas</SelectItem>
                      <SelectItem value="Permiso capacitación">Permiso capacitación</SelectItem>
                    </>
                  )}
                  {formData.tipo === "Vacaciones" && (
                    <>
                      <SelectItem value="Vacaciones anuales">Vacaciones anuales</SelectItem>
                      <SelectItem value="Vacaciones proporcionales">Vacaciones proporcionales</SelectItem>
                    </>
                  )}
                  {!formData.tipo && (
                    <SelectItem value="" disabled>Selecciona primero el tipo de solicitud</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaSolicitada">Fecha solicitada *</Label>
              <Input
                id="fechaSolicitada"
                type="date"
                value={formData.fechaSolicitada}
                onChange={(e) => handleInputChange('fechaSolicitada', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha de fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={formData.fechaFin ?? ""}
                onChange={(e) => handleInputChange('fechaFin', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asunto">Asunto *</Label>
            <Input
              id="asunto"
              placeholder="Ingresa el asunto de la solicitud"
              value={formData.asunto}
              onChange={(e) => handleInputChange('asunto', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe los detalles de tu solicitud..."
              rows={4}
              value={formData.descripcion ?? ""}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Documentos adjuntos</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Arrastra archivos aquí o <span className="text-blue-600 cursor-pointer">selecciona archivos</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createRequestMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createRequestMutation.isPending ? "Creando..." : "Crear Solicitud"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
