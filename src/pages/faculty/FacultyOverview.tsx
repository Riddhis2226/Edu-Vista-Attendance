import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, FileSpreadsheet, Clock, BookOpen, Target as TargetIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TypewriterText from '@/components/TypewriterText';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import AttendanceRing from '@/components/faculty/AttendanceRing';

const FacultyOverview = () => {
  const { user, userName } = useAuth();
  const navigate = useNavigate();
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Map<string, number>>(new Map());
  const [orphanSubjects, setOrphanSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [recentRes, targetsRes, sessionsRes] = await Promise.all([
        supabase.from('attendance_sessions').select('*').eq('faculty_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('lecture_targets' as any).select('*').eq('faculty_id', user.id),
        supabase.from('attendance_sessions').select('subject').eq('faculty_id', user.id),
      ]);
      setRecentSessions(recentRes.data || []);
      setTargets((targetsRes.data as any[]) || []);

      // Count sessions per subject
      const counts = new Map<string, number>();
      (sessionsRes.data || []).forEach((s: any) => {
        counts.set(s.subject, (counts.get(s.subject) || 0) + 1);
      });
      setSessionCounts(counts);

      // Find subjects with sessions but no target
      const targetSubjects = new Set(((targetsRes.data as any[]) || []).map((t: any) => t.subject));
      const orphans = Array.from(counts.keys()).filter((s) => !targetSubjects.has(s));
      setOrphanSubjects(orphans);

      setLoading(false);
    };
    fetch();
  }, [user]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold"><TypewriterText text={`Welcome, ${userName || 'Faculty'}!`} /></h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => navigate('/faculty/upload-photo')} className="cursor-pointer">
          <Card className="glass-card hover:scale-[1.02] hover:border-primary/30 transition-all duration-200 h-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">📷 Upload via Photos</h3>
                <p className="text-sm text-muted-foreground mt-1">Use AI face recognition to mark attendance from classroom photos</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          onClick={() => navigate('/faculty/upload-dataset')} className="cursor-pointer">
          <Card className="glass-card hover:scale-[1.02] hover:border-secondary/30 transition-all duration-200 h-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-secondary/20 flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">📂 Upload via Dataset</h3>
                <p className="text-sm text-muted-foreground mt-1">Import attendance from CSV or spreadsheet files</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Sessions</h3>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 skeleton-shimmer rounded" />)}</div>
            ) : recentSessions.length === 0 ? (
              <EmptyState message="No sessions yet. Upload your first attendance!" />
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{s.subject}</p>
                        <p className="text-xs text-muted-foreground">{s.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.method === 'ai_photo' ? '📷' : '📂'}</Badge>
                      <span className="text-sm text-success">{s.total_present || 0}P</span>
                      <span className="text-sm text-destructive">{s.total_absent || 0}A</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FacultyOverview;
