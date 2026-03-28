import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import TypewriterText from '@/components/TypewriterText';
import SkeletonTable from '@/components/SkeletonTable';
import EmptyState from '@/components/EmptyState';
import Papa from 'papaparse';
import { useDropzone } from 'react-dropzone';

interface Student {
  id: string;
  enrollment_no: string;
  full_name: string;
  email: string | null;
  branch: string | null;
  year: number | null;
  face_enrolled: boolean | null;
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Form state
  const [form, setForm] = useState({ enrollment_no: '', full_name: '', email: '', branch: '', year: '' });

  // CSV state
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('students').select('*', { count: 'exact' });
    if (search) query = query.or(`full_name.ilike.%${search}%,enrollment_no.ilike.%${search}%`);
    if (branchFilter !== 'all') query = query.eq('branch', branchFilter);
    if (yearFilter !== 'all') query = query.eq('year', parseInt(yearFilter));
    query = query.range(page * pageSize, (page + 1) * pageSize - 1).order('created_at', { ascending: false });
    const { data, count } = await query;
    setStudents(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [search, branchFilter, yearFilter, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSave = async () => {
    setSaving(true);
    if (editStudent) {
      const { error } = await supabase.from('students').update({
        enrollment_no: form.enrollment_no, full_name: form.full_name,
        email: form.email || null, branch: form.branch || null,
        year: form.year ? parseInt(form.year) : null,
      }).eq('id', editStudent.id);
      if (error) toast.error(error.message); else { toast.success('Student updated'); setEditStudent(null); }
    } else {
      const { error } = await supabase.from('students').insert({
        enrollment_no: form.enrollment_no, full_name: form.full_name,
        email: form.email || null, branch: form.branch || null,
        year: form.year ? parseInt(form.year) : null,
      });
      if (error) toast.error(error.message); else { toast.success('Student added'); setAddOpen(false); }
    }
    setSaving(false);
    setForm({ enrollment_no: '', full_name: '', email: '', branch: '', year: '' });
    fetchStudents();
  };

  const handleDelete = async () => {
    if (!deleteStudent) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    const { error } = await supabase.from('students').delete().eq('id', deleteStudent.id);
    if (error) toast.error(error.message); else toast.success('Student deleted');
    setDeleteStudent(null);
    fetchStudents();
  };

  const onCsvDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => setCsvData(results.data),
    });
  }, []);

  const { getRootProps: csvRootProps, getInputProps: csvInputProps, isDragActive: csvDragActive } = useDropzone({
    onDrop: onCsvDrop, accept: { 'text/csv': ['.csv'] }, maxFiles: 1,
  });

  const handleCsvImport = async () => {
    setCsvUploading(true);
    setCsvProgress(0);
    const rows = csvData.map((r: any) => ({
      enrollment_no: r.enrollment_no || r['Enrollment No'] || r['enrollment_no'],
      full_name: r.full_name || r['Full Name'] || r['Name'] || r['full_name'],
      email: r.email || r['Email'] || null,
      branch: r.branch || r['Branch'] || null,
      year: r.year ? parseInt(r.year) : r['Year'] ? parseInt(r['Year']) : null,
    })).filter((r: any) => r.enrollment_no && r.full_name);

    for (let i = 0; i < rows.length; i++) {
      await supabase.from('students').upsert(rows[i], { onConflict: 'enrollment_no' });
      setCsvProgress(Math.round(((i + 1) / rows.length) * 100));
    }
    toast.success(`${rows.length} students imported`);
    setCsvUploading(false);
    setCsvOpen(false);
    setCsvData([]);
    fetchStudents();
  };

  const openEdit = (s: Student) => {
    setForm({ enrollment_no: s.enrollment_no, full_name: s.full_name, email: s.email || '', branch: s.branch || '', year: s.year?.toString() || '' });
    setEditStudent(s);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold"><TypewriterText text="Student Management" /></h1>
        <div className="flex gap-2">
          <Button onClick={() => { setForm({ enrollment_no: '', full_name: '', email: '', branch: '', year: '' }); setAddOpen(true); }} className="btn-shimmer">
            <Plus className="h-4 w-4 mr-1" /> Add Student
          </Button>
          <Button variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> CSV Upload
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or enrollment no..." className="pl-9 bg-muted/30" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] bg-muted/30"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {['CSE', 'ECE', 'ME', 'CE', 'EE'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[120px] bg-muted/30"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {[1, 2, 3, 4].map(y => <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          {loading ? <div className="p-6"><SkeletonTable /></div> : students.length === 0 ? (
            <EmptyState message="No students found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enrollment No.</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Face</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-border hover:bg-muted/20 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                      >
                        <TableCell className="font-mono text-sm">{s.enrollment_no}</TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell>{s.branch || '—'}</TableCell>
                        <TableCell>{s.year || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{s.email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={s.face_enrolled ? 'default' : 'destructive'} className={s.face_enrolled ? 'bg-success text-success-foreground' : ''}>
                            {s.face_enrolled ? '✓' : '✗'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteStudent(s)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{total} students total</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <span className="text-sm text-muted-foreground flex items-center">Page {page + 1} of {totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={addOpen || !!editStudent} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditStudent(null); } }}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>{editStudent ? 'Edit Student' : 'Add Student'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Enrollment No.</Label><Input value={form.enrollment_no} onChange={e => setForm(f => ({ ...f, enrollment_no: e.target.value }))} className="bg-muted/30" /></div>
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-muted/30" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-muted/30" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Branch</Label><Input value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} className="bg-muted/30" /></div>
              <div><Label>Year</Label><Input type="number" min={1} max={4} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="bg-muted/30" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving || !form.enrollment_no || !form.full_name} className="btn-shimmer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editStudent ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteStudent} onOpenChange={(o) => { if (!o) setDeleteStudent(null); }}>
        <DialogContent className={`glass-card ${shaking ? 'animate-shake' : ''}`}>
          <DialogHeader><DialogTitle>Delete Student</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete <strong>{deleteStudent?.full_name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStudent(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Modal */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent className="glass-card max-w-xl">
          <DialogHeader><DialogTitle>Bulk CSV Upload</DialogTitle></DialogHeader>
          <div {...csvRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${csvDragActive ? 'border-success bg-success/10 drag-zone-active' : 'border-border hover:border-primary/50'}`}>
            <input {...csvInputProps()} />
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Drop a CSV file here or click to browse</p>
          </div>
          {csvData.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">{csvData.length} rows detected</p>
              <div className="max-h-40 overflow-auto rounded border border-border">
                <Table>
                  <TableHeader><TableRow>{Object.keys(csvData[0]).map(k => <TableHead key={k}>{k}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row: any, i: number) => (
                      <TableRow key={i}>{Object.values(row).map((v: any, j) => <TableCell key={j}>{v}</TableCell>)}</TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {csvUploading && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${csvProgress}%` }} transition={{ duration: 0.3 }} />
                </div>
              )}
              <Button onClick={handleCsvImport} disabled={csvUploading} className="w-full btn-shimmer">
                {csvUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importing {csvProgress}%</> : `Import ${csvData.length} Students`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;
