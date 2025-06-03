import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, Plus, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  description?: string;
}

interface Assignment {
  id: number;
  userId: string;
  userName: string;
  shiftId: number;
  date: string;
  notes?: string;
}

interface ShiftSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: any[];
}

const COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#F97316", "#06B6D4", "#84CC16"
];

const DAYS_OF_WEEK = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
];

export function ShiftScheduler({ open, onOpenChange, users }: ShiftSchedulerProps) {
  const [activeTab, setActiveTab] = useState("schedule");
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([
    { id: 1, name: "Mañana", startTime: "08:00", endTime: "16:00", color: "#3B82F6", description: "Turno matutino" },
    { id: 2, name: "Tarde", startTime: "16:00", endTime: "00:00", color: "#EF4444", description: "Turno vespertino" },
    { id: 3, name: "Noche", startTime: "00:00", endTime: "08:00", color: "#10B981", description: "Turno nocturno" }
  ]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditingShift, setIsEditingShift] = useState(false);
  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    color: COLORS[0],
    description: ""
  });

  const { toast } = useToast();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const createShift = () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    const shift: Shift = {
      id: Date.now(),
      name: newShift.name,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      color: newShift.color,
      description: newShift.description
    };

    setShifts([...shifts, shift]);
    setNewShift({
      name: "",
      startTime: "",
      endTime: "",
      color: COLORS[0],
      description: ""
    });

    toast({
      title: "Turno creado",
      description: `El turno "${shift.name}" ha sido creado exitosamente.`,
    });
  };

  const updateShift = () => {
    if (!selectedShift) return;

    const updatedShifts = shifts.map(shift =>
      shift.id === selectedShift.id ? selectedShift : shift
    );
    setShifts(updatedShifts);
    setIsEditingShift(false);
    setSelectedShift(null);

    toast({
      title: "Turno actualizado",
      description: "El turno ha sido actualizado exitosamente.",
    });
  };

  const deleteShift = (shiftId: number) => {
    setShifts(shifts.filter(shift => shift.id !== shiftId));
    setAssignments(assignments.filter(assignment => assignment.shiftId !== shiftId));

    toast({
      title: "Turno eliminado",
      description: "El turno ha sido eliminado exitosamente.",
    });
  };

  const assignUserToShift = (userId: string, userName: string, shiftId: number, date: string) => {
    // Remove existing assignment for this user/date
    const filteredAssignments = assignments.filter(
      assignment => !(assignment.userId === userId && assignment.date === date)
    );

    const newAssignment: Assignment = {
      id: Date.now(),
      userId,
      userName,
      shiftId,
      date,
    };

    setAssignments([...filteredAssignments, newAssignment]);

    toast({
      title: "Asignación creada",
      description: `${userName} ha sido asignado al turno.`,
    });
  };

  const removeAssignment = (assignmentId: number) => {
    setAssignments(assignments.filter(assignment => assignment.id !== assignmentId));

    toast({
      title: "Asignación eliminada",
      description: "La asignación ha sido eliminada.",
    });
  };

  const getAssignmentsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return assignments.filter(assignment => assignment.date === dateStr);
  };

  const getShiftById = (shiftId: number) => {
    return shifts.find(shift => shift.id === shiftId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            Planificador de Turnos
          </DialogTitle>
          <Button
            variant="ghost"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Calendario</TabsTrigger>
            <TabsTrigger value="shifts">Turnos</TabsTrigger>
            <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={goToPreviousWeek}>
                  ← Anterior
                </Button>
                <Button variant="outline" onClick={goToCurrentWeek}>
                  Hoy
                </Button>
                <Button variant="outline" onClick={goToNextWeek}>
                  Siguiente →
                </Button>
              </div>
              <h3 className="text-lg font-medium">
                {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
              </h3>
            </div>

            {/* Calendar Grid */}
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-8 bg-gray-50">
                <div className="p-3 border-r font-medium text-sm">Turnos</div>
                {weekDays.map((day, index) => (
                  <div key={index} className="p-3 border-r text-center font-medium text-sm">
                    <div>{DAYS_OF_WEEK[index]}</div>
                    <div className="text-xs text-gray-500">{format(day, "d MMM")}</div>
                  </div>
                ))}
              </div>

              {/* Shifts Rows */}
              {shifts.map((shift) => (
                <div key={shift.id} className="grid grid-cols-8 border-t">
                  <div className="p-3 border-r bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: shift.color }}
                      />
                      <div>
                        <div className="font-medium text-sm">{shift.name}</div>
                        <div className="text-xs text-gray-500">
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                    </div>
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const dayAssignments = getAssignmentsForDay(day).filter(
                      assignment => assignment.shiftId === shift.id
                    );
                    const dateStr = format(day, "yyyy-MM-dd");
                    
                    return (
                      <div key={dayIndex} className="p-2 border-r min-h-[80px] bg-white">
                        <div className="space-y-1">
                          {dayAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="p-1 rounded text-xs bg-blue-100 text-blue-800 flex items-center justify-between"
                            >
                              <span className="truncate">{assignment.userName}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-red-100"
                                onClick={() => removeAssignment(assignment.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          
                          {/* Add Assignment Dropdown */}
                          <Select onValueChange={(userId) => {
                            const user = users.find(u => u.Identifier === userId);
                            if (user) {
                              assignUserToShift(userId, `${user.Name} ${user.LastName}`, shift.id, dateStr);
                            }
                          }}>
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue placeholder="+ Asignar" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.filter(user => user.Identifier).map((user) => (
                                <SelectItem key={user.Identifier} value={user.Identifier}>
                                  {user.Name} {user.LastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Shift */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Crear Nuevo Turno</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="shiftName">Nombre del Turno</Label>
                    <Input
                      id="shiftName"
                      value={newShift.name}
                      onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                      placeholder="Ej: Mañana, Tarde, Noche"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Hora Inicio</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newShift.startTime}
                        onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">Hora Fin</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newShift.endTime}
                        onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="shiftColor">Color</Label>
                    <div className="flex space-x-2 mt-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newShift.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewShift({ ...newShift, color })}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="shiftDescription">Descripción (Opcional)</Label>
                    <Input
                      id="shiftDescription"
                      value={newShift.description}
                      onChange={(e) => setNewShift({ ...newShift, description: e.target.value })}
                      placeholder="Descripción del turno"
                    />
                  </div>

                  <Button onClick={createShift} className="w-full">
                    Crear Turno
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Shifts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Turnos Existentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: shift.color }}
                          />
                          <div>
                            <div className="font-medium">{shift.name}</div>
                            <div className="text-sm text-gray-500">
                              {shift.startTime} - {shift.endTime}
                            </div>
                            {shift.description && (
                              <div className="text-xs text-gray-400">{shift.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedShift(shift);
                              setIsEditingShift(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteShift(shift.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Resumen de Asignaciones</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No hay asignaciones para esta semana
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assignments.map((assignment) => {
                        const shift = getShiftById(assignment.shiftId);
                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              {shift && (
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: shift.color }}
                                />
                              )}
                              <div>
                                <div className="font-medium">{assignment.userName}</div>
                                <div className="text-sm text-gray-500">
                                  {shift?.name} - {format(new Date(assignment.date), "EEEE d 'de' MMMM", { locale: es })}
                                </div>
                                {shift && (
                                  <div className="text-xs text-gray-400">
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Shift Modal */}
        {isEditingShift && selectedShift && (
          <Dialog open={isEditingShift} onOpenChange={setIsEditingShift}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Turno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editShiftName">Nombre del Turno</Label>
                  <Input
                    id="editShiftName"
                    value={selectedShift.name}
                    onChange={(e) => setSelectedShift({ ...selectedShift, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editStartTime">Hora Inicio</Label>
                    <Input
                      id="editStartTime"
                      type="time"
                      value={selectedShift.startTime}
                      onChange={(e) => setSelectedShift({ ...selectedShift, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEndTime">Hora Fin</Label>
                    <Input
                      id="editEndTime"
                      type="time"
                      value={selectedShift.endTime}
                      onChange={(e) => setSelectedShift({ ...selectedShift, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex space-x-2 mt-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedShift.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedShift({ ...selectedShift, color })}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="editShiftDescription">Descripción</Label>
                  <Input
                    id="editShiftDescription"
                    value={selectedShift.description || ""}
                    onChange={(e) => setSelectedShift({ ...selectedShift, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditingShift(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={updateShift}>
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}