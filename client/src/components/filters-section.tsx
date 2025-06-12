import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Filter, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

interface FiltersSectionProps {
  filters: {
    fechaInicio: string;
    fechaFin: string;
    tipoFecha: string;
    estado: string;
    tipo: string;
    busqueda: string;
  };
  onFiltersChange: (filters: any) => void;
  onApplyFilters: () => void;
}

export function FiltersSection({ filters, onFiltersChange, onApplyFilters }: FiltersSectionProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.fechaInicio ? new Date(filters.fechaInicio) : undefined,
    to: filters.fechaFin ? new Date(filters.fechaFin) : undefined,
  });

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getDateRangeText = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`;
    }
    if (dateRange.from) {
      return format(dateRange.from, "dd/MM/yyyy", { locale: es });
    }
    return "Seleccionar fechas";
  };

  const handlePresetSelection = (preset: string) => {
    const today = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case "hoy":
        from = to = today;
        break;
      case "esta-semana":
        from = startOfWeek(today, { weekStartsOn: 1 });
        to = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "semana-anterior":
        const lastWeek = subWeeks(today, 1);
        from = startOfWeek(lastWeek, { weekStartsOn: 1 });
        to = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case "ultimas-dos-semanas":
        from = subWeeks(today, 2);
        to = today;
        break;
      case "este-mes":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case "mes-anterior":
        const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      default:
        return;
    }

    setDateRange({ from, to });
    onFiltersChange({
      ...filters,
      fechaInicio: format(from, "yyyy-MM-dd"),
      fechaFin: format(to, "yyyy-MM-dd"),
    });
  };

  const handleDateRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setDateRange(range);
      onFiltersChange({
        ...filters,
        fechaInicio: range.from ? format(range.from, "yyyy-MM-dd") : "",
        fechaFin: range.to ? format(range.to, "yyyy-MM-dd") : "",
      });
    }
  };

  const handleApplyDateFilter = () => {
    setIsDatePickerOpen(false);
  };

  const handleCancelDateFilter = () => {
    setDateRange({
      from: filters.fechaInicio ? new Date(filters.fechaInicio) : undefined,
      to: filters.fechaFin ? new Date(filters.fechaFin) : undefined,
    });
    setIsDatePickerOpen(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Rango de fechas</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getDateRangeText()}
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  {/* Left sidebar with preset options */}
                  <div className="border-r p-3 space-y-2 bg-gray-50">
                    <div className="space-y-1">
                      <button
                        onClick={() => handlePresetSelection("hoy")}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        Hoy
                      </button>
                      <button
                        onClick={() => handlePresetSelection("esta-semana")}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        Esta semana
                      </button>
                      <button
                        onClick={() => handlePresetSelection("semana-anterior")}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        Semana anterior
                      </button>
                      <button
                        onClick={() => handlePresetSelection("ultimas-dos-semanas")}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        Últimas dos semanas
                      </button>
                      <button
                        onClick={() => handlePresetSelection("este-mes")}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        Este mes
                      </button>
                      <button
                        onClick={() => handlePresetSelection("mes-anterior")}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        Mes anterior
                      </button>
                      <hr className="my-2" />
                      <button
                        onClick={() => setDateRange({ from: undefined, to: undefined })}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        📅 Rango personalizado
                      </button>
                    </div>
                  </div>
                  
                  {/* Calendar area */}
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <Label className="text-sm font-medium">Desde:</Label>
                        <Input
                          type="date"
                          value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const newFrom = e.target.value ? new Date(e.target.value) : undefined;
                            setDateRange({ ...dateRange, from: newFrom });
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Hasta:</Label>
                        <Input
                          type="date"
                          value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const newTo = e.target.value ? new Date(e.target.value) : undefined;
                            setDateRange({ ...dateRange, to: newTo });
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                      locale={es}
                    />
                    
                    {/* Radio buttons for date type */}
                    <div className="mt-4 pt-4 border-t">
                      <RadioGroup
                        value={filters.tipoFecha || "fechaCreacion"}
                        onValueChange={(value) => handleFilterChange('tipoFecha', value)}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fechaCreacion" id="fechaCreacion" />
                          <Label htmlFor="fechaCreacion" className="text-sm">Fecha de creación</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fechaSolicitada" id="fechaSolicitada" />
                          <Label htmlFor="fechaSolicitada" className="text-sm">Fecha solicitada</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                      <Button variant="outline" onClick={handleCancelDateFilter}>
                        Cancelar
                      </Button>
                      <Button onClick={handleApplyDateFilter} className="bg-blue-600 hover:bg-blue-700">
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={filters.estado} onValueChange={(value) => handleFilterChange('estado', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={filters.tipo} onValueChange={(value) => handleFilterChange('tipo', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Permiso">Permiso</SelectItem>
                <SelectItem value="Vacaciones">Vacaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="busqueda">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="busqueda"
                placeholder="Buscar por solicitante o tipo..."
                value={filters.busqueda}
                onChange={(e) => handleFilterChange('busqueda', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onApplyFilters} className="bg-blue-600 hover:bg-blue-700">
            <Search className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
