import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Download,
  HeartPulse,
  Loader2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  DATASET_INFO,
  featureImpacts,
  generateTips,
  predictAll,
  riskLevel,
  type ModelResult,
  type PatientInput,
} from "@/lib/heart-risk";
import jsPDF from "jspdf";

const HEALTHY = {
  trestbps: 120,
  chol: 180,
  thalach: 170,
  oldpeak: 0.5,
};

export function RiskDashboard() {
  const [input, setInput] = useState<PatientInput>({
    age: 54,
    sex: "male",
    cp: 2,
    trestbps: 138,
    chol: 245,
    fbs: 0,
    restecg: 1,
    thalach: 148,
    exang: 0,
    oldpeak: 1.2,
    slope: 1,
  });
  const [results, setResults] = useState<ModelResult[] | null>(null);
  const [calculating, setCalculating] = useState(false);

  const update = <K extends keyof PatientInput>(k: K, v: PatientInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const handleCalculate = () => {
    setCalculating(true);
    setResults(null);
    setTimeout(() => {
      setResults(predictAll(input));
      setCalculating(false);
    }, 1100);
  };

  const top = useMemo(() => {
    if (!results) return null;
    return [...results].sort((a, b) => b.confidence - a.confidence)[0];
  }, [results]);

  const avgProb = results
    ? results.reduce((a, b) => a + b.probability, 0) / results.length
    : 0;
  const level = top ? riskLevel(top.probability) : null;

  const compareData = [
    { metric: "BP", you: input.trestbps, healthy: HEALTHY.trestbps },
    { metric: "Cholesterol", you: input.chol, healthy: HEALTHY.chol },
    { metric: "Max HR", you: input.thalach, healthy: HEALTHY.thalach },
    { metric: "ST Depression", you: input.oldpeak * 50, healthy: HEALTHY.oldpeak * 50 },
  ];

  const radarData = [
    { axis: "Age", value: Math.min(100, (input.age / 80) * 100) },
    { axis: "BP", value: Math.min(100, (input.trestbps / 200) * 100) },
    { axis: "Chol", value: Math.min(100, (input.chol / 400) * 100) },
    { axis: "HR", value: Math.min(100, 100 - (input.thalach / 220) * 100) },
    { axis: "ST", value: Math.min(100, (input.oldpeak / 6) * 100) },
    { axis: "CP", value: (input.cp / 3) * 100 },
  ];

  const trendData = Array.from({ length: 12 }).map((_, i) => ({
    month: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i],
    bp: input.trestbps + Math.sin(i / 2) * 6,
    chol: input.chol + Math.cos(i / 3) * 12,
  }));

  const tips = results ? generateTips(input, top!.probability) : [];
  const topImpacts = results ? featureImpacts(input).slice(0, 3) : [];
  const impactChartData = topImpacts.map((f) => ({
    name: f.label,
    impact: +(f.impact * 100).toFixed(1),
    direction: f.direction,
  }));

  const downloadReport = () => {
    if (!results || !top || !level) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    let y = 56;

    // Header band
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, W, 80, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("CardioIQ — Clinical Risk Report", 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(new Date().toLocaleString(), 40, 60);

    y = 110;
    doc.setTextColor(20, 20, 30);

    const section = (title: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235);
      doc.text(title, 40, y);
      y += 8;
      doc.setDrawColor(220, 230, 245);
      doc.line(40, y, W - 40, y);
      y += 14;
      doc.setTextColor(20, 20, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    };

    const writeLine = (text: string) => {
      const wrapped = doc.splitTextToSize(text, W - 80) as string[];
      wrapped.forEach((l) => {
        if (y > 780) {
          doc.addPage();
          y = 56;
        }
        doc.text(l, 40, y);
        y += 16;
      });
    };

    section("Risk Summary");
    writeLine(`Overall Risk: ${(top.probability * 100).toFixed(1)}%  (${level.label})`);
    writeLine(`Most Confident Model: ${top.name}`);
    writeLine(`Ensemble Average: ${(avgProb * 100).toFixed(1)}%`);
    y += 6;

    section("Patient Inputs");
    [
      `Age: ${input.age}`,
      `Sex: ${input.sex}`,
      `Chest Pain Type: ${input.cp}`,
      `Resting BP: ${input.trestbps} mmHg`,
      `Cholesterol: ${input.chol} mg/dl`,
      `Fasting Blood Sugar > 120: ${input.fbs ? "Yes" : "No"}`,
      `Resting ECG: ${input.restecg}`,
      `Max Heart Rate: ${input.thalach}`,
      `Exercise-Induced Angina: ${input.exang ? "Yes" : "No"}`,
      `ST Depression: ${input.oldpeak}`,
      `ST Slope: ${input.slope}`,
    ].forEach(writeLine);
    y += 6;

    section("Model Consensus");
    results.forEach((r) =>
      writeLine(
        `${r.name}: ${(r.probability * 100).toFixed(1)}% risk · confidence ${(r.confidence * 100).toFixed(0)}%`,
      ),
    );
    y += 6;

    section("Top Risk Drivers");
    topImpacts.forEach((f, i) =>
      writeLine(`${i + 1}. ${f.label} — ${f.direction} risk (impact ${(f.impact * 100).toFixed(1)})`),
    );
    y += 6;

    section("Doctor's Recommendation");
    tips.slice(0, 3).forEach((t, i) => writeLine(`${i + 1}. ${t}`));
    y += 10;

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 130);
    writeLine(
      "Disclaimer: CardioIQ is an educational decision-support tool. It does not replace professional medical evaluation.",
    );

    doc.save(`cardioiq-report-${Date.now()}.pdf`);
    toast.success("PDF report downloaded");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              <Activity className="mr-1 h-3 w-3" /> Clinical Decision Support
            </Badge>
            <Badge variant="outline" className="rounded-full text-[10px]">
              UCI · {DATASET_INFO.realRecords} real + {DATASET_INFO.syntheticRecords} synthetic
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Heart Disease Risk Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Three models (Logistic Regression, Random Forest, XGBoost) trained on{" "}
            {DATASET_INFO.totalRecords} patient records.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2 shadow-[var(--shadow-card)]">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Data Health
            </div>
            <div className="text-sm font-semibold">
              Model Accuracy: {(DATASET_INFO.baselineAccuracy * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* INPUT PANEL */}
        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="h-4 w-4 text-primary" />
              Patient Vitals
            </CardTitle>
            <CardDescription>UCI Heart Disease feature set</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Age: ${input.age}`}>
                <Slider
                  value={[input.age]}
                  min={20}
                  max={90}
                  onValueChange={([v]) => update("age", v)}
                />
              </Field>
              <Field label="Sex">
                <Select
                  value={input.sex}
                  onValueChange={(v) => update("sex", v as PatientInput["sex"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Chest Pain Type">
              <Select
                value={String(input.cp)}
                onValueChange={(v) => update("cp", Number(v) as PatientInput["cp"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Typical Angina</SelectItem>
                  <SelectItem value="1">Atypical Angina</SelectItem>
                  <SelectItem value="2">Non-anginal Pain</SelectItem>
                  <SelectItem value="3">Asymptomatic</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Resting BP (mmHg)">
                <Input
                  type="number"
                  min={50}
                  max={250}
                  value={input.trestbps}
                  onChange={(e) =>
                    update("trestbps", clamp(+e.target.value, 50, 250))
                  }
                />
              </Field>
              <Field label="Cholesterol (mg/dl)">
                <Input
                  type="number"
                  min={80}
                  max={600}
                  value={input.chol}
                  onChange={(e) => update("chol", clamp(+e.target.value, 80, 600))}
                />
              </Field>
              <Field label="Max Heart Rate">
                <Input
                  type="number"
                  min={50}
                  max={230}
                  value={input.thalach}
                  onChange={(e) =>
                    update("thalach", clamp(+e.target.value, 50, 230))
                  }
                />
              </Field>
              <Field label="ST Depression">
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  value={input.oldpeak}
                  onChange={(e) =>
                    update("oldpeak", clamp(+e.target.value, 0, 10))
                  }
                />
              </Field>
            </div>

            <div className="space-y-3 rounded-xl bg-muted/40 p-3">
              <ToggleRow
                label="Fasting Blood Sugar > 120"
                checked={!!input.fbs}
                onChange={(v) => update("fbs", v ? 1 : 0)}
              />
              <ToggleRow
                label="Exercise-Induced Angina"
                checked={!!input.exang}
                onChange={(v) => update("exang", v ? 1 : 0)}
              />
            </div>

            <Button
              onClick={handleCalculate}
              disabled={calculating}
              className="h-12 w-full rounded-xl bg-[image:var(--gradient-clinical)] text-base font-semibold shadow-[var(--shadow-glow)] transition-all hover:scale-[1.01]"
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" /> Calculate Risk
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* RESULTS PANEL */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {calculating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex h-64 items-center justify-center rounded-2xl border bg-card shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                  >
                    <HeartPulse className="h-10 w-10 text-primary" />
                  </motion.div>
                  <p className="text-sm">Running 3-model ensemble…</p>
                </div>
              </motion.div>
            )}

            {results && top && level && !calculating && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Headline */}
                <Card className="overflow-hidden rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
                  <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Most confident model
                      </p>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-semibold">{top.name}</h2>
                        <Badge
                          className="rounded-full"
                          variant={level.tone === "success" ? "secondary" : "destructive"}
                          style={
                            level.tone === "warning"
                              ? { background: "var(--warning)", color: "white" }
                              : level.tone === "success"
                                ? { background: "var(--success)", color: "white" }
                                : undefined
                          }
                        >
                          {level.label} Risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ensemble average: {(avgProb * 100).toFixed(1)}% · model confidence{" "}
                        {(top.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative">
                      <RiskRing value={top.probability} />
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
                    {results.map((r) => (
                      <div key={r.name} className="space-y-2 p-5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{r.name}</span>
                          {r.name === top.name && (
                            <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-semibold">
                            {(r.probability * 100).toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">% risk</span>
                        </div>
                        <Progress value={r.probability * 100} className="h-1.5" />
                        <p className="text-[11px] text-muted-foreground">
                          confidence {(r.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="rounded-2xl shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-4 w-4 text-primary" /> You vs Healthy
                        Averages
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compareData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: 12,
                            }}
                          />
                          <Legend />
                          <Bar dataKey="healthy" fill="var(--success)" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="you" radius={[8, 8, 0, 0]}>
                            {compareData.map((d, i) => (
                              <Cell
                                key={i}
                                fill={d.you > d.healthy * 1.1 ? "var(--destructive)" : "var(--primary)"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="text-base">Risk Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="var(--border)" />
                          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                          <Radar
                            dataKey="value"
                            stroke="var(--primary)"
                            fill="var(--primary)"
                            fillOpacity={0.35}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-4 w-4 text-primary" /> The "Why" Factor
                    </CardTitle>
                    <CardDescription>
                      Top 3 health metrics driving this risk score
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={impactChartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          width={120}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                          }}
                          formatter={(v: number, _n, p) => [
                            `${v} (${(p.payload as { direction: string }).direction} risk)`,
                            "Impact",
                          ]}
                        />
                        <Bar dataKey="impact" radius={[0, 8, 8, 0]}>
                          {impactChartData.map((d, i) => (
                            <Cell
                              key={i}
                              fill={
                                d.direction === "increases"
                                  ? "var(--destructive)"
                                  : "var(--success)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="text-base">Projected 12-Month Trends</CardTitle>
                    <CardDescription>
                      Simulated trajectory based on current vitals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="bp"
                          name="Blood Pressure"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="chol"
                          name="Cholesterol"
                          stroke="var(--warning)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* AI Summary */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <span className="font-semibold">AI Summary: </span>
                  Based on your profile, the AI identifies{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        level.tone === "success"
                          ? "var(--success)"
                          : level.tone === "warning"
                            ? "var(--warning)"
                            : "var(--destructive)",
                    }}
                  >
                    {level.label.toLowerCase()}
                  </span>{" "}
                  cardiovascular risk factors.
                </div>

                {/* Doctor's Recommendation */}
                <Card className="overflow-hidden rounded-2xl border-primary/20 shadow-[var(--shadow-card)]">
                  <CardHeader className="bg-[image:var(--gradient-soft)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Doctor's Recommendation</CardTitle>
                        <CardDescription>
                          Lifestyle prescription tailored to your profile
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6">
                    {tips.slice(0, 3).map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-[var(--shadow-card)]"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-clinical)] text-xs font-semibold text-primary-foreground">
                          Rx{i + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{tip}</p>
                      </motion.div>
                    ))}
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        Based on {DATASET_INFO.totalRecords} training records
                      </p>
                      <Button
                        onClick={downloadReport}
                        className="rounded-xl bg-[image:var(--gradient-clinical)] shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02]"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download PDF Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!results && !calculating && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-[28rem] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-[image:var(--gradient-soft)] text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <AlertTriangle className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Awaiting assessment</h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    Adjust the patient vitals on the left and click{" "}
                    <span className="font-medium text-foreground">Calculate Risk</span> to
                    run the 3-model ensemble.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-xs leading-relaxed text-foreground/80">
        <span className="font-semibold text-foreground">⚕ Medical Disclaimer: </span>
        Not a medical diagnosis. CardioIQ is an experimental educational tool — consult a qualified doctor for health advice.
      </div>

      {/* Footer */}
      <footer className="pt-2 text-center text-[11px] text-muted-foreground">
        Experimental AI Project · Data source: UCI Heart Disease Dataset · Accuracy:{" "}
        {(DATASET_INFO.baselineAccuracy * 100).toFixed(1)}%
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function RiskRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  const color =
    value < 0.3
      ? "var(--success)"
      : value <= 0.7
        ? "var(--warning)"
        : "var(--destructive)";
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="var(--muted)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight" style={{ color }}>{pct}%</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          risk
        </span>
      </div>
      <footer className="w-full py-8 bg-slate-50 border-t mt-auto">
  <div className="max-w-7xl mx-auto px-4 text-center">
    <p className="font-semibold text-slate-800">
      Developed by Anas Rahman | BTech CSE AI (1st Year)
    </p>
    <p className="text-xs text-slate-500 mt-2">
      Architecture: React 18 • TypeScript • Tailwind CSS • Ensemble ML Models
    </p>
    <p className="text-[10px] text-slate-400 mt-4 italic">
      Disclaimer: This is a research prototype for educational purposes only.
    </p>
    </div>
</footer>
</div>
  );
}
