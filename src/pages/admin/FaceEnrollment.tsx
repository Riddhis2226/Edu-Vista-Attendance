import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ScanFace, Upload, Camera, Check, Loader2, Search, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import TypewriterText from '@/components/TypewriterText';
import SkeletonTable from '@/components/SkeletonTable';
import EnrollmentStatusPill from '@/components/EnrollmentStatusPill';
import { useDropzone } from 'react-dropzone';
import Webcam from 'react-webcam';

const FaceEnrollment = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [programs, setPrograms] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [mode, setMode] = useState<'upload' | 'camera' | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const webcamRef = React.useRef<Webcam>(null);

  // Load distinct programs & batches once
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('program, batch');
      if (data) {
        setPrograms([...new Set(data.map((d: any) => d.program).filter(Boolean))].sort() as string[]);
        setBatches([...new Set(data.map((d: any) => d.batch).filter(Boolean))].sort() as string[]);
      }
    })();
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('students').select('*').order('full_name');
    if (search) query = query.or(`full_name.ilike.%${search}%,enrollment_no.ilike.%${search}%`);
    if (programFilter !== 'all') query = query.eq('program', programFilter);
    if (batchFilter !== 'all') query = query.eq('batch', batchFilter);
    const { data } = await query;
    setStudents(data || []);
    setLoading(false);
  }, [search, programFilter, batchFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Realtime: live status updates
  useEffect(() => {
    const ch = supabase
      .channel('students-enrollment')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students' }, (payload) => {
        const updated = payload.new as any;
        setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleRemoveFace = async (s: any) => {
    if (!confirm(`Remove face data for ${s.full_name}? This deletes the Luxand person and the stored image.`)) return;
    try {
      const { data, error } = await supabase.functions.invoke('luxand-delete-face', {
        body: { student_id: s.id },
      });
      if (error) throw error;
      if (data?.warning) toast.warning(`Removed locally. Luxand: ${data.warning}`);
      else toast.success('Face removed');
      fetchStudents();
    } catch (e: any) {
      toast.error(e?.message || 'Remove failed');
    }
  };

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setMode('upload');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }, maxFiles: 1, maxSize: 5 * 1024 * 1024,
  });

  const capturePhoto = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setPreview(screenshot);
      // Convert base64 to file
      fetch(screenshot).then(r => r.blob()).then(blob => {
        setFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
      });
    }
  };

  const handleEnroll = async () => {
    if (!selected || !preview) return;
    setEnrolling(true);
    try {
      const { data, error } = await supabase.functions.invoke('luxand-enroll', {
        body: { student_id: selected.id, image_base64: preview },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Enrollment failed');
      setEnrolled(true);
      toast.success('Face enrolled successfully!');
      fetchStudents();
      setTimeout(() => { setSelected(null); setPreview(null); setMode(null); setEnrolled(false); }, 1800);
    } catch (e: any) {
      toast.error(e?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold"><TypewriterText text="Face Enrollment" /></h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9 bg-muted/30" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-[200px] bg-muted/30"><SelectValue placeholder="Program" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[170px] bg-muted/30"><SelectValue placeholder="Batch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        {(programFilter !== 'all' || batchFilter !== 'all' || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setProgramFilter('all'); setBatchFilter('all'); }}>
            Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">{students.length} student{students.length !== 1 ? 's' : ''}</span>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? <div className="p-6"><SkeletonTable /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enrollment No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Face Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-border hover:bg-muted/20 transition-all">
                      <TableCell className="font-mono">{s.enrollment_no}</TableCell>
                      <TableCell>{s.full_name}</TableCell>
                      <TableCell>{s.program || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{s.batch || '—'}</TableCell>
                      <TableCell>
                        <EnrollmentStatusPill
                          status={s.enrollment_status}
                          error={s.enrollment_error}
                          enrolled={s.face_enrolled}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setSelected(s); setMode(null); setPreview(null); setEnrolled(false); }}>
                            {s.enrollment_status === 'failed' ? <><RefreshCw className="h-4 w-4 mr-1" /> Retry</> : <><ScanFace className="h-4 w-4 mr-1" /> {s.face_enrolled ? 'Re-enroll' : 'Enroll'}</>}
                          </Button>
                          {s.face_enrolled && (
                            <Button size="sm" variant="ghost" className="hover:text-destructive" onClick={() => handleRemoveFace(s)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setPreview(null); setMode(null); } }}>
        <DialogContent className="glass-card max-w-lg">
          <DialogHeader>
            <DialogTitle>Enroll Face — {selected?.full_name}</DialogTitle>
          </DialogHeader>

          {enrolled ? (
            <motion.div className="flex flex-col items-center py-8" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <Check className="h-10 w-10 text-success" />
              </div>
              <p className="text-success font-semibold text-lg">Face Enrolled Successfully!</p>
            </motion.div>
          ) : (
            <>
              {!mode && (
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setMode('upload')}>
                    <Upload className="h-8 w-8" /><span>Upload Photo</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setMode('camera')}>
                    <Camera className="h-8 w-8" /><span>Use Camera</span>
                  </Button>
                </div>
              )}

              {mode === 'upload' && !preview && (
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-success bg-success/10' : 'border-border hover:border-primary/50'}`}>
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">Drop image or click to browse (jpg/png/webp, max 5MB)</p>
                </div>
              )}

              {mode === 'camera' && !preview && (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden">
                    <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded-xl" videoConstraints={{ facingMode: 'user' }} />
                  </div>
                  <Button onClick={capturePhoto} className="w-full btn-shimmer"><Camera className="h-4 w-4 mr-2" /> Capture</Button>
                </div>
              )}

              {preview && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-primary/30">
                      <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); setFile(null); }}>Retake</Button>
                    <Button className="flex-1 btn-shimmer" onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enroll Face'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaceEnrollment;
