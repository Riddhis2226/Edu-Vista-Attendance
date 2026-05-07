import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { History, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TypewriterText from '@/components/TypewriterText';
import SkeletonTable from '@/components/SkeletonTable';
import EmptyState from '@/components/EmptyState';

interface Row {
  id: string;
  created_at: string;
  action: string;
  student_name: string | null;
  enrollment_no: string | null;
  admin_name: string | null;
  luxand_person_uuid: string | null;
  error_message: string | null;
}

const actionBadge = (a: string) => {
  if (a === 'enroll') return <Badge className="bg-success/15 text-success border border-success/30">Enrolled</Badge>;
  if (a === 'remove') return <Badge className="bg-secondary/20 text-secondary border border-secondary/30">Removed</Badge>;
  if (a === 'enroll_failed') return <Badge className="bg-destructive/15 text-destructive border border-destructive/30">Enroll failed</Badge>;
  if (a === 'remove_failed') return <Badge className="bg-destructive/15 text-destructive border border-destructive/30">Remove failed</Badge>;
  return <Badge variant="outline">{a}</Badge>;
};

const AuditLog = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('face_audit_log').select('*', { count: 'exact' });
    if (search) q = q.or(`student_name.ilike.%${search}%,enrollment_no.ilike.%${search}%,admin_name.ilike.%${search}%`);
    if (actionFilter !== 'all') q = q.eq('action', actionFilter);
    q = q.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, count } = await q;
    setRows((data as Row[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [search, actionFilter, page]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // Realtime: prepend new rows
  useEffect(() => {
    const channel = supabase
      .channel('face-audit')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'face_audit_log' }, (payload) => {
        if (page === 0) {
          setRows((prev) => [payload.new as Row, ...prev].slice(0, pageSize));
          setTotal((t) => t + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold"><TypewriterText text="Audit Log" /></h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student, enrollment, admin..."
            className="pl-9 bg-muted/30"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[170px] bg-muted/30"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="enroll">Enrolled</SelectItem>
            <SelectItem value="remove">Removed</SelectItem>
            <SelectItem value="enroll_failed">Enroll failed</SelectItem>
            <SelectItem value="remove_failed">Remove failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchRows()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><SkeletonTable /></div>
          ) : rows.length === 0 ? (
            <EmptyState message="No audit events yet" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Person UUID</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border hover:bg-muted/20">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                        <TableCell>{actionBadge(r.action)}</TableCell>
                        <TableCell>{r.student_name || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{r.enrollment_no || '—'}</TableCell>
                        <TableCell>{r.admin_name || '—'}</TableCell>
                        <TableCell className="font-mono text-[10px] max-w-[160px] truncate" title={r.luxand_person_uuid || ''}>{r.luxand_person_uuid || '—'}</TableCell>
                        <TableCell className="text-xs text-destructive max-w-[260px] truncate" title={r.error_message || ''}>{r.error_message || '—'}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{total} events</span>
                <div className="flex gap-2 items-center">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                  <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
