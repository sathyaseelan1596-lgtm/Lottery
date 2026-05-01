import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function MyTickets({ contract, account }) {
  const [lotteryId, setLotteryId] = useState("");
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [finalNumber, setFinalNumber] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lotteryStatus, setLotteryStatus] = useState(null);

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

  const fetchTickets = async () => {
    try {
      if (!lotteryId) return toast.error("Enter a Lottery ID first");
      setLoading(true);
      toast.loading("Fetching your tickets...", { id: "tickets" });

      const res = await contract.viewUserInfoForLotteryId(
        account,
        Number(lotteryId),
        0,
        50
      );
      const lottery = await contract.viewLottery(Number(lotteryId));

      setTickets(res[1]);
      setStatuses(res[2]);
      setFinalNumber(Number(lottery.finalNumber));
      setLotteryStatus(Number(lottery.status));

      toast.dismiss("tickets");

      const ticketCount = res[1].length;
      if (ticketCount === 0) {
        toast("No tickets found for this round", { icon: "🎟️" });
      } else {
        toast.success(`Found ${ticketCount} ticket${ticketCount !== 1 ? "s" : ""}!`);
      }

      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.dismiss("tickets");
      toast.error(err.reason || err.shortMessage || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLottery = async () => {
    try {
      toast.loading("Getting current lottery...", { id: "current" });
      const id = await contract.viewCurrentLotteryId();
      setLotteryId(Number(id));
      toast.dismiss("current");
      toast.success(`Lottery #${Number(id)} loaded`);
    } catch (err) {
      console.error(err);
      toast.dismiss("current");
      toast.error("Failed to get current lottery");
    }
  };

  // ── Derived ──
  const hasDrawn = finalNumber && finalNumber !== 0;
  const isClaimable = lotteryStatus === 3;
  const winningDigits = hasDrawn
    ? String(finalNumber % 1000000).padStart(6, "0").split("")
    : null;

  const totalWon = tickets.filter(
    (t) => hasDrawn && getMatchDigits(Number(t), finalNumber) > 0
  ).length;

  const totalClaimed = statuses.filter(Boolean).length;

  // ── Animation Variants ──
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: "easeOut" },
    },
  };

  const ticketVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" },
    }),
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

      {/* ── CARD ── */}
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header */}
        <motion.div
          style={styles.cardHeader}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div style={styles.cardHeaderLeft}>
            <motion.span
              style={styles.cardIcon}
              animate={{ rotate: [0, -10, 10, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              📋
            </motion.span>
            <h2 style={styles.cardTitle}>My Tickets</h2>
          </div>
        </motion.div>

        <motion.p
          style={styles.cardDesc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Enter a lottery round ID to view your tickets and match results.
        </motion.p>

        {/* Input Row */}
        <motion.div
          style={styles.inputRow}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <input
            placeholder="Enter Lottery ID..."
            value={lotteryId}
            onChange={(e) => setLotteryId(e.target.value)}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(255,152,0,0.4)";
              e.target.style.boxShadow = "0 0 0 3px rgba(255,152,0,0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              e.target.style.boxShadow = "none";
            }}
          />
          <motion.button
            onClick={useCurrentLottery}
            style={styles.currentBtn}
            whileHover={{
              scale: 1.04,
              background: "rgba(255,255,255,0.1)",
            }}
            whileTap={{ scale: 0.96 }}
          >
            Current
          </motion.button>
        </motion.div>

        {/* View Button */}
        <motion.button
          onClick={fetchTickets}
          disabled={loading}
          style={{
            ...styles.viewBtn,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          whileHover={!loading ? {
            scale: 1.02,
            boxShadow: "0 6px 28px rgba(255,152,0,0.35)",
          } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              ⏳ Loading...
            </motion.span>
          ) : (
            "📋 View My Tickets"
          )}
        </motion.button>
      </motion.div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              style={styles.modal}
              initial={{ opacity: 0, scale: 0.88, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 40 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <motion.div
                style={styles.modalHeader}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 style={styles.modalTitle}>📋 My Tickets</h3>
                <motion.button
                  onClick={() => setShowModal(false)}
                  style={styles.closeBtn}
                  whileHover={{
                    scale: 1.1,
                    background: "rgba(255,255,255,0.1)",
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </motion.div>

              {/* Badges */}
              <motion.div
                style={styles.badgeRow}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <span style={styles.badge}>Round #{lotteryId}</span>
                <span style={styles.badge}>
                  {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}
                </span>
                <AnimatePresence>
                  {totalWon > 0 && (
                    <motion.span
                      style={styles.badgeGreen}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      🏆 {totalWon} Winner{totalWon !== 1 ? "s" : ""}
                    </motion.span>
                  )}
                  {totalClaimed > 0 && (
                    <motion.span
                      style={styles.badgeOrange}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      ✅ {totalClaimed} Claimed
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Winning Number */}
              <motion.div
                style={styles.winningBox}
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div style={styles.winningLabel}>🎯 Winning Number</div>
                <div style={styles.digitRow}>
                  {winningDigits
                    ? winningDigits.map((d, i) => (
                        <motion.span
                          key={i}
                          style={styles.digitBox}
                          initial={{ opacity: 0, rotateY: 90 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          transition={{
                            delay: 0.25 + i * 0.09,
                            type: "spring",
                            stiffness: 220,
                            damping: 16,
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
                          transition={{ delay: 0.25 + i * 0.06 }}
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

              {/* Ticket List */}
              <motion.div
                style={styles.ticketList}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {tickets.length === 0 ? (
                  <motion.div
                    style={styles.emptyState}
                    variants={itemVariants}
                  >
                    <motion.span
                      style={styles.emptyIcon}
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    >
                      🎟️
                    </motion.span>
                    <p style={styles.emptyText}>
                      No tickets found for this round
                    </p>
                  </motion.div>
                ) : (
                  tickets.map((t, i) => {
                    const num = Number(t);
                    const match = hasDrawn
                      ? getMatchDigits(num, finalNumber)
                      : 0;
                    const isWin = match > 0;
                    const claimed = statuses[i];

                    const ticketDigits = String(num % 1000000)
                      .padStart(6, "0")
                      .split("");

                    return (
                      <motion.div
                        key={i}
                        custom={i}
                        variants={ticketVariants}
                        style={{
                          ...styles.ticketCard,
                          borderColor: isWin
                            ? "rgba(255,152,0,0.3)"
                            : "rgba(255,255,255,0.05)",
                        }}
                        whileHover={{
                          scale: 1.015,
                          borderColor: isWin
                            ? "rgba(255,152,0,0.5)"
                            : "rgba(255,255,255,0.12)",
                        }}
                        transition={{ duration: 0.18 }}
                      >
                        {/* Ticket number as digit boxes */}
                        <div style={styles.ticketTop}>
                          <div style={styles.ticketDigitRow}>
                            {ticketDigits.map((d, di) => {
                              const isMatch =
                                hasDrawn &&
                                winningDigits &&
                                di >= 6 - match &&
                                d === winningDigits[di];
                              return (
                                <motion.span
                                  key={di}
                                  style={{
                                    ...styles.ticketDigit,
                                    background: isMatch
                                      ? "rgba(255,152,0,0.2)"
                                      : "rgba(255,255,255,0.04)",
                                    borderColor: isMatch
                                      ? "rgba(255,152,0,0.5)"
                                      : "rgba(255,255,255,0.08)",
                                    color: isMatch ? "#ffb74d" : "#888",
                                  }}
                                  animate={
                                    isMatch
                                      ? { scale: [1, 1.12, 1] }
                                      : {}
                                  }
                                  transition={{
                                    delay: di * 0.06,
                                    duration: 0.4,
                                    repeat: isMatch ? Infinity : 0,
                                    repeatDelay: 2,
                                  }}
                                >
                                  {d}
                                </motion.span>
                              );
                            })}
                          </div>

                          {/* Status badge */}
                          <AnimatePresence mode="wait">
                            {claimed ? (
                              <motion.span
                                key="claimed"
                                style={styles.claimedBadge}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                              >
                                ✅ Claimed
                              </motion.span>
                            ) : isWin ? (
                              <motion.span
                                key="win"
                                style={styles.winBadge}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                              >
                                💰 Unclaimed
                              </motion.span>
                            ) : (
                              <motion.span
                                key="lose"
                                style={styles.loseBadge}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                              >
                                ❌ No Match
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Match info */}
                        <AnimatePresence>
                          {hasDrawn && (
                            <motion.div
                              style={styles.ticketBottom}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              {isWin ? (
                                <span style={styles.matchText}>
                                  🏆 {match} digit{match !== 1 ? "s" : ""}{" "}
                                  matched
                                </span>
                              ) : (
                                <span style={styles.noMatchText}>
                                  Better luck next time
                                </span>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>

              {/* Close Button */}
              <motion.button
                onClick={() => setShowModal(false)}
                style={styles.cancelBtn}
                whileHover={{
                  background: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.15)",
                }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ==============================
// 🎨 STYLES
// ==============================
const styles = {
  // CARD
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  cardIcon: {
    fontSize: "24px",
    display: "inline-block",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffcc80",
    margin: 0,
  },
  cardDesc: {
    fontSize: "14px",
    color: "#999",
    margin: 0,
    lineHeight: "1.5",
  },

  // INPUT ROW
  inputRow: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  currentBtn: {
    padding: "12px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#ccc",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // VIEW BUTTON
  viewBtn: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #ff9800, #f57c00)",
    border: "none",
    borderRadius: "12px",
    color: "#000",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
  },

  // OVERLAY
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  // MODAL
  modal: {
    background: "#12121f",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    padding: "28px",
    width: "100%",
    maxWidth: "480px",
    maxHeight: "85vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffcc80",
    margin: 0,
  },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#aaa",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px 10px",
  },

  // BADGES
  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  badge: {
    fontSize: "12px",
    color: "#888",
    background: "rgba(255,255,255,0.05)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  badgeGreen: {
    fontSize: "12px",
    color: "#00e676",
    background: "rgba(0,200,100,0.1)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(0,200,100,0.3)",
  },
  badgeOrange: {
    fontSize: "12px",
    color: "#ffb74d",
    background: "rgba(255,152,0,0.1)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,152,0,0.3)",
  },

  // WINNING NUMBER
  winningBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  winningLabel: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "10px",
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

  // TICKET LIST
  ticketList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "320px",
    overflowY: "auto",
  },

  // EMPTY STATE
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyIcon: {
    fontSize: "40px",
    display: "block",
    marginBottom: "12px",
  },
  emptyText: {
    color: "#555",
    fontSize: "14px",
    margin: 0,
  },

  // TICKET CARD
  ticketCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  ticketTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  ticketDigitRow: {
    display: "flex",
    gap: "4px",
  },
  ticketDigit: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
  },

  // TICKET BADGES
  claimedBadge: {
    fontSize: "11px",
    color: "#00e676",
    background: "rgba(0,200,100,0.1)",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(0,200,100,0.3)",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  winBadge: {
    fontSize: "11px",
    color: "#ffb74d",
    background: "rgba(255,152,0,0.1)",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,152,0,0.3)",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  loseBadge: {
    fontSize: "11px",
    color: "#ef5350",
    background: "rgba(239,83,80,0.1)",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(239,83,80,0.3)",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  // TICKET BOTTOM
  ticketBottom: {
    paddingTop: "4px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  matchText: {
    fontSize: "12px",
    color: "#ffb74d",
    fontWeight: "600",
  },
  noMatchText: {
    fontSize: "12px",
    color: "#555",
  },

  // CANCEL BUTTON
  cancelBtn: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color: "#888",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
};