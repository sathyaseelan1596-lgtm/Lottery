import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function UserStats({ contract, account, lotteryId }) {
  const [activeLotteryId, setActiveLotteryId] = useState(null);
  const [userReward, setUserReward] = useState(0n);
  const [userTickets, setUserTickets] = useState(0);
  const [finalNumber, setFinalNumber] = useState(null);
  const [totalRewards, setTotalRewards] = useState(0n);
  const [isWinner, setIsWinner] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lotteryStatus, setLotteryStatus] = useState(null);

  const hasValidWinningNumber = (num) => Number(num) > 1000000;

  const getMatchDigits = (ticket, winning) => {
    const t = String(ticket).slice(-6).padStart(6, "0");
    const w = String(winning).slice(-6).padStart(6, "0");
    let count = 0;
    for (let i = 5; i >= 0; i--) {
      if (t[i] === w[i]) count++;
      else break;
    }
    return count;
  };

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      toast.loading("Fetching your stats...", { id: "stats" });

      let id = lotteryId;
      if (!id) {
        id = Number(await contract.viewCurrentLotteryId());
      }

      if (Number(id) === 0) {
        toast.dismiss("stats");
        toast("No active lottery found", { icon: "ℹ️" });
        return;
      }

      setActiveLotteryId(Number(id));

      const lottery = await contract.viewLottery(id);
      const statusNum = Number(lottery.status);
      const winningNumRaw = Number(lottery.finalNumber);
      const hasDrawn = hasValidWinningNumber(winningNumRaw);

      setLotteryStatus(statusNum);
      setFinalNumber(hasDrawn ? winningNumRaw : null);

      const winners = Array.from(
        lottery.countWinnersPerBracket || []
      ).map(Number);

      let totalR = 0n;
      if (hasDrawn) {
        for (let i = 0; i < 6; i++) {
          totalR += lottery.cakePerBracket[i] * BigInt(winners[i]);
        }
      }
      setTotalRewards(totalR);

      const res = await contract.viewUserInfoForLotteryId(
        account,
        Number(id),
        0,
        50
      );

      const ticketNumbers = res[1] || [];
      setUserTickets(ticketNumbers.length);

      let reward = 0n;
      let bestMatch = 0;

      // ✅ Only calculate matches if winning number is actually drawn
      if (hasDrawn) {
        ticketNumbers.forEach((t) => {
          const match = getMatchDigits(Number(t), winningNumRaw);
          if (match > bestMatch) bestMatch = match;

          if (match > 0) {
            const bracketIndex = match - 1;
            if (winners[bracketIndex] > 0) {
              reward +=
                lottery.cakePerBracket[bracketIndex] /
                BigInt(winners[bracketIndex]);
            }
          }
        });
      }

      setMatchCount(hasDrawn ? bestMatch : 0);
      setIsWinner(hasDrawn && bestMatch > 0);
      setUserReward(hasDrawn ? reward : 0n);

      toast.dismiss("stats");

      if (!hasDrawn) {
        toast("Winning number not drawn yet", {
          icon: "⏳",
          duration: 2500,
        });
      } else if (reward > 0n) {
        toast.success("🏆 You have winning rewards!", { duration: 4000 });
      } else if (bestMatch > 0) {
        toast(`✨ ${bestMatch} digit match found!`, {
          icon: "🎯",
          duration: 3000,
        });
      } else {
        toast("No match this round", { icon: "😢", duration: 3000 });
      }
    } catch (err) {
      console.error(err);
      toast.dismiss("stats");
      toast.error(err.reason || err.shortMessage || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account) fetchUserStats();
  }, [contract, account, lotteryId]);

  // ── Derived values ──
  const isClaimable = lotteryStatus === 3;
  const hasDrawn = finalNumber !== null && hasValidWinningNumber(finalNumber);

  const winningDigits = hasDrawn
    ? String(finalNumber).slice(-6).padStart(6, "0").split("")
    : null;

  const resultConfig = !hasDrawn
    ? null
    : userReward > 0n
    ? {
        icon: "🏆",
        label: "You Won Rewards!",
        color: "#00e676",
        bg: "rgba(0,200,100,0.10)",
        border: "rgba(0,200,100,0.3)",
      }
    : matchCount > 0
    ? {
        icon: "✨",
        label: `${matchCount} Digit Match`,
        color: "#ffb74d",
        bg: "rgba(255,152,0,0.10)",
        border: "rgba(255,152,0,0.3)",
      }
    : {
        icon: "😢",
        label: "No Match This Round",
        color: "#ef5350",
        bg: "rgba(239,83,80,0.10)",
        border: "rgba(239,83,80,0.3)",
      };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1a2e",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
          },
          success: {
            iconTheme: { primary: "#ff9800", secondary: "#000" },
          },
          error: {
            iconTheme: { primary: "#ff5252", secondary: "#fff" },
          },
        }}
      />

      <motion.div
        style={styles.wrapper}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── HEADER ── */}
        <motion.div style={styles.header} variants={itemVariants}>
          <div style={styles.headerLeft}>
            <motion.span
              style={styles.headerIcon}
              animate={{ rotate: [0, -15, 15, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              📊
            </motion.span>
            <div>
              <h2 style={styles.headerTitle}>My Stats</h2>
              {activeLotteryId && (
                <div style={styles.roundText}>Round #{activeLotteryId}</div>
              )}
            </div>
          </div>

          <motion.button
            onClick={fetchUserStats}
            disabled={loading}
            style={{
              ...styles.refreshBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            whileHover={
              !loading
                ? { scale: 1.05, background: "rgba(255,255,255,0.09)" }
                : {}
            }
            whileTap={!loading ? { scale: 0.95 } : {}}
          >
            <motion.span
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={
                loading
                  ? { repeat: Infinity, duration: 1, ease: "linear" }
                  : {}
              }
              style={{ display: "inline-block" }}
            >
              {loading ? "⏳" : "🔄"}
            </motion.span>{" "}
            Refresh
          </motion.button>
        </motion.div>

        {/* ── WINNING NUMBER ── */}
        <motion.div style={styles.winningBox} variants={itemVariants}>
          <div style={styles.winningLabel}>🎯 Winning Number</div>
          <div style={styles.digitRow}>
            {winningDigits
              ? winningDigits.map((d, i) => (
                  <motion.span
                    key={i}
                    style={styles.digitBox}
                    initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    transition={{
                      delay: i * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    {d}
                  </motion.span>
                ))
              : [..."------"].map((d, i) => (
                  <motion.span
                    key={i}
                    style={{
                      ...styles.digitBox,
                      color: "#444",
                      borderColor: "rgba(255,255,255,0.06)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    {d}
                  </motion.span>
                ))}
          </div>

          <AnimatePresence>
            {!hasDrawn && (
              <motion.div
                style={styles.noDrawText}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Draw not completed yet
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── RESULT BANNER ── */}
        <AnimatePresence>
          {resultConfig && (
            <motion.div
              style={{
                ...styles.resultBanner,
                background: resultConfig.bg,
                border: `1px solid ${resultConfig.border}`,
              }}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.span
                style={styles.resultIcon}
                animate={
                  userReward > 0n
                    ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                {resultConfig.icon}
              </motion.span>
              <span
                style={{ ...styles.resultLabel, color: resultConfig.color }}
              >
                {resultConfig.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STATS GRID ── */}
        <motion.div style={styles.statsGrid} variants={containerVariants}>
          {[
            {
              icon: "🎟️",
              label: "My Tickets",
              value: userTickets,
              color: "#ffcc80",
            },
            {
              icon: "🔢",
              label: "Best Match",
              value: hasDrawn
                ? `${matchCount} digit${matchCount !== 1 ? "s" : ""}`
                : "--",
              color: "#ffcc80",
            },
            {
              icon: "💰",
              label: "My Reward",
              value: hasDrawn
                ? `${ethers.formatEther(userReward)} CAKE`
                : "--",
              color: userReward > 0n ? "#00e676" : "#ffb74d",
            },
            {
              icon: "🏦",
              label: "Total Prize Pool",
              value: hasDrawn
                ? `${ethers.formatEther(totalRewards)} CAKE`
                : "--",
              color: "#ffcc80",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              style={styles.statCard}
              variants={statCardVariants}
              whileHover={{
                scale: 1.04,
                border: "1px solid rgba(255,152,0,0.25)",
                background: "rgba(255,255,255,0.05)",
              }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                style={styles.statIcon}
                animate={{ y: [0, -4, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  delay: idx * 0.3,
                  ease: "easeInOut",
                }}
              >
                {stat.icon}
              </motion.div>
              <div style={styles.statLabel}>{stat.label}</div>
              <motion.div
                style={{ ...styles.statValue, color: stat.color }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.35 }}
              >
                {stat.value}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── MATCH PROGRESS BAR ── */}
        <AnimatePresence>
          {hasDrawn && (
            <motion.div
              style={styles.progressBox}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 10 }}
            >
              <div style={styles.progressHeader}>
                <span style={styles.progressLabel}>Match Progress</span>
                <motion.span
                  style={styles.progressCount}
                  key={matchCount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {matchCount} / 6 digits
                </motion.span>
              </div>
              <div style={styles.progressTrack}>
                <motion.div
                  style={{
                    ...styles.progressFill,
                    background:
                      matchCount === 6
                        ? "linear-gradient(135deg, #00e676, #00c853)"
                        : matchCount >= 3
                        ? "linear-gradient(135deg, #ff9800, #f57c00)"
                        : "linear-gradient(135deg, #ef5350, #c62828)",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${(matchCount / 6) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <div style={styles.progressTicks}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <motion.span
                    key={n}
                    style={{
                      ...styles.progressTick,
                      color: matchCount >= n ? "#ffb74d" : "#444",
                    }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + n * 0.08 }}
                  >
                    {n}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STATUS FOOTER ── */}
        <motion.div style={styles.footer} variants={itemVariants}>
          <motion.span
            style={styles.footerDot}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span style={styles.footerText}>
            {isClaimable
              ? "✅ Lottery is claimable — go to Claim tab"
              : hasDrawn
              ? "ℹ️ Results shown for completed draw"
              : "⏳ Winning number has not been drawn yet"}
          </span>
        </motion.div>
      </motion.div>
    </>
  );
}

// ==============================
// 🎨 STYLES
// ==============================
const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerIcon: {
    fontSize: "24px",
    display: "inline-block",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffcc80",
    margin: 0,
  },
  roundText: {
    fontSize: "12px",
    color: "#888",
    marginTop: "2px",
  },
  refreshBtn: {
    padding: "6px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#aaa",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  winningBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "20px",
    textAlign: "center",
  },
  winningLabel: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "12px",
  },
  digitRow: {
    display: "flex",
    gap: "6px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  digitBox: {
    width: "36px",
    height: "36px",
    background: "rgba(255,152,0,0.1)",
    border: "1px solid rgba(255,152,0,0.3)",
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffb74d",
  },
  noDrawText: {
    marginTop: "10px",
    fontSize: "12px",
    color: "#555",
  },

  resultBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px 20px",
    borderRadius: "12px",
  },
  resultIcon: {
    fontSize: "22px",
    display: "inline-block",
  },
  resultLabel: {
    fontSize: "16px",
    fontWeight: "800",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
  },
  statCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "16px",
    textAlign: "center",
    cursor: "default",
  },
  statIcon: {
    fontSize: "22px",
    marginBottom: "6px",
    display: "block",
  },
  statLabel: {
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffcc80",
  },

  progressBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "16px 20px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  progressLabel: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  progressCount: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffb74d",
    display: "inline-block",
  },
  progressTrack: {
    height: "8px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "99px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "99px",
  },
  progressTicks: {
    display: "flex",
    justifyContent: "space-between",
  },
  progressTick: {
    fontSize: "11px",
    fontWeight: "700",
    display: "inline-block",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  footerDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#ff9800",
    flexShrink: 0,
    display: "inline-block",
  },
  footerText: {
    fontSize: "12px",
    color: "#666",
    lineHeight: "1.4",
  },
};