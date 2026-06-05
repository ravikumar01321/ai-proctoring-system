import { useState } from "react";
import { motion } from "framer-motion";
import { useListUsers, getListUsersQueryKey, useUpdateUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, UserX, UserCheck, Users } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const row = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } };

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
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase mb-1">// Student Registry</div>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage all registered students</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-card border-border/70 focus:border-primary/60"
          data-testid="input-search"
        />
      </motion.div>

      {/* Count */}
      {!isLoading && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xs text-muted-foreground font-mono">
          {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
        </motion.p>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No students found</p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {filtered.map((student) => (
            <motion.div key={student.id} variants={row}>
              <Card className="hover:border-border transition-colors border-border/60" data-testid={`card-student-${student.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">{student.email}</p>
                  </div>
                  <Badge variant="secondary" className={`text-[9px] border ${student.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {student.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <p className="text-xs text-muted-foreground hidden sm:block font-mono">{new Date(student.createdAt).toLocaleDateString()}</p>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(student.id, student.isActive ?? true)}
                      className={`w-8 h-8 ${student.isActive ? "text-destructive/60 hover:text-destructive" : "text-green-400 hover:text-green-300"}`}
                      data-testid={`button-toggle-student-${student.id}`}
                    >
                      {student.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
