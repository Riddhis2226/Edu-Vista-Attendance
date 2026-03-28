import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TypewriterText from '@/components/TypewriterText';
import EmptyState from '@/components/EmptyState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FacultyAnalytics = () => {
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState<any[]>([]);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get all sessions for this faculty
      const { data: sessions } = await supabase.from('attendance_sessions').select('id, subject').eq('faculty_id', user.id);
      if (!sessions || sessions.length === 0) { setLoading(false); return; }

      const sessionIds = sessions.map(s => s.id);
      const { data: records } = await supabase.from('attendance_records').select('*').in('session_id', sessionIds);

      if (!records) { setLoading(false); return; }

      // Student-level stats
      const studentMap = new Map<string, { name: string; total: number; present: number }>();
      records.forEach(r => {
        const key = r.enrollment_no;
        if (!studentMap.has(key)) studentMap.set(key, { name: r.student_name, total: 0, present: 0 });
        const s = studentMap.get(key)!;
        s.total++;
        if (r.status === 'present') s.present++;
      });
      const studentArr = Array.from(studentMap.entries()).map(([eno, s]) => ({
        enrollment_no: eno, name: s.name, pct: Math.round((s.present / s.total) * 100),
      })).sort((a, b) => a.pct - b.pct);
      setStudentStats(studentArr);

      // Subject-level stats
      const subjectMap = new Map<string, { total: number; present: number }>();
      records.forEach(r => {
        const sess = sessions.find(s => s.id === r.session_id);
        const subj = sess?.subject || 'Unknown';
        if (!subjectMap.has(subj)) subjectMap.set(subj, { total: 0, present: 0 });
        const s = subjectMap.get(subj)!;
        s.total++;
        if (r.status === 'present') s.present++;
      });
      setSubjectStats(Array.from(subjectMap.entries()).map(([subject, s]) => ({
        subject, attendance: Math.round((s.present / s.total) * 100),
      })));

      setLoading(false);
    };
    fetch();
  }, [user]);

  const getColor = (pct: number) => pct >= 75 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold"><TypewriterText text="Analytics" /></h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 skeleton-shimmer rounded-xl" />)}
        </div>
      ) : studentStats.length === 0 ? <EmptyState message="No attendance data to analyze" /> : (
        <>
          {/* Subject bar chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Subject-wise Attendance</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subjectStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 30% 20%)" />
                    <XAxis dataKey="subject" tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(218 25% 50%)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(217 45% 16%)', border: '1px solid hsl(18 100% 58% / 0.2)', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="attendance" fill="hsl(195, 100%, 50%)" radius={[4, 4, 0, 0]} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Student attendance rings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Student Attendance</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {studentStats.map((s, i) => (
                    <motion.div key={s.enrollment_no} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className="flex flex-col items-center p-3 rounded-xl bg-muted/20">
                      {/* Circular progress */}
                      <div className="relative h-16 w-16 mb-2">
                        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="hsl(217, 30%, 20%)" strokeWidth="3" />
                          <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={s.pct >= 75 ? 'hsl(160, 100%, 45%)' : s.pct >= 50 ? 'hsl(43, 100%, 70%)' : 'hsl(348, 100%, 65%)'}
                            strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${s.pct}, 100`}
                            initial={{ strokeDasharray: '0, 100' }}
                            animate={{ strokeDasharray: `${s.pct}, 100` }}
                            transition={{ duration: 1, delay: i * 0.03 }}
                          />
                        </svg>
                        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${getColor(s.pct)}`}>{s.pct}%</span>
                      </div>
                      <p className="text-xs font-medium truncate w-full text-center">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.enrollment_no}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Low attendance */}
          {studentStats.filter(s => s.pct < 75).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">Low Attendance (&lt;75%)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {studentStats.filter(s => s.pct < 75).map(s => (
                      <div key={s.enrollment_no} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div>
                          <span className="font-medium">{s.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">{s.enrollment_no}</span>
                        </div>
                        <Badge variant="destructive" className="pulse-badge">{s.pct}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default FacultyAnalytics;
