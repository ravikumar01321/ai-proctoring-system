import { useState } from "react";
import { useListUsers, getListUsersQueryKey, useUpdateUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, UserX, UserCheck, Users } from "lucide-react";

export default function Students() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading } = useListUsers({ role: "student" }, { query: { queryKey: getListUsersQueryKey({ role: "student" }) } });
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = (students ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = (id: number, currentStatus: boolean) => {
    updateUser.mutate({ id, data: { isActive: !currentStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "student" }) });
        toast({ title: currentStatus ? "Student deactivated" : "Student activated" });
      },
    });
  };

  return (
    <div className="space-y-6" data-testid="students-page">
      <div>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage all registered students</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No students found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((student) => (
            <Card key={student.id} data-testid={`card-student-${student.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {student.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                </div>
                <Badge variant="secondary" className={student.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
                <p className="text-xs text-muted-foreground hidden sm:block">{new Date(student.createdAt).toLocaleDateString()}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleActive(student.id, student.isActive ?? true)}
                  className={student.isActive ? "text-destructive hover:text-destructive" : "text-green-400 hover:text-green-300"}
                  data-testid={`button-toggle-student-${student.id}`}
                >
                  {student.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
