import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AttendanceRing from './AttendanceRing';
import CountUp from '@/components/CountUp';

export interface SummaryRow {
  student_id: string;
  enrollment_no: string;
  student_name: string;
  subject: string;
  batch: string | null;
  semester: string | null;
  faculty_name: string | null;
  total_lectures: number;
  lectures_held: number;
  lectures_attended: number;
  attendance_percentage: number;
  is_below_threshold: boolean;
  lectures_needed: number;
  lectures_remaining: number;
  can_recover: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: SummaryRow | null;
}

const StudentDetailModal: React.FC<Props> = ({ open, onOpenChange, row }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [studentMeta, setStudentMeta] = useState<{ branch?: string; year?: number } | null>(null);

  useEffect(() => {
    if (!open || !row) { setHistory([]); setShowHistory(false); setStudentMeta(null); return; }
    (async () => {
      const [{ data: records }, { data: student }] = await Promise.all([
        supabase
          .from('attendance_records')
          .select('id, status, session_id, attendance_sessions!inner(subject, date, method, faculty_id)')
          .eq('student_id', row.student_id)
          .eq('attendance_sessions.subject', row.subject)
          .order('created_at', { ascending: true }),
        supabase.from('students').select('branch, year').eq('id', row.student_id).maybeSingle(),
      ]);
      setHistory(records || []);
      setStudentMeta(student || null);
    })();
  }, [open, row]);

  if (!row) return null;

  const pct = row.attendance_percentage;
  const safe = !row.is_below_threshold;
  const buffer = Math.max(0, row.lectures_attended - Math.ceil(0.75 * row.lectures_held));
  const maxReachablePct = row.total_lectures > 0
    ? ((row.lectures_attended + row.lectures_remaining) / row.total_lectures) * 100
    : 0;

  // Recovery bar: total visualized over total_lectures (or held + needed if no target)
  const totalForBar = Math.max(row.total_lectures, row.lectures_held + row.lectures_needed, 1);
  const attendedPct = (row.lectures_attended / totalForBar) * 100;
  const neededPct = (row.lectures_needed / totalForBar) * 100;
  const remainingPct = Math.max(0, 100 - attendedPct - neededPct);
  const thresholdPct = 75;

  // Running attendance for history
  let runningAttended = 0;
  let runningTotal = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card backdrop-blur-xl border-primary/30 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{row.student_name}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {row.enrollment_no}
            {studentMeta?.branch && ` · ${studentMeta.branch}`}
            {studentMeta?.year && ` · Year ${studentMeta.year}`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {row.subject} · {row.batch || '—'} · {row.semester || '—'} {row.faculty_name && `· ${row.faculty_name}`}
          </div>
        </DialogHeader>

        {/* Attendance Summary */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-muted/20">
          <AttendanceRing
            percentage={pct}
            size={120}
            strokeWidth={10}
            centerLabel={<span className="text-2xl">{pct.toFixed(1)}%</span>}
            subLabel="attendance"
          />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-lg font-semibold">
              <span className="text-success"><CountUp end={row.lectures_attended} /></span>
              <span className="text-muted-foreground"> attended out of </span>
              <span className="text-foreground"><CountUp end={row.lectures_held} /></span> lectures held
            </p>
            {row.total_lectures > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {row.total_lectures} total lectures planned this semester
              </p>
            )}
          </div>
        </div>

        {/* Recovery info card */}
        {safe ? (
          <div className="p-4 rounded-xl border border-success/40 bg-success/10 flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-success">Attendance is Safe — No action required.</p>
              <p className="text-sm text-muted-foreground mt-1">
                This student can miss <span className="font-semibold text-foreground">{buffer}</span> more lecture{buffer === 1 ? '' : 's'} and still stay above 75%.
              </p>
            </div>
          </div>
        ) : row.can_recover ? (
          <div className="p-4 rounded-xl border-2 border-warning/50 bg-warning/10 space-y-3">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning">⚠ Attendance Recovery Required</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  Needs <CountUp end={row.lectures_needed} /> more consecutive lecture{row.lectures_needed === 1 ? '' : 's'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  If this student attends the next {row.lectures_needed} lectures without any absence, their attendance will reach 75.0%.
                </p>
              </div>
            </div>

            {/* Mini recovery bar */}
            <div className="relative h-6 rounded-md overflow-hidden bg-muted/40 border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${attendedPct}%` }}
                transition={{ duration: 0.8 }}
                className="absolute left-0 top-0 h-full bg-primary"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${neededPct}%` }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute top-0 h-full stripe-pattern"
                style={{ left: `${attendedPct}%` }}
              />
              <div
                className="absolute top-0 h-full w-px bg-success"
                style={{ left: `${thresholdPct}%` }}
                title="75% threshold"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Attended ({row.lectures_attended})</span>
              <span className="text-success">75% threshold</span>
              <span>Total ({row.total_lectures || row.lectures_held + row.lectures_remaining})</span>
            </div>
            {row.total_lectures > 0 && (
              <p className="text-xs text-muted-foreground">
                Lectures remaining this semester: <span className="font-semibold text-foreground">{row.lectures_remaining}</span> — Recovery is mathematically possible.
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl border-2 border-destructive/60 bg-destructive/10 space-y-2">
            <div className="flex gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">✗ Recovery Not Possible This Semester</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Even attending all {row.lectures_remaining} remaining lecture{row.lectures_remaining === 1 ? '' : 's'}, this student can only reach <span className="font-semibold text-destructive">{maxReachablePct.toFixed(1)}%</span> maximum.
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  ({row.lectures_attended} + {row.lectures_remaining}) / {row.total_lectures} × 100 = {maxReachablePct.toFixed(1)}%
                </p>
                <p className="text-sm mt-2 text-warning">Recommend: Apply for condonation or medical exemption.</p>
              </div>
            </div>
          </div>
        )}

        {/* Session history */}
        <div className="border border-border rounded-xl">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
          >
            <span className="font-medium text-sm">Session-by-Session History ({history.length})</span>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showHistory && (
            <div className="p-3 border-t border-border max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Running %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((r: any) => {
                    runningTotal++;
                    if (r.status === 'present') runningAttended++;
                    const runPct = (runningAttended / runningTotal) * 100;
                    const isAbsent = r.status === 'absent';
                    return (
                      <TableRow
                        key={r.id}
                        className={isAbsent ? 'border-l-2 border-l-destructive' : ''}
                      >
                        <TableCell>{r.attendance_sessions?.date}</TableCell>
                        <TableCell>{r.attendance_sessions?.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {r.attendance_sessions?.method === 'ai_photo' ? '📷' : '📂'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.status === 'present' ? (
                            <span className="text-success">Present ✓</span>
                          ) : (
                            <span className="text-destructive">Absent ✗</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{runPct.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailModal;
