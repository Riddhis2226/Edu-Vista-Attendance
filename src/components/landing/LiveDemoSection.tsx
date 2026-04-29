import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, Zap, Users, Sparkles, AlertCircle } from 'lucide-react';

interface Face {
  index: number;
  probability: number | null;
  rectangle: { left: number; top: number; right: number; bottom: number } | null;
  recognized: boolean;
}
interface DemoResult {
  success: boolean;
  provider: string;
  latency_ms: number;
  face_count: number;
  faces: Face[];
}

const SAMPLES = [
  {
    label: 'Small group',
    url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&q=80&auto=format&fit=crop',
  },
  {
    label: 'Classroom',
    url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=900&q=80&auto=format&fit=crop',
  },
  {
    label: 'Lecture hall',
    url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900&q=80&auto=format&fit=crop',
  },
];

const LiveDemoSection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);

  const sample = SAMPLES[activeIdx];

  const runDemo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke('luxand-demo', {
        body: { image_url: sample.url },
      });
      if (invokeErr) throw new Error(invokeErr.message);
      if (!data?.success) throw new Error(data?.error || 'Demo failed');
      setResult(data as DemoResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const selectSample = (i: number) => {
    if (loading) return;
    setActiveIdx(i);
    setResult(null);
    setError(null);
    setImgDims(null);
  };

  return (
    <section id="live-demo" className="py-20 sm:py-28 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Live · Powered by Luxand Cloud
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            See the AI Detect Faces — Live
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pick a sample classroom photo and run it through the same Luxand engine that powers
            EduVista attendance. No login required.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: image + samples */}
          <div className="lg:col-span-3 space-y-4">
            <div
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] aspect-[4/3]"
              style={{ boxShadow: '0 0 40px rgba(0,194,255,0.08)' }}
            >
              <img
                src={sample.url}
                alt={`${sample.label} sample`}
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
                }}
                crossOrigin="anonymous"
              />

              {/* Scanning shimmer while loading */}
              {loading && (
                <>
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
                  <motion.div
                    initial={{ y: '-10%' }}
                    animate={{ y: '110%' }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-24 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(180deg, transparent, rgba(0,194,255,0.35), transparent)',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 border border-primary/30 text-primary text-sm font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" /> Detecting faces…
                    </div>
                  </div>
                </>
              )}

              {/* Face boxes overlay */}
              {!loading && result && imgDims && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 ${imgDims.w} ${imgDims.h}`}
                  preserveAspectRatio="xMidYMid slice"
                >
                  {result.faces.map((f) =>
                    f.rectangle ? (
                      <motion.g
                        key={f.index}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: f.index * 0.06, duration: 0.3 }}
                      >
                        <rect
                          x={f.rectangle.left}
                          y={f.rectangle.top}
                          width={f.rectangle.right - f.rectangle.left}
                          height={f.rectangle.bottom - f.rectangle.top}
                          fill="none"
                          stroke="hsl(180 100% 50%)"
                          strokeWidth={Math.max(3, imgDims.w / 250)}
                          rx={6}
                        />
                        <rect
                          x={f.rectangle.left}
                          y={Math.max(0, f.rectangle.top - imgDims.h * 0.045)}
                          width={Math.max(80, imgDims.w * 0.09)}
                          height={imgDims.h * 0.04}
                          fill="hsl(180 100% 50%)"
                          rx={3}
                        />
                        <text
                          x={f.rectangle.left + 6}
                          y={f.rectangle.top - imgDims.h * 0.012}
                          fontSize={Math.max(14, imgDims.w / 60)}
                          fontWeight="700"
                          fill="#001"
                          fontFamily="Inter, sans-serif"
                        >
                          #{f.index + 1}
                          {f.probability !== null
                            ? ` · ${(f.probability * 100).toFixed(0)}%`
                            : ''}
                        </text>
                      </motion.g>
                    ) : null,
                  )}
                </svg>
              )}
            </div>

            {/* Sample picker */}
            <div className="grid grid-cols-3 gap-2">
              {SAMPLES.map((s, i) => (
                <button
                  key={s.url}
                  onClick={() => selectSample(i)}
                  disabled={loading}
                  className={`group relative rounded-lg overflow-hidden border transition-all aspect-[4/3] ${
                    activeIdx === i
                      ? 'border-primary ring-2 ring-primary/40'
                      : 'border-white/10 hover:border-white/30'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img src={s.url} alt={s.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <div className="text-[10px] font-semibold text-white text-left">{s.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: controls + results */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={runDemo}
              disabled={loading}
              className="w-full px-6 py-4 rounded-xl font-bold text-base text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, hsl(20 100% 56%), hsl(195 100% 50%))',
                boxShadow: '0 10px 30px -10px hsl(20 100% 56% / 0.4)',
              }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
                </span>
              ) : result ? (
                'Run Detection Again'
              ) : (
                '⚡ Run Live Detection'
              )}
            </button>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {result && !error && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-4 bg-white/[0.04] border border-white/10">
                      <Users className="w-4 h-4 text-primary mb-2" />
                      <div className="text-2xl font-extrabold text-foreground">
                        {result.face_count}
                      </div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Faces detected
                      </div>
                    </div>
                    <div className="rounded-xl p-4 bg-white/[0.04] border border-white/10">
                      <Zap className="w-4 h-4 text-secondary mb-2" />
                      <div className="text-2xl font-extrabold text-foreground">
                        {(result.latency_ms / 1000).toFixed(2)}s
                      </div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        End-to-end
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl p-3 bg-white/[0.02] border border-white/10 max-h-48 overflow-auto">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Per-face confidence
                    </div>
                    {result.faces.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2">
                        No faces detected — try another sample.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {result.faces.map((f) => {
                          const pct =
                            f.probability !== null ? Math.round(f.probability * 100) : null;
                          return (
                            <div key={f.index} className="flex items-center gap-2 text-xs">
                              <span className="w-6 text-muted-foreground font-mono">
                                #{f.index + 1}
                              </span>
                              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct ?? 80}%` }}
                                  transition={{ duration: 0.6, delay: f.index * 0.05 }}
                                  className="h-full rounded-full"
                                  style={{
                                    background:
                                      'linear-gradient(90deg, hsl(195 100% 50%), hsl(160 100% 45%))',
                                  }}
                                />
                              </div>
                              <span className="w-10 text-right font-semibold text-foreground">
                                {pct !== null ? `${pct}%` : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Privacy note */}
            <div className="rounded-xl p-4 bg-secondary/[0.04] border border-secondary/20">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                <div className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-bold text-secondary">Privacy first.</span> This demo runs on
                  public stock photos. No images are stored, no biometric embeddings are saved, and
                  the response contains only face counts and bounding boxes — never identities. In
                  production, embeddings live in Luxand Cloud, fully separated from student
                  metadata in EduVista.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveDemoSection;
