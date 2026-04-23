import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCog, TrendingUp, Activity, AlertOctagon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StatCard from '@/components/StatCard';
import TypewriterText from '@/components/TypewriterText';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

const AdminOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, faculty: 0, todayPct: 0, activeSessions: 0, cannotRecover: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const [studentsRes, facultyRes, sessionsRes, allSessionsRes] = await Promise.all([
      supabase.from('students').select('id, branch', { count: 'exact' }),
      supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'faculty'),
      supabase.from('attendance_sessions').select('*').eq('date', today),
      supabase.from('attendance_sessions').select('id, date, total_present, total_absent'),
    ]);

    const totalStudents = studentsRes.count || 0;
    const totalFaculty = facultyRes.count || 0;
    const todaySessions = sessionsRes.data || [];
    const activeSessions = todaySessions.length;

    const todayPresent = todaySessions.reduce((acc, s) => acc + (s.total_present || 0), 0);
    const todayTotal = todaySessions.reduce((acc, s) => acc + (s.total_present || 0) + (s.total_absent || 0), 0);
    const todayPct = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

    // Cannot Recover count from summary view
    const { data: summary } = await supabase.from('student_attendance_summary' as any).select('student_id, can_recover, total_lectures');
    const cannotSet = new Set<string>();
    (summary as any[] || []).forEach((r: any) => {
      if (r.total_lectures > 0 && r.can_recover === false) cannotSet.add(r.student_id);
    });

    setStats({ students: totalStudents, faculty: totalFaculty, todayPct, activeSessions, cannotRecover: cannotSet.size });

    // Build 30-day trend from real session data
    const allSessions = allSessionsRes.data || [];
    const dailyMap = new Map<string, { present: number; total: number }>();
    allSessions.forEach(s => {
      const d = s.date;
      if (!dailyMap.has(d)) dailyMap.set(d, { present: 0, total: 0 });
      const entry = dailyMap.get(d)!;
      entry.present += s.total_present || 0;
      entry.total += (s.total_present || 0) + (s.total_absent || 0);
    });

    const trend: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      trend.push({
        date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        attendance: entry && entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : null,
      });
    }
    setTrendData(trend);

    // Department/branch-wise attendance from real student + record data
    const students = studentsRes.data || [];
    const branchSet = new Set(students.map(s => s.branch).filter(Boolean));

    if (branchSet.size > 0) {
      // Get all records
      const { data: records } = await supabase.from('attendance_records').select('student_id, status');
      if (records && records.length > 0) {
        const studentBranchMap = new Map<string, string>();
        students.forEach(s => { if (s.branch) studentBranchMap.set(s.id, s.branch); });

        const branchStats = new Map<string, { present: number; total: number }>();
        records.forEach(r => {
          const branch = studentBranchMap.get(r.student_id);
          if (!branch) return;
          if (!branchStats.has(branch)) branchStats.set(branch, { present: 0, total: 0 });
          const entry = branchStats.get(branch)!;
          entry.total++;
          if (r.status === 'present') entry.present++;
        });

        setDeptData(Array.from(branchStats.entries()).map(([branch, s]) => ({
          branch,
          attendance: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
        })));
      } else {
        setDeptData([]);
      }
    } else {
      setDeptData([]);
    }

    // Low attendance students (< 75%)
    const { data: allRecords } = await supabase.from('attendance_records').select('student_id, student_name, enrollment_no, status');
    if (allRecords && allRecords.length > 0) {
      const studentMap = new Map<string, { name: string; eno: string; present: number; total: number }>();
      allRecords.forEach(r => {
        if (!studentMap.has(r.student_id)) studentMap.set(r.student_id, { name: r.student_name, eno: r.enrollment_no, present: 0, total: 0 });
        const entry = studentMap.get(r.student_id)!;
        entry.total++;
        if (r.status === 'present') entry.present++;
      });
      const low = Array.from(studentMap.entries())
        .map(([id, s]) => ({ id, full_name: s.name, enrollment_no: s.eno, pct: Math.round((s.present / s.total) * 100) }))
        .filter(s => s.pct < 75)
        .sort((a, b) => a.pct - b.pct);
      setLowAttendance(low);
    } else {
      setLowAttendance([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('admin-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        <TypewriterText text="Admin Overview" />
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.students} icon={Users} delay={0} />
        <StatCard title="Total Faculty" value={stats.faculty} icon={UserCog} color="text-secondary" delay={1} />
        <StatCard title="Today's Attendance" value={stats.todayPct} suffix="%" icon={TrendingUp} color="text-success" delay={2} />
        <StatCard title="Active Sessions" value={stats.activeSessions} icon={Activity} color="text-warning" delay={3} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        onClick={() => navigate('/admin/attendance-logs?recovery=cannot_recover')}
        className="cursor-pointer"
      >
        <Card className={`glass-card border-destructive/40 hover:border-destructive/70 transition-all ${stats.cannotRecover > 0 ? 'cannot-recover-glow' : ''}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <AlertOctagon className="h-6 w-6 text-destructive" />
                {stats.cannotRecover > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive animate-ping" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cannot Recover</p>
                <p className="text-2xl font-bold text-destructive">{stats.cannotRecover}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs text-right">
              Students who mathematically cannot reach 75% this semester. Click to view.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">30-Day Attendance Trend</CardTitle></CardHeader>
            <CardContent>
              {trendData.some(d => d.attendance !== null) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 30% 20%)" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(217 45% 16%)', border: '1px solid hsl(18 100% 58% / 0.2)', borderRadius: 8, color: '#fff' }} />
                    <Line type="monotone" dataKey="attendance" stroke="hsl(18, 100%, 58%)" strokeWidth={2} dot={false} connectNulls animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No attendance data yet" />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Department-wise Attendance</CardTitle></CardHeader>
            <CardContent>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 30% 20%)" />
                    <XAxis dataKey="branch" tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(217 45% 16%)', border: '1px solid hsl(18 100% 58% / 0.2)', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="attendance" fill="hsl(195, 100%, 50%)" radius={[4, 4, 0, 0]} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No department data yet" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Low Attendance Alerts (&lt;75%)</CardTitle></CardHeader>
          <CardContent>
            {lowAttendance.length === 0 ? (
              <EmptyState message="No low attendance alerts" />
            ) : (
              <div className="space-y-2">
                {lowAttendance.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span>{s.full_name} — {s.enrollment_no}</span>
                    <Badge variant="destructive" className="pulse-badge">{s.pct}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminOverview;
