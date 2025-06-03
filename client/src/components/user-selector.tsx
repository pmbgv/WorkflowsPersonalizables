import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

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

interface UserSelectorProps {
  users: UserData[];
  selectedGroup: string;
  onUserSelect?: (user: UserData) => void;
}

export function UserSelector({ users, selectedGroup, onUserSelect }: UserSelectorProps) {
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Obtener UserProfiles únicos del grupo, si hay duplicados tomar el primero
  const uniqueUserProfiles = users.reduce((acc: UserData[], user) => {
    const existingProfile = acc.find(u => u.UserProfile === user.UserProfile);
    if (!existingProfile) {
      acc.push(user);
    }
    return acc;
  }, []);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    const user = uniqueUserProfiles.find(u => u.Id === userId);
    if (user && onUserSelect) {
      onUserSelect(user);
    }
  };

  return (
    <div className="info-buttons user">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 color-lightblue2" />
        {selectedGroup && (
          <Select value={selectedUser} onValueChange={handleUserSelect}>
            <SelectTrigger className="w-48 h-8 text-xs border-none shadow-none bg-transparent">
              <SelectValue placeholder="Seleccionar usuario" />
            </SelectTrigger>
            <SelectContent>
              {uniqueUserProfiles.map((user) => (
                <SelectItem key={user.Id} value={user.Id}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user.Name} {user.LastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user.UserProfile}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!selectedGroup && (
          <span className="text-xs text-gray-500">
            Selecciona un grupo primero
          </span>
        )}
      </div>
    </div>
  );
}