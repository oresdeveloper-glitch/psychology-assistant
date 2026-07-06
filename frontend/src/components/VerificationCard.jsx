import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, MessageSquareHeart } from "lucide-react";

export default function VerificationCard({ state }) {
  const [feedback, setFeedback] = useState(null);

  return (
    <motion.div
      className="premium-glass rounded-2xl p-5"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex gap-4">
          <div className="h-11 w-11 rounded-xl bg-rose-400/10 text-rose-300 border border-rose-400/20 flex items-center justify-center">
            <MessageSquareHeart size={22} />
          </div>

          <div>
            <h3 className="text-lg font-bold">User Verification</h3>
            <p className="text-sm text-slate-400">
              The system detected your current state as <span className="font-semibold text-white">{state || 'Unknown'}</span>. Is this accurate?
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setFeedback("yes")}
            className={`px-5 py-2 rounded-xl font-semibold transition ${
              feedback === "yes"
                ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} /> Yes
            </span>
          </button>

          <button
            onClick={() => setFeedback("no")}
            className={`px-5 py-2 rounded-xl font-semibold transition ${
              feedback === "no"
                ? "bg-rose-500 text-white"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <XCircle size={18} /> No
            </span>
          </button>
        </div>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 premium-glass-light rounded-xl p-3 text-sm text-slate-300"
        >
          Feedback recorded. This response can later be used to improve model accuracy.
        </motion.div>
      )}
    </motion.div>
  );
}
