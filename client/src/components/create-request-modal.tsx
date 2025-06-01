import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Upload, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { InsertRequest } from "@shared/schema";
import type { DateRange } from "react-day-picker";

interface CreateRequestModalProps {
  onRequestCreated?: () => void;
}

export function CreateRequestModal({ onRequestCreated }: CreateRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [formData, setFormData] = useState<Partial<InsertRequest>>({
    tipo: "",
    fechaSolicitada: "",
    fechaFin: "",
    asunto: "",
    descripcion: "",
    solicitadoPor: "Andrés Acevedo", // Default user
    identificador: "16345990-8", // Default identifier
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
      identificador: "16345990-8",
      motivo: "",
      archivosAdjuntos: [],
    });
    setDateRange(undefined);
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
    switch (tipo) {
      case "Permiso":
        return [
          "Permiso Licencia Médica",
          "Permiso con goce",
          "Permiso por horas",
          "Permiso Capacitación"
        ];
      default:
        return [];
    }
  };

  const handleTipoChange = (value: string) => {
    handleInputChange('tipo', value);
    // Reset motivo when tipo changes
    handleInputChange('motivo', "");
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

    // Para permisos, usar descripcion como asunto si no hay asunto definido
    const requestData = {
      ...formData,
      asunto: formData.asunto || "Solicitud de Permiso",
    };

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
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos básicos iniciales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nombreUsuario" className="text-gray-700">Nombre usuario</Label>
              <Input
                id="nombreUsuario"
                value={formData.solicitadoPor}
                onChange={(e) => handleInputChange('solicitadoPor', e.target.value)}
                className="bg-gray-100"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identificador" className="text-gray-700">Identificador</Label>
              <Input
                id="identificador"
                value={formData.identificador || ""}
                onChange={(e) => handleInputChange('identificador', e.target.value)}
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
                      {getMotivosForTipo(formData.tipo).map((motivo) => (
                        <SelectItem key={motivo} value={motivo}>
                          {motivo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Adjuntar archivos</Label>
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
                </div>
              </div>

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
              disabled={createRequestMutation.isPending || !formData.tipo}
              className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
            >
              {createRequestMutation.isPending ? "Creando..." : "Solicitar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
