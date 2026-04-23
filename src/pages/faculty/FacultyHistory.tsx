import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import TypewriterText from '@/components/TypewriterText';
import SkeletonTable from '@/components/SkeletonTable';
import EmptyState from '@/components/EmptyState';

const FacultyHistory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [targetMap, setTargetMap] = useState<Map<string, number>>(new Map()); // subject -> total_lectures
  const [lectureIndex, setLectureIndex] = useState<Map<string, number>>(new Map()); // session_id -> index

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from('attendance_sessions').select('*').eq('faculty_id', user.id).order('date', { ascending: false });
      if (dateFrom) query = query.gte('date', dateFrom);
      if (dateTo) query = query.lte('date', dateTo);
      const [sessionsRes, targetsRes] = await Promise.all([
        query,
        supabase.from('lecture_targets' as any).select('subject, faculty_id, total_lectures').eq('faculty_id', user.id),
      ]);
      const data = sessionsRes.data || [];
      setSessions(data);

      // Build subject -> total_lectures map
      const tMap = new Map<string, number>();
      ((targetsRes.data as any[]) || []).forEach((t: any) => {
        tMap.set(t.subject, t.total_lectures);
      });
      setTargetMap(tMap);

      // Compute lecture index per session within its subject (chronological)
      const bySubject = new Map<string, any[]>();
      [...data].sort((a, b) => a.date.localeCompare(b.date)).forEach((s) => {
        if (!bySubject.has(s.subject)) bySubject.set(s.subject, []);
        bySubject.get(s.subject)!.push(s);
      });
      const idxMap = new Map<string, number>();
      bySubject.forEach((list) => {
        list.forEach((s, i) => idxMap.set(s.id, i + 1));
      });
      setLectureIndex(idxMap);

      setLoading(false);
    };
    fetch();
  }, [user, dateFrom, dateTo]);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    const { data } = await supabase.from('attendance_records').select('*').eq('session_id', id).order('student_name');
    setRecords(data || []);
  };

  const exportCsv = (session: any) => {
    const csv = ['Enrollment No,Name,Status', ...records.filter(r => r.session_id === session.id).map(r => `${r.enrollment_no},${r.student_name},${r.status}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${session.subject}_${session.date}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold"><TypewriterText text="Attendance History" /></h1>

      <div className="flex gap-3">
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[160px] bg-muted/30" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[160px] bg-muted/30" />
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? <div className="p-6"><SkeletonTable /></div> : sessions.length === 0 ? <EmptyState message="No sessions found" /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Subject</TableHead><TableHead>Method</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {sessions.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-border hover:bg-muted/20 cursor-pointer" onClick={() => toggleExpand(s.id)}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{s.date}</span>
                          {(() => {
                            const idx = lectureIndex.get(s.id);
                            const total = targetMap.get(s.subject);
                            if (!idx) return null;
                            return (
                              <Badge variant="outline" className="w-fit text-[10px] text-muted-foreground border-muted-foreground/30">
                                Lecture {idx}{total ? ` of ${total}` : ''}
                              </Badge>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{s.subject}</TableCell>
                      <TableCell><Badge variant="outline">{s.method === 'ai_photo' ? '📷' : '📂'}</Badge></TableCell>
                      <TableCell className="text-success">{s.total_present || 0}</TableCell>
                      <TableCell className="text-destructive">{s.total_absent || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 items-center">
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); exportCsv(s); }}><Download className="h-4 w-4" /></Button>
                          {expanded === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </TableCell>
                    </motion.tr>
                    {expanded === s.id && (
                      <tr><td colSpan={6} className="p-4 bg-muted/10">
                        <Table>
                          <TableHeader><TableRow><TableHead>Enrollment No.</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {records.map(r => (
                              <TableRow key={r.id}>
                                <TableCell className="font-mono">{r.enrollment_no}</TableCell>
                                <TableCell>{r.student_name}</TableCell>
                                <TableCell><Badge className={r.status === 'present' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>{r.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyHistory;
