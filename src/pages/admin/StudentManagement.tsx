import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import TypewriterText from '@/components/TypewriterText';
import SkeletonTable from '@/components/SkeletonTable';
import EmptyState from '@/components/EmptyState';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';

interface Student {
  id: string;
  enrollment_no: string;
  full_name: string;
  email: string | null;
  branch: string | null;
  year: number | null;
  program: string | null;
  semester: string | null;
  section: string | null;
  school_institute: string | null;
  batch: string | null;
  face_enrolled: boolean | null;
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Dynamic filter options from DB
  const [programs, setPrograms] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Form state
  const [form, setForm] = useState({ enrollment_no: '', full_name: '', email: '', program: '', semester: '', section: '', school_institute: '', batch: '' });

  // CSV state
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);

  const fetchFilterOptions = useCallback(async () => {
    const { data } = await supabase.from('students').select('program, section, batch');
    if (data) {
      const uniquePrograms = [...new Set(data.map(s => s.program).filter(Boolean))] as string[];
      const uniqueSections = [...new Set(data.map(s => s.section).filter(Boolean))] as string[];
      const uniqueBatches = [...new Set(data.map(s => s.batch).filter(Boolean))] as string[];
      setPrograms(uniquePrograms.sort());
      setSections(uniqueSections.sort());
      setBatches(uniqueBatches.sort());
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('students').select('*', { count: 'exact' });
    if (search) query = query.or(`full_name.ilike.%${search}%,enrollment_no.ilike.%${search}%`);
    if (programFilter !== 'all') query = query.eq('program', programFilter);
    if (sectionFilter !== 'all') query = query.eq('section', sectionFilter);
    if (batchFilter !== 'all') query = query.eq('batch', batchFilter);
    query = query.range(page * pageSize, (page + 1) * pageSize - 1).order('created_at', { ascending: false });
    const { data, count } = await query;
    setStudents(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [search, programFilter, sectionFilter, batchFilter, page]);

  useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      enrollment_no: form.enrollment_no,
      full_name: form.full_name,
      email: form.email || null,
      program: form.program || null,
      semester: form.semester || null,
      section: form.section || null,
      school_institute: form.school_institute || null,
      batch: form.batch || null,
    };
    if (editStudent) {
      const { error } = await supabase.from('students').update(payload).eq('id', editStudent.id);
      if (error) toast.error(error.message); else { toast.success('Student updated'); setEditStudent(null); }
    } else {
      const { error } = await supabase.from('students').insert(payload);
      if (error) toast.error(error.message); else { toast.success('Student added'); setAddOpen(false); }
    }
    setSaving(false);
    setForm({ enrollment_no: '', full_name: '', email: '', program: '', semester: '', section: '', school_institute: '', batch: '' });
    fetchStudents();
    fetchFilterOptions();
  };

  const handleDelete = async () => {
    if (!deleteStudent) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    const { error } = await supabase.from('students').delete().eq('id', deleteStudent.id);
    if (error) toast.error(error.message); else toast.success('Student deleted');
    setDeleteStudent(null);
    fetchStudents();
    fetchFilterOptions();
  };

  const TARGET_FIELDS = ['enrollment_no', 'full_name', 'program', 'semester', 'section', 'school_institute', 'batch'] as const;

  const FIELD_LABELS: Record<string, string> = {
    enrollment_no: 'Enrollment No',
    full_name: 'Name',
    program: 'Program',
    semester: 'Semester',
    section: 'Section',
    school_institute: 'School/Institute',
    batch: 'Batch',
  };

  const autoDetectColumn = (col: string): string => {
    const c = col.toLowerCase().trim();
    if (c.includes('enrollment') || c.includes('enroll') || c === 'eno' || c === 'roll') return 'enrollment_no';
    if (c === 'name' || c === 'full name' || c === 'student name' || c === 'full_name') return 'full_name';
    if (c === 'program' || c === 'programme' || c === 'course') return 'program';
    if (c === 'semester' || c === 'sem') return 'semester';
    if (c === 'section' || c === 'sec') return 'section';
    if (c.includes('school') || c.includes('institute') || c === 'college') return 'school_institute';
    if (c === 'batch' || c === 'year' || c === 'intake') return 'batch';
    return '';
  };

  const onFileLoaded = (data: any[]) => {
    if (data.length === 0) {
      toast.error('No data found in file');
      return;
    }
    const cols = Object.keys(data[0]);
    setCsvColumns(cols);
    setCsvData(data);

    // Auto-detect column mapping
    const map: Record<string, string> = {};
    cols.forEach(col => {
      const detected = autoDetectColumn(col);
      if (detected && !Object.values(map).includes(detected)) {
        map[col] = detected;
      }
    });
    setColumnMap(map);
  };

  const parseFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        transform: (value) => value.replace(/\r/g, '').trim(),
        transformHeader: (header) => header.replace(/\r/g, '').trim(),
        complete: (results) => onFileLoaded(results.data),
        error: () => toast.error('Failed to parse CSV file'),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          onFileLoaded(data);
        } catch {
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Unsupported file format. Use CSV or Excel.');
    }
  }, []);

  const onCsvDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    parseFile(file);
  }, [parseFile]);

  const { getRootProps: csvRootProps, getInputProps: csvInputProps, isDragActive: csvDragActive } = useDropzone({
    onDrop: onCsvDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const getReversedMap = () => {
    const reversed: Record<string, string> = {};
    Object.entries(columnMap).forEach(([fileCol, field]) => {
      if (field) reversed[field] = fileCol;
    });
    return reversed;
  };

  const handleCsvImport = async () => {
    const reversed = getReversedMap();
    if (!reversed.enrollment_no || !reversed.full_name) {
      toast.error('Please map at least "Enrollment No" and "Name" columns');
      return;
    }

    setCsvUploading(true);
    setCsvProgress(0);

    const parsedRows = csvData.map(r => ({
      enrollment_no: (r[reversed.enrollment_no] || '').toString().trim(),
      full_name: (r[reversed.full_name] || '').toString().trim(),
      program: reversed.program ? (r[reversed.program] || '').toString().trim() || null : null,
      semester: reversed.semester ? (r[reversed.semester] || '').toString().trim() || null : null,
      section: reversed.section ? (r[reversed.section] || '').toString().trim() || null : null,
      school_institute: reversed.school_institute ? (r[reversed.school_institute] || '').toString().trim() || null : null,
      batch: reversed.batch ? (r[reversed.batch] || '').toString().trim() || null : null,
    })).filter(r => r.enrollment_no && r.full_name);

    if (parsedRows.length === 0) {
      toast.error('No valid rows found after mapping. Check your column selections.');
      setCsvUploading(false);
      return;
    }

    const uniqueRows = new Map<string, (typeof parsedRows)[number]>();
    let duplicateCount = 0;

    parsedRows.forEach((row) => {
      if (uniqueRows.has(row.enrollment_no)) {
        duplicateCount += 1;
        return;
      }
      uniqueRows.set(row.enrollment_no, row);
    });

    const rows = Array.from(uniqueRows.values());
    let imported = 0;
    let errors = 0;
    let lastErrorMessage = '';
    const batchSize = 50;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from('students').upsert(batch, { onConflict: 'enrollment_no' });
      if (error) {
        errors += batch.length;
        lastErrorMessage = error.message;
        console.error('Batch import error:', error.message);
      } else {
        imported += batch.length;
      }
      setCsvProgress(Math.round(((i + batch.length) / rows.length) * 100));
    }

    if (errors > 0) {
      toast.warning(`Imported ${imported} unique students. ${duplicateCount > 0 ? `${duplicateCount} duplicate rows were skipped. ` : ''}${errors} rows had errors.${lastErrorMessage ? ` ${lastErrorMessage}` : ''}`);
    } else if (duplicateCount > 0) {
      toast.success(`${imported} unique students imported successfully. ${duplicateCount} duplicate rows were skipped because enrollment numbers must be unique.`);
    } else {
      toast.success(`${imported} students imported successfully!`);
    }
    setCsvUploading(false);
    setCsvOpen(false);
    setCsvData([]);
    setCsvColumns([]);
    setColumnMap({});
    fetchStudents();
    fetchFilterOptions();
  };

  const openEdit = (s: Student) => {
    setForm({
      enrollment_no: s.enrollment_no,
      full_name: s.full_name,
      email: s.email || '',
      program: s.program || '',
      semester: s.semester || '',
      section: s.section || '',
      school_institute: s.school_institute || '',
      batch: s.batch || '',
    });
    setEditStudent(s);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold"><TypewriterText text="Student Management" /></h1>
        <div className="flex gap-2">
          <Button onClick={() => { setForm({ enrollment_no: '', full_name: '', email: '', program: '', semester: '', section: '', school_institute: '', batch: '' }); setAddOpen(true); }} className="btn-shimmer">
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
        {programs.length > 0 && (
          <Select value={programFilter} onValueChange={(v) => { setProgramFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px] bg-muted/30"><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {sections.length > 0 && (
          <Select value={sectionFilter} onValueChange={(v) => { setSectionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[130px] bg-muted/30"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {batches.length > 0 && (
          <Select value={batchFilter} onValueChange={(v) => { setBatchFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[130px] bg-muted/30"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
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
                      <TableHead>Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Batch</TableHead>
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
                        <TableCell>{s.program || '—'}</TableCell>
                        <TableCell>{s.semester || '—'}</TableCell>
                        <TableCell>{s.section || '—'}</TableCell>
                        <TableCell>{s.batch || '—'}</TableCell>
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
              <div><Label>Program</Label><Input value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} className="bg-muted/30" placeholder="e.g. B.Tech" /></div>
              <div><Label>Semester</Label><Input value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} className="bg-muted/30" placeholder="e.g. 4" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Section</Label><Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className="bg-muted/30" placeholder="e.g. A" /></div>
              <div><Label>Batch</Label><Input value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} className="bg-muted/30" placeholder="e.g. 2023-27" /></div>
            </div>
            <div><Label>School/Institute</Label><Input value={form.school_institute} onChange={e => setForm(f => ({ ...f, school_institute: e.target.value }))} className="bg-muted/30" /></div>
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

      {/* File Upload Modal */}
      <Dialog open={csvOpen} onOpenChange={(o) => { setCsvOpen(o); if (!o) { setCsvData([]); setCsvColumns([]); setColumnMap({}); } }}>
        <DialogContent className="glass-card max-w-2xl">
          <DialogHeader><DialogTitle>Bulk Student Upload</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Supports <strong>CSV</strong> and <strong>Excel (.xlsx/.xls)</strong> files.</p>

          {csvData.length === 0 ? (
            <div {...csvRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${csvDragActive ? 'border-success bg-success/10 drag-zone-active' : 'border-border hover:border-primary/50'}`}>
              <input {...csvInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Drop a CSV or Excel file here, or click to browse</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{csvData.length} rows detected. Map your file columns below:</p>

              {/* Column Mapping */}
              <div className="grid grid-cols-2 gap-3">
                {TARGET_FIELDS.map(field => {
                  const currentFileCol = Object.entries(columnMap).find(([, f]) => f === field)?.[0] || '';
                  return (
                    <div key={field} className="flex items-center gap-2">
                      <Label className="text-xs w-28 shrink-0">
                        {FIELD_LABELS[field]}
                        {(field === 'enrollment_no' || field === 'full_name') && <span className="text-destructive ml-0.5">*</span>}
                      </Label>
                      <Select
                        value={currentFileCol || '__none__'}
                        onValueChange={(v) => {
                          setColumnMap(prev => {
                            const next = { ...prev };
                            // Remove previous mapping for this field
                            Object.keys(next).forEach(k => { if (next[k] === field) delete next[k]; });
                            if (v !== '__none__') next[v] = field;
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger className="bg-muted/30 h-8 text-xs">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Skip —</SelectItem>
                          {csvColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="max-h-36 overflow-auto rounded border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvColumns.map(k => (
                        <TableHead key={k} className="text-xs">
                          {k}
                          {columnMap[k] && <span className="block text-[10px] text-primary font-normal">→ {FIELD_LABELS[columnMap[k]]}</span>}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 3).map((row: any, i: number) => (
                      <TableRow key={i}>{csvColumns.map((col) => <TableCell key={col} className="text-xs">{row[col]}</TableCell>)}</TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {csvUploading && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${csvProgress}%` }} transition={{ duration: 0.3 }} />
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setCsvData([]); setCsvColumns([]); setColumnMap({}); }} className="flex-1">
                  Re-upload
                </Button>
                <Button
                  onClick={handleCsvImport}
                  disabled={csvUploading || !Object.values(columnMap).includes('enrollment_no') || !Object.values(columnMap).includes('full_name')}
                  className="flex-1 btn-shimmer"
                >
                  {csvUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importing {csvProgress}%</> : `Import ${csvData.length} Students`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;
