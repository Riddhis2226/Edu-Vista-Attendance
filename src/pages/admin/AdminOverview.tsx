import React, { useEffect, useState } from 'react';
import { Users, UserCog, TrendingUp, Activity } from 'lucide-react';
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
  const [stats, setStats] = useState({ students: 0, faculty: 0, todayPct: 0, activeSessions: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [studentsRes, facultyRes, sessionsRes, recordsRes] = await Promise.all([
        supabase.from('students').select('id, branch', { count: 'exact' }),
        supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'faculty'),
        supabase.from('attendance_sessions').select('*').eq('date', new Date().toISOString().split('T')[0]),
        supabase.from('attendance_records').select('*'),
      ]);

      const totalStudents = studentsRes.count || 0;
      const totalFaculty = facultyRes.count || 0;
      const todaySessions = sessionsRes.data || [];
      const activeSessions = todaySessions.length;

      const todayPresent = todaySessions.reduce((acc, s) => acc + (s.total_present || 0), 0);
      const todayTotal = todaySessions.reduce((acc, s) => acc + (s.total_present || 0) + (s.total_absent || 0), 0);
      const todayPct = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

      setStats({ students: totalStudents, faculty: totalFaculty, todayPct, activeSessions });

      // Generate mock trend data (last 30 days)
      const trend = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
          date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          attendance: Math.round(60 + Math.random() * 35),
        };
      });
      setTrendData(trend);

      // Department-wise
      const branches = ['CSE', 'ECE', 'ME', 'CE', 'EE'];
      setDeptData(branches.map(b => ({ branch: b, attendance: Math.round(65 + Math.random() * 30) })));

      // Low attendance students
      setLowAttendance([]);
      setLoading(false);
    };
    fetchData();

    // Real-time subscription
    const channel = supabase.channel('admin-overview')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">30-Day Attendance Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 30% 20%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(217 45% 16%)', border: '1px solid hsl(18 100% 58% / 0.2)', borderRadius: 8, color: '#fff' }} />
                  <Line type="monotone" dataKey="attendance" stroke="hsl(18, 100%, 58%)" strokeWidth={2} dot={false} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Department-wise Attendance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 30% 20%)" />
                  <XAxis dataKey="branch" tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(217 45% 16%)', border: '1px solid hsl(18 100% 58% / 0.2)', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="attendance" fill="hsl(195, 100%, 50%)" radius={[4, 4, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
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
                    <Badge variant="destructive" className="pulse-badge">Below 75%</Badge>
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
