import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { motion } from "framer-motion";
import { LineChart as ChartIcon } from "lucide-react";

export default function TrendChart({ data }) {
  return (
    <motion.div
      className="premium-glass rounded-2xl p-5 sm:p-6 h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text text-transparent">Emotional Trend</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Stress/anxiety intensity over time
          </p>
        </div>

        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <ChartIcon className="w-4 h-4 text-indigo-400" />
        </div>
      </div>

      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818CF8" stopOpacity={0.6} />
                <stop offset="60%" stopColor="#818CF8" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                backdropFilter: "blur(16px)",
              }}
            />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#818CF8"
              strokeWidth={2.5}
              fill="url(#trendGradient)"
              animationDuration={900}
              dot={{ fill: "#818CF8", r: 2, strokeWidth: 0 }}
              activeDot={{ fill: "#818CF8", r: 4, strokeWidth: 2, stroke: "#0F172A" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
