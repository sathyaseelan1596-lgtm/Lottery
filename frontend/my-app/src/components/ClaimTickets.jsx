import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function ClaimTickets({ contract, account }) {
  const [showModal, setShowModal] = useState(false);
  const [ticketIds, setTicketIds] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lotteryId, setLotteryId] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [lotteryStatus, setLotteryStatus] = useState(null);
  const [winningNumber, setWinningNumber] = useState(null);

  const getMatchDigits = (userNum, winningNum) => {
    let match = 0;
    for (let i = 0; i < 6; i++) {
      if (userNum % 10 === winningNum % 10) {
        match++;
        userNum = Math.floor(userNum / 10);
        winningNum = Math.floor(winningNum / 10);
      } else break;
    }
    return match;
  };

  // 📡 Fetch lottery
  useEffect(() => {
    if (!contract) return;
    const fetchLottery = async () => {
      try {
        const id = await contract.viewCurrentLotteryId();
        const idNum = Number(id);
        if (idNum > 0) {
          const lottery = await contract.viewLottery(idNum);
          setLotteryId(idNum);
          setEndTime(Number(lottery.endTime));
          setLotteryStatus(Number(lottery.status));
          setWinningNumber(Number(lottery.finalNumber));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLottery();
    const interval = setInterval(fetchLottery, 5000);
    return () => clearInterval(interval);
  }, [contract]);

  // ⏳ Countdown
  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft("⏰ Ended");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const prepareClaim = async () => {
    try {
      if (!contract) return toast.error("Contract not loaded");
      if (!account) return toast.error("Connect wallet first");
      if (!lotteryId) return;

      setLoading(true);
      toast.loading("Checking your tickets...", { id: "prepare" });

      const lottery = await contract.viewLottery(lotteryId);
      const status = Number(lottery.status);

      if (status !== 3) {
        setLoading(false);
        toast.dismiss("prepare");
        return toast.error("Lottery not claimable yet");
      }

      const winNum = Number(lottery.finalNumber);
      if (!winNum) {
        setLoading(false);
        toast.dismiss("prepare");
        return toast.error("Winning number not ready");
      }

      const res = await contract.viewUserInfoForLotteryId(account, lotteryId, 0, 100);
      const ids = res[0];
      const numbers = res[1];
      const statuses = res[2];

      const winIds = [];
      const winBrackets = [];

      for (let i = 0; i < numbers.length; i++) {
        if (statuses[i]) continue;
        const num = Number(numbers[i]);
        const match = getMatchDigits(num, winNum);
        if (match > 0) {
          winIds.push(Number(ids[i]));
          winBrackets.push(match - 1);
        }
      }

      toast.dismiss("prepare");

      if (winIds.length === 0) {
        setLoading(false);
        return toast("No winning tickets found", { icon: "😢" });
      }

      toast.success(`Found ${winIds.length} winning ticket${winIds.length !== 1 ? "s" : ""}!`);
      setTicketIds(winIds);
      setBrackets(winBrackets);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.dismiss("prepare");
      toast.error(err.reason || err.shortMessage || "Prepare failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setLoading(true);
      toast.loading("Submitting claim transaction...", { id: "claim" });

      const tx = await contract.claimTickets(lotteryId, ticketIds, brackets);
      toast.loading("Waiting for confirmation...", { id: "claim" });
      await tx.wait();

      toast.dismiss("claim");
      toast.success("🎉 Rewards claimed successfully!", { duration: 5000 });
      setShowModal(false);
      setTicketIds([]);
      setBrackets([]);
    } catch (err) {
      console.error(err);
      toast.dismiss("claim");
      toast.error(err.reason || err.shortMessage || "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  // Status info
  const statusMap = { 0: "Pending", 1: "Open", 2: "Closed", 3: "Claimable" };
  const statusText = statusMap[lotteryStatus] ?? "Unknown";
  const isClaimable = lotteryStatus === 3;

  const bracketLabels = [
    "Match 1", "Match 2", "Match 3",
    "Match 4", "Match 5", "Match 6",
  ];

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
        onClick={prepareClaim}
        whileHover={{ scale: 1.02, borderColor: "rgba(255,152,0,0.3)" }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          ...styles.card,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.8 : 1,
        }}
      >
        {/* Top row */}
        <div style={styles.cardTopRow}>
          <motion.span
            style={styles.roundBadge}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            🆔 Round #{lotteryId ?? "--"}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              ...styles.statusBadge,
              background: isClaimable
                ? "rgba(0,200,100,0.15)" : "rgba(255,152,0,0.1)",
              border: isClaimable
                ? "1px solid rgba(0,200,100,0.4)" : "1px solid rgba(255,152,0,0.25)",
              color: isClaimable ? "#00e676" : "#ffb74d",
            }}
          >
            {isClaimable ? "🟢 Claimable" : `🔒 ${statusText}`}
          </motion.span>
        </div>

        {/* Body */}
        <div style={styles.cardBody}>
          <motion.div
            style={styles.cardIcon}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            🎁
          </motion.div>
          <h2 style={styles.cardTitle}>Claim Rewards</h2>
          <p style={styles.cardDesc}>
            Check if your tickets won and claim your prizes instantly.
          </p>

          {/* Winning number preview */}
          {isClaimable && winningNumber ? (
            <motion.div
              style={styles.winRow}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span style={styles.winLabel}>🎯 Winning:</span>
              <div style={styles.digitRow}>
                {String(winningNumber % 1000000)
                  .padStart(6, "0")
                  .split("")
                  .map((d, i) => (
                    <motion.span
                      key={i}
                      style={styles.digitBox}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                    >
                      {d}
                    </motion.span>
                  ))}
              </div>
            </motion.div>
          ) : (
            <div style={styles.timerRow}>
              <span style={styles.timerLabel}>⏳ Draw In:</span>
              <span style={styles.timerValue}>{timeLeft || "Loading..."}</span>
            </div>
          )}

          <motion.div
            style={styles.cardCta}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {loading ? "⏳ Checking..." : "Click to Check & Claim →"}
          </motion.div>
        </div>
      </motion.div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              style={styles.modal}
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={styles.modalHeader}>
                <motion.h3
                  style={styles.modalTitle}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  🎁 Claim Rewards
                </motion.h3>
                <motion.button
                  onClick={() => setShowModal(false)}
                  style={styles.closeBtn}
                  whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>

              {/* Round badge */}
              <motion.div
                style={styles.modalInfo}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span style={styles.modalBadge}>Round #{lotteryId}</span>
                <span style={{ ...styles.modalBadge, color: "#00e676", borderColor: "rgba(0,200,100,0.3)" }}>
                  🟢 {ticketIds.length} Winning Ticket{ticketIds.length !== 1 ? "s" : ""}
                </span>
              </motion.div>

              {/* Winning number */}
              {winningNumber && (
                <motion.div
                  style={styles.winningBox}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <div style={styles.winningLabel}>🎯 Winning Number</div>
                  <div style={styles.digitRow}>
                    {String(winningNumber % 1000000)
                      .padStart(6, "0")
                      .split("")
                      .map((d, i) => (
                        <motion.span
                          key={i}
                          style={styles.digitBox}
                          initial={{ opacity: 0, rotateY: 90 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
                        >
                          {d}
                        </motion.span>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Tickets list */}
              <motion.div
                style={styles.ticketList}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div style={styles.ticketListLabel}>Your Winning Tickets</div>
                {ticketIds.map((id, i) => (
                  <motion.div
                    key={i}
                    style={styles.ticketRow}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                  >
                    <span style={styles.ticketId}>🎟️ Ticket #{id}</span>
                    <motion.span
                      style={styles.ticketBracket}
                      whileHover={{ scale: 1.05 }}
                    >
                      {bracketLabels[brackets[i]]}
                    </motion.span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Buttons */}
              <motion.button
                onClick={handleClaim}
                disabled={loading}
                style={{
                  ...styles.claimBtn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                whileHover={!loading ? { scale: 1.03, boxShadow: "0 6px 30px rgba(255,152,0,0.4)" } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {loading ? "⏳ Processing..." : "🎉 Confirm Claim"}
              </motion.button>

              <motion.button
                onClick={() => setShowModal(false)}
                style={styles.cancelBtn}
                whileHover={{ background: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                Cancel
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
    transition: "border-color 0.2s",
    userSelect: "none",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  roundBadge: {
    fontSize: "12px",
    color: "#888",
    background: "rgba(255,255,255,0.05)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  statusBadge: {
    fontSize: "12px",
    fontWeight: "700",
    padding: "4px 12px",
    borderRadius: "20px",
  },
  cardBody: {
    textAlign: "center",
  },
  cardIcon: {
    fontSize: "40px",
    marginBottom: "12px",
    display: "inline-block",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffcc80",
    margin: "0 0 8px",
  },
  cardDesc: {
    fontSize: "14px",
    color: "#999",
    marginBottom: "16px",
    lineHeight: "1.5",
  },

  // WINNING NUMBER PREVIEW ON CARD
  winRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  winLabel: {
    fontSize: "13px",
    color: "#888",
  },
  digitRow: {
    display: "flex",
    gap: "5px",
    justifyContent: "center",
  },
  digitBox: {
    width: "32px",
    height: "32px",
    background: "rgba(255,152,0,0.1)",
    border: "1px solid rgba(255,152,0,0.3)",
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffb74d",
  },

  // TIMER ON CARD
  timerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  timerLabel: {
    fontSize: "13px",
    color: "#888",
  },
  timerValue: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffb74d",
  },
  cardCta: {
    fontSize: "13px",
    color: "#ff9800",
    fontWeight: "700",
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
    maxWidth: "440px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
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
  modalInfo: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  modalBadge: {
    fontSize: "12px",
    color: "#888",
    background: "rgba(255,255,255,0.05)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  // WINNING NUMBER IN MODAL
  winningBox: {
    background: "rgba(255,152,0,0.06)",
    border: "1px solid rgba(255,152,0,0.2)",
    borderRadius: "12px",
    padding: "14px",
    textAlign: "center",
  },
  winningLabel: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "10px",
  },

  // TICKET LIST
  ticketList: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "200px",
    overflowY: "auto",
  },
  ticketListLabel: {
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px",
  },
  ticketRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  ticketId: {
    fontSize: "13px",
    color: "#ccc",
  },
  ticketBracket: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#ffb74d",
    background: "rgba(255,152,0,0.1)",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,152,0,0.25)",
  },

  // BUTTONS
  claimBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #ff9800, #f57c00)",
    border: "none",
    borderRadius: "12px",
    color: "#000",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
  },
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