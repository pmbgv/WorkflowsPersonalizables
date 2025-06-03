import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Users, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface GroupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupSelect?: (groupName: string, users: UserData[]) => void;
}

interface UserData {
  Id: string;
  Identifier: string;
  Name: string;
  LastName: string;
  Email: string;
  GroupDescription: string;
  PositionDescription: string;
  UserProfile: string;
  Enabled: string;
}

export function GroupsModal({ open, onOpenChange, onGroupSelect }: GroupsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener datos de usuarios desde la API
  const { data: usersData = [], isLoading, error } = useQuery<UserData[]>({
    queryKey: ["/api/users-complete"],
    enabled: open, // Solo hacer la consulta cuando la modal esté abierta
  });

  // Extraer grupos únicos de los datos de usuarios
  const groups = usersData
    .filter(user => user.Enabled === "1" && user.GroupDescription && user.GroupDescription.trim() !== "")
    .reduce((acc: { name: string; userCount: number; users: UserData[] }[], user) => {
      const existingGroup = acc.find(group => group.name === user.GroupDescription);
      if (existingGroup) {
        existingGroup.userCount++;
        existingGroup.users.push(user);
      } else {
        acc.push({
          name: user.GroupDescription,
          userCount: 1,
          users: [user]
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filtrar grupos por término de búsqueda
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = usersData.filter(user => user.Enabled === "1").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Grupos de Trabajo
          </DialogTitle>
          <DialogDescription>
            Lista de todos los grupos de trabajo en la organización
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Grupos</div>
              <div className="text-2xl font-bold text-blue-900">{groups.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Total Usuarios</div>
              <div className="text-2xl font-bold text-green-900">{totalUsers}</div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Estado de carga y error */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando grupos...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Error al cargar los grupos</p>
              <p className="text-sm text-gray-500 mt-1">
                Verifique la configuración de autenticación
              </p>
            </div>
          )}

          {/* Lista de grupos */}
          {!isLoading && !error && (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid gap-3">
                {filteredGroups.map((group, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (onGroupSelect) {
                        onGroupSelect(group.name, group.users);
                        onOpenChange(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500">
                            {group.userCount} usuario{group.userCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {group.userCount}
                      </Badge>
                    </div>
                    
                    {/* Mostrar todos los usuarios del grupo */}
                    <div className="mt-3 space-y-1">
                      {group.users.map((user, userIndex) => (
                        <div key={userIndex} className="text-xs text-gray-600 ml-8">
                          • {user.Name} {user.LastName} - {user.UserProfile || "Sin perfil"}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredGroups.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron grupos que coincidan con "{searchTerm}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}