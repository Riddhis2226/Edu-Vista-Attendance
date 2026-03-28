import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
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

const AttendanceLogs = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from('attendance_sessions').select('*').order('date', { ascending: false });
      if (dateFrom) query = query.gte('date', dateFrom);
      if (dateTo) query = query.lte('date', dateTo);
      if (methodFilter !== 'all') query = query.eq('method', methodFilter as 'ai_photo' | 'iot_dataset');
      const { data } = await query;
      setSessions(data || []);
      setLoading(false);
    };
    fetch();
  }, [dateFrom, dateTo, methodFilter]);

  const toggleExpand = async (sessionId: string) => {
    if (expanded === sessionId) { setExpanded(null); return; }
    setExpanded(sessionId);
    const { data } = await supabase.from('attendance_records').select('*').eq('session_id', sessionId).order('student_name');
    setRecords(data || []);
  };

  const exportCsv = (session: any) => {
    const filtered = records.filter(r => r.session_id === session.id);
    if (filtered.length === 0) { toast.error('Expand the session first'); return; }
    const csv = ['Enrollment No,Student Name,Status,Confidence', ...filtered.map((r: any) => `${r.enrollment_no},${r.student_name},${r.status},${r.confidence || ''}`),].join('\n');
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
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? <div className="p-6"><SkeletonTable /></div> : sessions.length === 0 ? <EmptyState message="No attendance sessions found" /> : (
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
                {sessions.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-border hover:bg-muted/20 cursor-pointer transition-all" onClick={() => toggleExpand(s.id)}>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceLogs;
