import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertTriangle, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TypewriterText from '@/components/TypewriterText';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { toast } from 'sonner';

const UploadDataset = () => {
  const { user, userName } = useAuth();
  const [subject, setSubject] = useState('');
  const [batch, setBatch] = useState('');
  const [batchOptions, setBatchOptions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('batch');
      const set = new Set<string>();
      (data || []).forEach((s: any) => s.batch && set.add(s.batch));
      setBatchOptions(Array.from(set).sort());
    })();
  }, []);
  const [phase, setPhase] = useState<'upload' | 'preview' | 'saved'>('upload');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [errors, setErrors] = useState<number[]>([]);
  const [parseProgress, setParseProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setParseProgress(0);
    const interval = setInterval(() => setParseProgress(p => Math.min(p + 20, 90)), 200);

    // Normalize header: lowercase + strip non-alphanumerics
    const norm = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

    const ENROLL_KEYS = ['enrollmentno', 'enrollmentnumber', 'enrollment', 'enrolno', 'enrolmentno', 'enrolment', 'rollno', 'roll', 'rollnumber', 'studentid', 'sid', 'id', 'regno', 'registrationno', 'registration', 'admissionno'];
    const NAME_KEYS = ['studentname', 'fullname', 'name', 'student', 'sname', 'candidatename'];
    const STATUS_KEYS = ['status', 'attendance', 'present', 'attendancestatus'];

    const pick = (row: Record<string, any>, normMap: Record<string, string>, keys: string[]) => {
      for (const k of keys) {
        const original = normMap[k];
        if (original !== undefined) {
          const v = row[original];
          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
      }
      return '';
    };

    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        clearInterval(interval);
        setParseProgress(100);
        const fields = ((results.meta?.fields as string[]) || []);
        const normMap: Record<string, string> = {};
        fields.forEach(f => { normMap[norm(f)] = f; });

        const mapped = (results.data as any[]).map((row) => {
          const enrollment_no = pick(row, normMap, ENROLL_KEYS);
          const student_name = pick(row, normMap, NAME_KEYS);
          const statusRaw = pick(row, normMap, STATUS_KEYS) || 'present';
          const sl = statusRaw.toLowerCase();
          const status = sl.includes('absent') || sl === 'a' || sl === '0' || sl === 'false' ? 'absent' : 'present';
          return { enrollment_no, student_name, status };
        });
        setCsvData(mapped);
        const errs = mapped.map((r, i) => (!r.enrollment_no || !r.student_name) ? i : -1).filter((i) => i >= 0);
        setErrors(errs);
        setPhase('preview');
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, maxFiles: 1,
  });

  const saveAttendance = async () => {
    if (!user) return;
    setSaving(true);
    const validData = csvData.filter((_, i) => !errors.includes(i));
    const present = validData.filter(r => r.status === 'present').length;
    const absent = validData.filter(r => r.status === 'absent').length;

    // Look up student IDs
    const { data: students } = await supabase.from('students').select('id, enrollment_no');
    const studentMap = new Map((students || []).map(s => [s.enrollment_no, s.id]));

    const { data: session, error } = await supabase.from('attendance_sessions').insert({
      subject, batch, faculty_id: user.id, faculty_name: userName, method: 'iot_dataset' as const,
      total_present: present, total_absent: absent,
    }).select().single();

    if (error || !session) { toast.error('Failed to save'); setSaving(false); return; }

    const records = validData
      .filter(r => studentMap.has(r.enrollment_no))
      .map(r => ({
        session_id: session.id,
        student_id: studentMap.get(r.enrollment_no)!,
        enrollment_no: r.enrollment_no,
        student_name: r.student_name,
        status: r.status as 'present' | 'absent',
      }));

    if (records.length > 0) await supabase.from('attendance_records').insert(records);
    setSaving(false);
    setPhase('saved');
    toast.success(`Attendance saved! ${records.length} records.`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold"><TypewriterText text="Upload Attendance — Dataset Method" /></h1>

      {phase === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-muted/30 mt-1" placeholder="e.g. Operating Systems" />
            </div>
            <div>
              <Label>Batch</Label>
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="bg-muted/30 mt-1"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batchOptions.length === 0 ? (
                    <SelectItem value="__none" disabled>No batches found</SelectItem>
                  ) : batchOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-success bg-success/10 drag-zone-active' : 'border-border hover:border-primary/50'}`}>
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Drop a CSV file here or click to browse</p>
          </div>

          {parseProgress > 0 && parseProgress < 100 && (
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${parseProgress}%` }} transition={{ duration: 0.3 }} />
            </div>
          )}
        </div>
      )}

      {phase === 'preview' && (
        <div className="space-y-4">
          {errors.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{errors.length} rows have missing data and will be skipped</span>
            </div>
          )}

          <Card className="glass-card">
            <CardContent className="p-0 max-h-96 overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Enrollment No.</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {csvData.map((row, i) => (
                    <TableRow key={i} className={errors.includes(i) ? 'bg-destructive/10' : ''}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className={!row.enrollment_no ? 'text-destructive' : 'font-mono'}>{row.enrollment_no || '⚠ Missing'}</TableCell>
                      <TableCell className={!row.student_name ? 'text-destructive' : ''}>{row.student_name || '⚠ Missing'}</TableCell>
                      <TableCell><Badge className={row.status === 'present' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>{row.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setPhase('upload'); setCsvData([]); setErrors([]); }}>Back</Button>
            <Button onClick={saveAttendance} disabled={saving || !subject || !batch} className="btn-shimmer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Attendance ({csvData.length - errors.length} valid records)
            </Button>
          </div>
        </div>
      )}

      {phase === 'saved' && (
        <motion.div className="flex flex-col items-center py-12" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <Check className="h-10 w-10 text-success" />
          </div>
          <p className="text-success font-semibold text-lg">Attendance Saved Successfully!</p>
          <Button variant="outline" className="mt-4" onClick={() => { setPhase('upload'); setCsvData([]); setErrors([]); setSubject(''); setBatch(''); }}>
            Upload Another
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default UploadDataset;
