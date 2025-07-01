import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface UsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSelect?: (user: SimplifiedUser) => void;
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

interface SimplifiedUser {
  displayName: string;
  profile: string;
  originalData: UserData;
}

export function UsersModal({ open, onOpenChange, onUserSelect }: UsersModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener datos de usuarios desde la API
  const { data: usersData = [], isLoading, error } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  // Simplificar usuarios: máximo 3 por perfil, solo nombre y perfil
  const simplifiedUsers = useMemo(() => {
    if (!usersData.length) return [];
    
    // Filtrar solo usuarios habilitados con perfil válido
    const enabledUsers = usersData.filter(user => 
      user.Enabled === "1" && 
      user.UserProfile && 
      user.UserProfile.trim() !== ""
    );
    
    // Agrupar por perfil
    const usersByProfile: { [key: string]: SimplifiedUser[] } = {};
    enabledUsers.forEach(user => {
      const profile = user.UserProfile;
      if (!usersByProfile[profile]) {
        usersByProfile[profile] = [];
      }
      usersByProfile[profile].push({
        displayName: `${user.Name} ${user.LastName}`.trim(),
        profile: profile,
        originalData: user
      });
    });
    
    // Limitar a máximo 3 usuarios por perfil
    const finalUsers: SimplifiedUser[] = [];
    Object.keys(usersByProfile).forEach(profile => {
      const usersInProfile = usersByProfile[profile].slice(0, 3);
      finalUsers.push(...usersInProfile);
    });
    
    return finalUsers.sort((a, b) => a.profile.localeCompare(b.profile));
  }, [usersData]);

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return simplifiedUsers;
    
    return simplifiedUsers.filter(user =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [simplifiedUsers, searchTerm]);

  // Agrupar usuarios filtrados por perfil para mostrar estadísticas
  const profileStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    filteredUsers.forEach(user => {
      stats[user.profile] = (stats[user.profile] || 0) + 1;
    });
    return stats;
  }, [filteredUsers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seleccionar Usuario
          </DialogTitle>
          <DialogDescription>
            Lista simplificada de usuarios del sistema (máximo 3 por perfil)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estadísticas de perfiles */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(profileStats).map(([profile, count]) => (
              <div key={profile} className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">{profile}</div>
                <div className="text-lg font-bold text-blue-900">{count} usuarios</div>
              </div>
            ))}
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Estado de carga y error */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando usuarios...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Error al cargar los usuarios</p>
              <p className="text-sm text-gray-500 mt-1">
                Verifique la configuración de autenticación
              </p>
            </div>
          )}

          {/* Lista de usuarios simplificada */}
          {!isLoading && !error && (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid gap-2">
                {filteredUsers.map((user, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (onUserSelect) {
                        onUserSelect(user);
                        onOpenChange(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{user.displayName}</h3>
                          <p className="text-sm text-gray-500">{user.profile}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {user.profile.replace('#', '').replace('#', '')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron usuarios que coincidan con "{searchTerm}"</p>
                </div>
              )}
              
              {simplifiedUsers.length === 0 && !isLoading && !error && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay usuarios disponibles</p>
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