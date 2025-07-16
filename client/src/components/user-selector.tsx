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

  // Mostrar todos los usuarios del grupo
  const allUsers = users;

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    const user = allUsers.find(u => u.Id === userId);
    if (user && onUserSelect) {
      onUserSelect(user);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <User className="h-5 w-5 color-lightblue2 flex-shrink-0" />
      {selectedGroup && (
        <Select value={selectedUser} onValueChange={handleUserSelect}>
          <SelectTrigger className="w-64 h-8 text-xs border border-gray-200 bg-white rounded-md">
            <SelectValue placeholder="Seleccionar usuario" />
          </SelectTrigger>
          <SelectContent>
            {allUsers.map((user) => (
              <SelectItem key={user.Id} value={user.Id}>
                <div className="flex flex-col text-left">
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
  );
}