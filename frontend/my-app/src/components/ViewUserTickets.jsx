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
      setLotteryId(String(id)); // Store as string for keys
      toast.dismiss("current");
      toast.success(`Lottery #${Number(id)} loaded`);
    } catch (err) {
      console.error(err);
      toast.dismiss("current");
      toast.error("Failed to get current lottery");
    }
  };

  const hasDrawn = finalNumber !== null && finalNumber !== 0;
  const winningDigits = hasDrawn
    ? String(finalNumber % 1000000).padStart(6, "0").split("")
    : null;

  const totalWon = tickets.filter(
    (t) => hasDrawn && getMatchDigits(Number(t), finalNumber) > 0
  ).length;

  const totalClaimed = statuses.filter(Boolean).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const ticketVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <>
      <Toaster position="top-right" />

      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={styles.cardHeader}>
          <div style={styles.cardHeaderLeft}>
            <span style={styles.cardIcon}>📋</span>
            <h2 style={styles.cardTitle}>My Tickets</h2>
          </div>
        </div>

        <p style={styles.cardDesc}>Enter a lottery round ID to view your results.</p>

        <div style={styles.inputRow}>
          <input
            placeholder="Lottery ID..."
            value={lotteryId}
            onChange={(e) => setLotteryId(e.target.value)}
            style={styles.input}
          />
          <button onClick={useCurrentLottery} style={styles.currentBtn}>Current</button>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          style={{ ...styles.viewBtn, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Loading..." : "📋 View My Tickets"}
        </button>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal-overlay"
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              key="modal-content"
              style={styles.modal}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Round #{lotteryId}</h3>
                <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
              </div>

              <div style={styles.badgeRow}>
                <AnimatePresence mode="popLayout">
                  {totalWon > 0 && (
                    <motion.span key="win-badge" style={styles.badgeGreen} initial={{ opacity: 0, s: 0.5 }} animate={{ opacity: 1, s: 1 }}>
                      🏆 {totalWon} Won
                    </motion.span>
                  )}
                  {totalClaimed > 0 && (
                    <motion.span key="claim-badge" style={styles.badgeOrange} initial={{ opacity: 0, s: 0.5 }} animate={{ opacity: 1, s: 1 }}>
                      ✅ {totalClaimed} Claimed
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div style={styles.winningBox}>
                <div style={styles.winningLabel}>🎯 Winning Number</div>
                <div style={styles.digitRow}>
                  {(winningDigits || [..."------"]).map((d, i) => (
                    <motion.span
                      key={`win-digit-${lotteryId}-${i}`}
                      style={{ ...styles.digitBox, opacity: hasDrawn ? 1 : 0.3 }}
                    >
                      {d}
                    </motion.span>
                  ))}
                </div>
              </div>

              <motion.div
                style={styles.ticketList}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {tickets.length === 0 ? (
                  <div style={styles.emptyState}>No tickets found</div>
                ) : (
                  tickets.map((t, i) => {
                    const num = Number(t);
                    const match = hasDrawn ? getMatchDigits(num, finalNumber) : 0;
                    const isWin = match > 0;
                    const tDigits = String(num % 1000000).padStart(6, "0").split("");

                    return (
                      <motion.div
                        key={`ticket-${lotteryId || 'none'}-${i}`}
                        variants={ticketVariants}
                        style={{
                          ...styles.ticketCard,
                          borderColor: isWin ? "rgba(255,152,0,0.3)" : "rgba(255,255,255,0.05)"
                        }}
                      >
                        <div style={styles.ticketTop}>
                          <div style={styles.ticketDigitRow}>
                            {tDigits.map((d, di) => {
                              const isMatch = hasDrawn && di >= (6 - match);
                              return (
                                <span
                                  key={`digit-${lotteryId}-${i}-${di}`}
                                  style={{
                                    ...styles.ticketDigit,
                                    color: isMatch ? "#ffb74d" : "#555",
                                    borderColor: isMatch ? "#ffb74d" : "rgba(255,255,255,0.1)",
                                    background: isMatch ? "rgba(255,152,0,0.1)" : "transparent"
                                  }}
                                >
                                  {d}
                                </span>
                              );
                            })}
                          </div>
                          <span style={isWin ? styles.winBadge : styles.loseBadge}>
                            {statuses[i] ? "✅ Claimed" : isWin ? "💰 Win" : "❌ No Match"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const styles = {
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" },
  cardHeader: { display: "flex", alignItems: "center", gap: "10px" },
  cardTitle: { fontSize: "18px", fontWeight: "800", color: "#ffcc80", margin: 0 },
  cardDesc: { fontSize: "13px", color: "#888", margin: 0 },
  inputRow: { display: "flex", gap: "8px" },
  input: { flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" },
  currentBtn: { padding: "0 12px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", color: "#ccc", cursor: "pointer" },
  viewBtn: { width: "100%", padding: "12px", background: "linear-gradient(135deg, #ff9800, #f57c00)", border: "none", borderRadius: "10px", color: "#000", fontWeight: "800", cursor: "pointer" },
  overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#12121f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "24px", width: "90%", maxWidth: "440px", maxHeight: "80vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  modalTitle: { margin: 0, color: "#ffcc80" },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" },
  badgeRow: { display: "flex", gap: "8px", marginBottom: "16px" },
  badgeGreen: { fontSize: "11px", color: "#00e676", background: "rgba(0,200,100,0.1)", padding: "4px 10px", borderRadius: "12px" },
  badgeOrange: { fontSize: "11px", color: "#ffb74d", background: "rgba(255,152,0,0.1)", padding: "4px 10px", borderRadius: "12px" },
  winningBox: { background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", textAlign: "center", marginBottom: "16px" },
  digitRow: { display: "flex", gap: "6px", justifyContent: "center" },
  digitBox: { width: "32px", height: "32px", background: "rgba(255,152,0,0.1)", border: "1px solid rgba(255,152,0,0.3)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "#ffb74d" },
  ticketList: { display: "flex", flexDirection: "column", gap: "8px" },
  ticketCard: { background: "rgba(255,255,255,0.02)", border: "1px solid", padding: "12px", borderRadius: "10px" },
  ticketTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  ticketDigitRow: { display: "flex", gap: "4px" },
  ticketDigit: { width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", border: "1px solid", borderRadius: "4px" },
  winBadge: { fontSize: "10px", color: "#ffb74d", fontWeight: "bold" },
  loseBadge: { fontSize: "10px", color: "#444" },
  emptyState: { textAlign: "center", color: "#555", padding: "20px" }
};