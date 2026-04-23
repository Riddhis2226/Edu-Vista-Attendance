import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TypewriterText from '@/components/TypewriterText';
import SkeletonTable from '@/components/SkeletonTable';
import EmptyState from '@/components/EmptyState';
import LectureTargetModal, { LectureTarget } from '@/components/admin/LectureTargetModal';
import { toast } from 'sonner';

interface TargetRow extends LectureTarget {
  id: string;
  lectures_held: number;
}

const completionColor = (pct: number) => {
  if (pct > 60) return 'bg-success';
  if (pct >= 30) return 'bg-warning';
  return 'bg-destructive';
};

const LectureTargets: React.FC = () => {
  const [rows, setRows] = useState<TargetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TargetRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [semFilter, setSemFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [subjFilter, setSubjFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [{ data: targets }, { data: sessions }] = await Promise.all([
      supabase.from('lecture_targets' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('attendance_sessions').select('id, subject, faculty_id, date'),
    ]);
    // Compute lectures_held per target via subject + faculty match against sessions
    // Since sessions have no batch/semester, count distinct sessions for the same subject (and same faculty if set)
    const sessionsBySubject = new Map<string, number>();
    (sessions || []).forEach((s: any) => {
      const key = `${s.subject}__${s.faculty_id}`;
      sessionsBySubject.set(key, (sessionsBySubject.get(key) || 0) + 1);
    });

    const list: TargetRow[] = (targets || []).map((t: any) => ({
      ...t,
      lectures_held: sessionsBySubject.get(`${t.subject}__${t.faculty_id}`) || 0,
    }));
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const semesters = useMemo(() => Array.from(new Set(rows.map(r => r.semester))).sort(), [rows]);
  const batches = useMemo(() => Array.from(new Set(rows.map(r => r.batch))).sort(), [rows]);
  const subjects = useMemo(() => Array.from(new Set(rows.map(r => r.subject))).sort(), [rows]);

  const filtered = rows.filter(r =>
    (semFilter === 'all' || r.semester === semFilter) &&
    (batchFilter === 'all' || r.batch === batchFilter) &&
    (subjFilter === 'all' || r.subject === subjFilter) &&
    (!search || `${r.subject} ${r.faculty_name} ${r.batch} ${r.semester}`.toLowerCase().includes(search.toLowerCase()))
  );

  const clearFilters = () => { setSemFilter('all'); setBatchFilter('all'); setSubjFilter('all'); setSearch(''); };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: TargetRow) => { setEditing(r); setModalOpen(true); };

  const doDelete = async (id: string) => {
    const { error } = await supabase.from('lecture_targets' as any).delete().eq('id', id);
    if (error) { toast.error(`Delete failed: ${error.message}`); return; }
    toast.success('Lecture target deleted');
    setConfirmDelete(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold"><TypewriterText text="Lecture Targets" /></h1>
          <p className="text-muted-foreground mt-1 text-sm">Set total planned lectures per subject per batch for the semester.</p>
        </div>
        <Button onClick={openAdd} className="btn-shimmer bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> Add Lecture Target
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={semFilter} onValueChange={setSemFilter}>
          <SelectTrigger className="w-[200px] bg-muted/30"><SelectValue placeholder="Semester" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[220px] bg-muted/30"><SelectValue placeholder="Batch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subjFilter} onValueChange={setSubjFilter}>
          <SelectTrigger className="w-[200px] bg-muted/30"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 bg-muted/30" />
        </div>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><SkeletonTable /></div>
          ) : filtered.length === 0 ? (
            <EmptyState message="No lecture targets configured yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Held</TableHead>
                  <TableHead className="w-[180px]">Completion</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((r, i) => {
                    const pct = r.total_lectures > 0 ? Math.min(100, (r.lectures_held / r.total_lectures) * 100) : 0;
                    return (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border hover:bg-muted/20 hover:shadow-md hover:border-l-4 hover:border-l-primary transition-all"
                      >
                        <TableCell className="font-medium">{r.subject}</TableCell>
                        <TableCell>{r.faculty_name || '—'}</TableCell>
                        <TableCell>{r.batch}</TableCell>
                        <TableCell>{r.semester}</TableCell>
                        <TableCell>{r.total_lectures}</TableCell>
                        <TableCell>{r.lectures_held}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.04 }}
                                className={`h-full ${completionColor(pct)}`}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setConfirmDelete(r.id)}
                              className={confirmDelete === r.id ? 'animate-shake text-destructive' : 'text-destructive'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {confirmDelete === r.id && (
                              <Button size="sm" variant="destructive" onClick={() => doDelete(r.id)}>
                                Confirm
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LectureTargetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        lecturesHeldForEdit={editing?.lectures_held || 0}
        onSaved={load}
      />
    </div>
  );
};

export default LectureTargets;
