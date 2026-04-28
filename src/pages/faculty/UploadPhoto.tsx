import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TypewriterText from '@/components/TypewriterText';
import StepProgress from '@/components/StepProgress';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

type StepStatus = 'pending' | 'active' | 'done';

const UploadPhoto = () => {
  const { user, userName } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
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
  const [phase, setPhase] = useState<'upload' | 'processing' | 'results'>('upload');
  const [steps, setSteps] = useState<{ label: string; status: StepStatus }[]>([
    { label: 'Uploading Photos', status: 'pending' },
    { label: 'Sending to Face Recognition Engine', status: 'pending' },
    { label: 'Detecting Faces', status: 'pending' },
    { label: 'Matching Students', status: 'pending' },
    { label: 'Generating Report', status: 'pending' },
  ]);
  const [results, setResults] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted]);
    setPreviews(prev => [...prev, ...accepted.map(f => URL.createObjectURL(f))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp'] }, multiple: true,
  });

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, status: StepStatus) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status } : s));
  };

  const fileToBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(f);
  });

  const startRecognition = async () => {
    if (files.length === 0 || !subject || !batch) return;
    setPhase('processing');
    try {
      updateStep(0, 'active');
      const images = await Promise.all(files.map(fileToBase64));
      updateStep(0, 'done');

      updateStep(1, 'active');
      const { data, error } = await supabase.functions.invoke('luxand-recognize', {
        body: { batch, images },
      });
      updateStep(1, 'done');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Recognition failed');

      updateStep(2, 'done');
      updateStep(3, 'done');
      updateStep(4, 'done');

      if (data.enrolled_count === 0) {
        toast.warning('No students in this batch have enrolled faces yet.');
      } else {
        toast.success(`Matched ${data.matched_count} of ${data.enrolled_count} enrolled students.`);
      }
      setResults(data.results || []);
      setPhase('results');
    } catch (e: any) {
      toast.error(e?.message || 'Recognition failed');
      setPhase('upload');
      setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    }
  };

  const saveAttendance = async () => {
    if (!user) return;
    const present = results.filter(r => r.status === 'present').length;
    const absent = results.filter(r => r.status === 'absent').length;

    const { data: session, error: sessErr } = await supabase.from('attendance_sessions').insert({
      subject, batch, faculty_id: user.id, faculty_name: userName, method: 'ai_photo' as const,
      total_present: present, total_absent: absent,
    }).select().single();

    if (sessErr || !session) { toast.error('Failed to save session'); return; }

    const records = results.map(r => ({
      session_id: session.id, student_id: r.student_id, enrollment_no: r.enrollment_no,
      student_name: r.student_name, status: r.status as 'present' | 'absent', confidence: r.confidence,
    }));

    await supabase.from('attendance_records').insert(records);
    setSaved(true);
    toast.success('Attendance saved!');
  };

  const presentCount = results.filter(r => r.status === 'present').length;
  const absentCount = results.filter(r => r.status === 'absent').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold"><TypewriterText text="Upload Attendance — Photo Method" /></h1>

      {phase === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-muted/30 mt-1" placeholder="e.g. Data Structures" />
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
            <p className="text-muted-foreground">Drop classroom photos here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, BMP accepted</p>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {previews.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
                  <img src={p} alt="" className="h-24 w-full object-cover rounded-lg" />
                  <button onClick={() => removeFile(i)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          <Button onClick={startRecognition} disabled={files.length === 0 || !subject || !batch} className="btn-shimmer" size="lg">
            Start Recognition
          </Button>
        </div>
      )}

      {phase === 'processing' && (
        <Card className="glass-card">
          <CardContent className="p-8">
            <StepProgress steps={steps} />
          </CardContent>
        </Card>
      )}

      {phase === 'results' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Badge className="bg-success/20 text-success text-base px-4 py-1">{presentCount} Present</Badge>
            <Badge className="bg-destructive/20 text-destructive text-base px-4 py-1">{absentCount} Absent</Badge>
          </div>

          <Card className="glass-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enrollment No.</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <motion.tr key={r.enrollment_no} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="border-b border-border">
                      <TableCell className="font-mono">{r.enrollment_no}</TableCell>
                      <TableCell>{r.student_name}</TableCell>
                      <TableCell><Badge className={r.status === 'present' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>{r.status === 'present' ? '✓ Present' : '✗ Absent'}</Badge></TableCell>
                      <TableCell>{r.confidence ? `${(r.confidence * 100).toFixed(1)}%` : '—'}</TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {!saved ? (
            <Button onClick={saveAttendance} className="btn-shimmer" size="lg">Save Attendance</Button>
          ) : (
            <p className="text-success font-medium">✓ Attendance saved successfully!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadPhoto;
