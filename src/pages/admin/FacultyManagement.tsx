import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import TypewriterText from '@/components/TypewriterText';
import SkeletonTable from '@/components/SkeletonTable';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editFac, setEditFac] = useState<any | null>(null);
  const [deleteFac, setDeleteFac] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const fetchFaculty = async () => {
    setLoading(true);
    const { data } = await supabase.from('user_roles').select('*').eq('role', 'faculty').order('name');
    setFaculty(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFaculty(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { name: form.name, role: 'faculty' } },
    });
    if (error) toast.error(error.message);
    else toast.success('Faculty added. They will receive a confirmation email.');
    setSaving(false);
    setAddOpen(false);
    setForm({ name: '', email: '', password: '' });
    setTimeout(fetchFaculty, 2000);
  };

  const handleUpdate = async () => {
    if (!editFac) return;
    setSaving(true);
    await supabase.from('user_roles').update({ name: form.name, email: form.email }).eq('id', editFac.id);
    toast.success('Faculty updated');
    setSaving(false);
    setEditFac(null);
    fetchFaculty();
  };

  const handleDelete = async () => {
    if (!deleteFac) return;
    await supabase.from('user_roles').delete().eq('id', deleteFac.id);
    toast.success('Faculty removed');
    setDeleteFac(null);
    fetchFaculty();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold"><TypewriterText text="Faculty Management" /></h1>
        <Button onClick={() => { setForm({ name: '', email: '', password: '' }); setAddOpen(true); }} className="btn-shimmer">
          <Plus className="h-4 w-4 mr-1" /> Add Faculty
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? <div className="p-6"><SkeletonTable cols={4} /></div> : faculty.length === 0 ? <EmptyState message="No faculty members" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {faculty.map((f, i) => (
                  <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-b border-border hover:bg-muted/20 transition-all">
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-muted-foreground">{f.email}</TableCell>
                    <TableCell><Badge className="bg-secondary/20 text-secondary">Faculty</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setForm({ name: f.name, email: f.email, password: '' }); setEditFac(f); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => setDeleteFac(f)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Faculty */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>Add Faculty</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted/30" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-muted/30" /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="bg-muted/30" /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={saving || !form.name || !form.email || !form.password} className="btn-shimmer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Faculty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Faculty */}
      <Dialog open={!!editFac} onOpenChange={(o) => { if (!o) setEditFac(null); }}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>Edit Faculty</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted/30" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-muted/30" /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={saving} className="btn-shimmer">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteFac} onOpenChange={(o) => { if (!o) setDeleteFac(null); }}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>Remove Faculty</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Remove <strong>{deleteFac?.name}</strong> from faculty?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFac(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyManagement;
