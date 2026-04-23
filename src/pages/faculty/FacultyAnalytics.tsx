import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TypewriterText from '@/components/TypewriterText';
import EmptyState from '@/components/EmptyState';
import StudentDetailModal, { SummaryRow } from '@/components/faculty/StudentDetailModal';
import CountUp from '@/components/CountUp';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const FacultyAnalytics = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [subjFilter, setSubjFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [sortKey, setSortKey] = useState<keyof SummaryRow>('attendance_percentage');
  const [sortAsc, setSortAsc] = useState(true);
  const [detailRow, setDetailRow] = useState<SummaryRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id, subject')
        .eq('faculty_id', user.id);

      const subjectsForFaculty = Array.from(new Set((sessions || []).map((s: any) => s.subject)));

      const { data: rows } = await supabase
        .from('student_attendance_summary' as any)
        .select('*');

      const filteredRows = ((rows as any[]) || []).filter((r: any) =>
        subjectsForFaculty.includes(r.subject)
      ) as SummaryRow[];
      setSummary(filteredRows);

      // Subject-wise aggregate (kept from old chart)
      const subjMap = new Map<string, { att: number; held: number }>();
      filteredRows.forEach((r) => {
        const cur = subjMap.get(r.subject) || { att: 0, held: 0 };
        cur.att += r.lectures_attended;
        cur.held += r.lectures_held;
        subjMap.set(r.subject, cur);
      });
      setSubjectStats(
        Array.from(subjMap.entries()).map(([subject, s]) => ({
          subject,
          attendance: s.held > 0 ? Math.round((s.att / s.held) * 100) : 0,
        }))
      );
      setLoading(false);
    })();
  }, [user]);

  const subjects = useMemo(() => Array.from(new Set(summary.map((r) => r.subject))).sort(), [summary]);
  const batches = useMemo(() => Array.from(new Set(summary.map((r) => r.batch).filter(Boolean))) as string[], [summary]);

  const filtered = useMemo(() => {
    let list = summary.filter(
      (r) =>
        (subjFilter === 'all' || r.subject === subjFilter) &&
        (batchFilter === 'all' || r.batch === batchFilter) &&
        (!atRiskOnly || r.attendance_percentage < 75)
    );
    list = [...list].sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [summary, subjFilter, batchFilter, atRiskOnly, sortKey, sortAsc]);

  const counts = useMemo(() => {
    let safe = 0, atRisk = 0, cannot = 0, noTarget = 0;
    filtered.forEach((r) => {
      if (r.total_lectures == null) { noTarget++; return; }
      if (!r.is_below_threshold) safe++;
      else if (r.can_recover) atRisk++;
      else cannot++;
    });
    return { safe, atRisk, cannot, noTarget };
  }, [filtered]);

  const toggleSort = (key: keyof SummaryRow) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const openDetail = (row: SummaryRow) => { setDetailRow(row); setModalOpen(true); };

  const pctPill = (pct: number) => {
    if (pct >= 75) return <Badge className="bg-success text-success-foreground">{pct.toFixed(1)}% ✓ Safe</Badge>;
    if (pct >= 60) return <Badge className="bg-warning text-warning-foreground">{pct.toFixed(1)}% ⚠ At Risk</Badge>;
    return <Badge className="bg-destructive text-destructive-foreground">{pct.toFixed(1)}% ✗ Critical</Badge>;
  };

  const statusLabel = (r: SummaryRow) => {
    if (r.total_lectures == null) return <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> No Target</span>;
    if (!r.is_below_threshold) return <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Safe</span>;
    if (r.can_recover) return <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> At Risk</span>;
    return <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Critical</span>;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold"><TypewriterText text="Analytics" /></h1>

        {/* Recovery Tracker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Attendance Recovery Tracker</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Students who need to attend more lectures to reach 75% attendance.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={subjFilter} onValueChange={setSubjFilter}>
                  <SelectTrigger className="w-[180px] bg-muted/30"><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger className="w-[180px] bg-muted/30"><SelectValue placeholder="Batch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch checked={atRiskOnly} onCheckedChange={setAtRiskOnly} id="atrisk" />
                  <label htmlFor="atrisk" className="text-sm cursor-pointer">At-Risk Only (&lt;75%)</label>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 skeleton-shimmer rounded" />)}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState message="No student attendance data yet for these filters." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort('student_name')}>
                          Student <ArrowUpDown className="inline h-3 w-3" />
                        </TableHead>
                        <TableHead>Enrollment</TableHead>
                        <TableHead>Attended / Held</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort('attendance_percentage')}>
                          Attendance <ArrowUpDown className="inline h-3 w-3" />
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort('lectures_needed')}>
                          Lectures Needed <ArrowUpDown className="inline h-3 w-3" />
                        </TableHead>
                        <TableHead>Recovery</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r, i) => {
                        const noTarget = r.total_lectures == null;
                        const cannot = !noTarget && r.is_below_threshold && !r.can_recover;
                        return (
                          <motion.tr
                            key={`${r.student_id}-${r.subject}`}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className={`border-b border-border hover:bg-muted/20 ${cannot ? 'bg-destructive/5' : ''}`}
                          >
                            <TableCell className="font-medium">{r.student_name}</TableCell>
                            <TableCell className="font-mono text-xs">{r.enrollment_no}</TableCell>
                            <TableCell>{r.lectures_attended} / {r.lectures_held}</TableCell>
                            <TableCell>
                              <motion.div
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 0.6 }}
                              >
                                {pctPill(r.attendance_percentage)}
                              </motion.div>
                            </TableCell>
                            <TableCell>{statusLabel(r)}</TableCell>
                            <TableCell>
                              {noTarget ? (
                                <Badge variant="outline" className="text-muted-foreground">Target not set</Badge>
                              ) : r.lectures_needed === 0 ? (
                                <Badge className="bg-success/20 text-success border border-success/40">On Track ✓</Badge>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="px-2 py-1 rounded bg-primary/15 text-primary font-semibold text-sm">
                                      Needs <CountUp end={r.lectures_needed ?? 0} duration={800} /> more
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Must attend next {r.lectures_needed} consecutive lectures without a single absence to reach 75%
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>
                              {noTarget ? (
                                <Badge variant="outline" className="text-muted-foreground">Target not set</Badge>
                              ) : !r.is_below_threshold ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : r.can_recover ? (
                                <Badge className="bg-success/20 text-success border border-success/40">✓ Can Recover</Badge>
                              ) : (
                                <Badge className="bg-destructive/20 text-destructive border border-destructive/40 cannot-recover-glow">
                                  ✗ Cannot Recover
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" onClick={() => openDetail(r)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="flex flex-wrap gap-4 pt-2 border-t border-border text-sm">
                    <span className="text-success font-semibold">{counts.safe} safe</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-warning font-semibold">{counts.atRisk} at risk</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-destructive font-semibold">{counts.cannot} cannot recover</span>
                    {counts.noTarget > 0 && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground font-semibold">{counts.noTarget} no target</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Subject bar chart */}
        {subjectStats.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Subject-wise Attendance</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subjectStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 30% 20%)" />
                    <XAxis dataKey="subject" tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ background: 'hsl(217 45% 16%)', border: '1px solid hsl(18 100% 58% / 0.2)', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="attendance" fill="hsl(195, 100%, 50%)" radius={[4, 4, 0, 0]} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <StudentDetailModal open={modalOpen} onOpenChange={setModalOpen} row={detailRow} />
      </div>
    </TooltipProvider>
  );
};

export default FacultyAnalytics;
