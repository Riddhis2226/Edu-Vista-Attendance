import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export interface LectureTarget {
  id?: string;
  subject: string;
  faculty_id: string;
  faculty_name?: string | null;
  batch: string;
  semester: string;
  total_lectures: number;
}

interface LectureTargetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<LectureTarget> | null;
  onSaved: () => void;
  /** Number of lectures already held for this combo (for warning) */
  lecturesHeldForEdit?: number;
}

const LectureTargetModal: React.FC<LectureTargetModalProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved,
  lecturesHeldForEdit = 0,
}) => {
  const { user } = useAuth();
  const isEdit = !!initial?.id;

  const [subject, setSubject] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [batch, setBatch] = useState('');
  const [semester, setSemester] = useState('');
  const [totalLectures, setTotalLectures] = useState<number>(45);
  const [saving, setSaving] = useState(false);

  const [facultyList, setFacultyList] = useState<Array<{ user_id: string; name: string }>>([]);
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
  const [batchSuggestions, setBatchSuggestions] = useState<string[]>([]);
  const [semesterSuggestions, setSemesterSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSubject(initial?.subject || '');
    setFacultyId(initial?.faculty_id || '');
    setBatch(initial?.batch || '');
    setSemester(initial?.semester || '');
    setTotalLectures(initial?.total_lectures || 45);

    (async () => {
      const [{ data: faculty }, { data: sessions }, { data: targets }, { data: students }] = await Promise.all([
        supabase.from('user_roles').select('user_id, name').eq('role', 'faculty'),
        supabase.from('attendance_sessions').select('subject'),
        supabase.from('lecture_targets' as any).select('subject, batch, semester'),
        supabase.from('students').select('batch, semester'),
      ]);
      setFacultyList(faculty || []);
      const subjSet = new Set<string>();
      (sessions || []).forEach((s: any) => s.subject && subjSet.add(s.subject));
      (targets || []).forEach((t: any) => t.subject && subjSet.add(t.subject));
      setSubjectSuggestions(Array.from(subjSet).sort());

      const batchSet = new Set<string>();
      const semSet = new Set<string>();
      (students || []).forEach((s: any) => {
        if (s.batch) batchSet.add(s.batch);
        if (s.semester) semSet.add(s.semester);
      });
      (targets || []).forEach((t: any) => {
        if (t.batch) batchSet.add(t.batch);
        if (t.semester) semSet.add(t.semester);
      });
      setBatchSuggestions(Array.from(batchSet).sort());
      setSemesterSuggestions(Array.from(semSet).sort());
    })();
  }, [open, initial]);

  const minRequired = useMemo(() => Math.ceil(0.75 * totalLectures), [totalLectures]);
  const reducingBelowHeld = isEdit && totalLectures < lecturesHeldForEdit;

  const adjust = (delta: number) => {
    setTotalLectures((v) => Math.max(1, Math.min(200, v + delta)));
  };

  const save = async () => {
    if (!subject.trim() || !facultyId || !batch.trim() || !semester.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSaving(true);
    const facultyName = facultyList.find((f) => f.user_id === facultyId)?.name || null;

    const payload = {
      subject: subject.trim(),
      faculty_id: facultyId,
      faculty_name: facultyName,
      batch: batch.trim(),
      semester: semester.trim(),
      total_lectures: totalLectures,
      created_by: user?.id || null,
    };

    let error;
    if (isEdit && initial?.id) {
      ({ error } = await supabase.from('lecture_targets' as any).update(payload).eq('id', initial.id));
    } else {
      ({ error } = await supabase.from('lecture_targets' as any).insert(payload));
    }
    setSaving(false);

    if (error) {
      toast.error(error.message.includes('unique') || error.code === '23505'
        ? 'A target for this subject + batch + semester already exists.'
        : `Failed to save: ${error.message}`);
      return;
    }
    toast.success(`Lecture target set — ${payload.subject} · ${payload.batch} · ${totalLectures} lectures`);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card backdrop-blur-xl border-primary/30 max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Lecture Target' : 'Add Lecture Target'}</DialogTitle>
          <DialogDescription>
            Set the total planned lectures for a subject in a given batch and semester.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence>
          {reducingBelowHeld && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 p-3 rounded-lg border border-warning/40 bg-warning/10 text-warning-foreground"
            >
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs">
                Reducing the target below lectures already held ({lecturesHeldForEdit}) may affect student attendance calculations.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              list="subject-suggestions"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Data Structures"
              className="bg-muted/30 mt-1"
            />
            <datalist id="subject-suggestions">
              {subjectSuggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div>
            <Label>Faculty</Label>
            <Select value={facultyId} onValueChange={setFacultyId}>
              <SelectTrigger className="bg-muted/30 mt-1"><SelectValue placeholder="Select faculty" /></SelectTrigger>
              <SelectContent>
                {facultyList.map((f) => (
                  <SelectItem key={f.user_id} value={f.user_id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                list="batch-suggestions"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="CSE 3rd Year — Section A"
                className="bg-muted/30 mt-1"
              />
              <datalist id="batch-suggestions">
                {batchSuggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                list="semester-suggestions"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Semester 5 — 2024-25"
                className="bg-muted/30 mt-1"
              />
              <datalist id="semester-suggestions">
                {semesterSuggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          <div>
            <Label>Total Lectures</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button type="button" size="icon" variant="outline" onClick={() => adjust(-1)} disabled={totalLectures <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={200}
                value={totalLectures}
                onChange={(e) => setTotalLectures(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                className="bg-muted/30 text-center"
              />
              <Button type="button" size="icon" variant="outline" onClick={() => adjust(1)} disabled={totalLectures >= 200}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-primary mt-2">
              Students need to attend at least <span className="font-semibold">{minRequired}</span> lectures to maintain 75% attendance.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="btn-shimmer bg-primary hover:bg-primary/90">
            {saving ? 'Saving…' : isEdit ? 'Update Target' : 'Save Target'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LectureTargetModal;
