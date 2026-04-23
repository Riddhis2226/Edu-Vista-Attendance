import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TypewriterText from '@/components/TypewriterText';
import SkeletonTable from '@/components/SkeletonTable';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

type RecoveryFilter = 'all' | 'safe' | 'at_risk' | 'cannot_recover';

const AttendanceLogs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [recoveryFilter, setRecoveryFilter] = useState<RecoveryFilter>(
    (searchParams.get('recovery') as RecoveryFilter) || 'all'
  );

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from('attendance_sessions').select('*').order('date', { ascending: false });
      if (dateFrom) query = query.gte('date', dateFrom);
      if (dateTo) query = query.lte('date', dateTo);
      if (methodFilter !== 'all') query = query.eq('method', methodFilter as 'ai_photo' | 'iot_dataset');
      const [{ data }, { data: sum }] = await Promise.all([
        query,
        supabase.from('student_attendance_summary' as any).select('*'),
      ]);
      setSessions(data || []);
      setSummary((sum as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, [dateFrom, dateTo, methodFilter]);

  // Build subject -> recovery classification (worst student in that subject's batch)
  const sessionRecoveryStatus = useMemo(() => {
    const map = new Map<string, RecoveryFilter>();
    const bySubject = new Map<string, any[]>();
    summary.forEach((r) => {
      if (!bySubject.has(r.subject)) bySubject.set(r.subject, []);
      bySubject.get(r.subject)!.push(r);
    });
    bySubject.forEach((rows, subject) => {
      const hasCannot = rows.some((r) => r.total_lectures > 0 && r.is_below_threshold && !r.can_recover);
      const hasAtRisk = rows.some((r) => r.is_below_threshold);
      if (hasCannot) map.set(subject, 'cannot_recover');
      else if (hasAtRisk) map.set(subject, 'at_risk');
      else map.set(subject, 'safe');
    });
    return map;
  }, [summary]);

  const visibleSessions = useMemo(() => {
    if (recoveryFilter === 'all') return sessions;
    return sessions.filter((s) => sessionRecoveryStatus.get(s.subject) === recoveryFilter);
  }, [sessions, recoveryFilter, sessionRecoveryStatus]);

  const onRecoveryChange = (v: string) => {
    const val = v as RecoveryFilter;
    setRecoveryFilter(val);
    if (val === 'all') {
      searchParams.delete('recovery');
      setSearchParams(searchParams);
    } else {
      searchParams.set('recovery', val);
      setSearchParams(searchParams);
    }
  };

  const toggleExpand = async (sessionId: string) => {
    if (expanded === sessionId) { setExpanded(null); return; }
    setExpanded(sessionId);
    const { data } = await supabase.from('attendance_records').select('*').eq('session_id', sessionId).order('student_name');
    setRecords(data || []);
  };

  const exportCsv = (session: any) => {
    const filtered = records.filter(r => r.session_id === session.id);
    if (filtered.length === 0) { toast.error('Expand the session first'); return; }
    const summaryByStudent = new Map<string, any>();
    summary.filter((r) => r.subject === session.subject).forEach((r) => {
      summaryByStudent.set(r.enrollment_no, r);
    });
    const header = 'Enrollment No,Student Name,Status,Confidence,Total Lectures,Lectures Held,Attendance %,Lectures Needed,Recovery Possible';
    const csv = [header, ...filtered.map((r: any) => {
      const s = summaryByStudent.get(r.enrollment_no);
      return [
        r.enrollment_no,
        r.student_name,
        r.status,
        r.confidence || '',
        s?.total_lectures ?? '',
        s?.lectures_held ?? '',
        s?.attendance_percentage ?? '',
        s?.lectures_needed ?? '',
        s ? (s.can_recover ? 'yes' : 'no') : '',
      ].join(',');
    })].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_${session.subject}_${session.date}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold"><TypewriterText text="Attendance Logs" /></h1>

      <div className="flex flex-wrap gap-3">
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[160px] bg-muted/30" placeholder="From" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[160px] bg-muted/30" placeholder="To" />
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[160px] bg-muted/30"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="ai_photo">📷 AI Photo</SelectItem>
            <SelectItem value="iot_dataset">📂 IoT Dataset</SelectItem>
          </SelectContent>
        </Select>
        <Select value={recoveryFilter} onValueChange={onRecoveryChange}>
          <SelectTrigger className="w-[180px] bg-muted/30"><SelectValue placeholder="Recovery Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recovery Status</SelectItem>
            <SelectItem value="safe">Safe (≥75%)</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="cannot_recover">Cannot Recover</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? <div className="p-6"><SkeletonTable /></div> : visibleSessions.length === 0 ? <EmptyState message="No attendance sessions found" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSessions.map((s, i) => {
                  const status = sessionRecoveryStatus.get(s.subject);
                  const cannotBg = status === 'cannot_recover' ? 'bg-destructive/5' : '';
                  return (
                  <React.Fragment key={s.id}>
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className={`border-b border-border hover:bg-muted/20 cursor-pointer transition-all ${cannotBg}`} onClick={() => toggleExpand(s.id)}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell className="font-medium">{s.subject}</TableCell>
                      <TableCell>{s.faculty_name || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{s.method === 'ai_photo' ? '📷 AI Photo' : '📂 Dataset'}</Badge></TableCell>
                      <TableCell className="text-success">{s.total_present || 0}</TableCell>
                      <TableCell className="text-destructive">{s.total_absent || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); exportCsv(s); }}><Download className="h-4 w-4" /></Button>
                          {expanded === s.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </TableCell>
                    </motion.tr>
                    {expanded === s.id && (
                      <tr><td colSpan={7} className="p-4 bg-muted/10">
                        <Table>
                          <TableHeader><TableRow>
                            <TableHead>Enrollment No.</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Confidence</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {records.map(r => (
                              <TableRow key={r.id}>
                                <TableCell className="font-mono">{r.enrollment_no}</TableCell>
                                <TableCell>{r.student_name}</TableCell>
                                <TableCell><Badge className={r.status === 'present' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>{r.status}</Badge></TableCell>
                                <TableCell>{r.confidence ? `${(r.confidence * 100).toFixed(1)}%` : '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </td></tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceLogs;
