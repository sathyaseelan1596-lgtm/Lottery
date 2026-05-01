import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" },
  }),
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
};

const overlayVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariant = {
  hidden: { opacity: 0, scale: 0.88, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 30,
    transition: { duration: 0.2 },
  },
};

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.3 },
  }),
};

const MAX_TICKETS = 100;
const QUICK_OPTIONS = [5, 10, 20, 50, 100];

const generateRandomTickets = (count) => {
  const tickets = new Set();
  while (tickets.size < count) {
    const suffix = Math.floor(Math.random() * 1000000);
    tickets.add(1000000 + suffix);
  }
  return Array.from(tickets);
};

// ── TimerBadge ──────────────────────────────────────────────
const TimerBadge = ({ timeLeft, isEnded, secondsLeft }) => {
  const isUrgent = !isEnded && secondsLeft > 0 && secondsLeft < 60;
  return (
    <motion.span
      style={{
        ...styles.timerBadge,
        color: isEnded ? "#ef5350" : isUrgent ? "#ff1744" : "#ffb74d",
        background: isEnded
          ? "rgba(239,83,80,0.1)"
          : isUrgent
          ? "rgba(255,23,68,0.15)"
          : "rgba(255,152,0,0.1)",
        borderColor: isEnded
          ? "rgba(239,83,80,0.25)"
          : isUrgent
          ? "rgba(255,23,68,0.4)"
          : "rgba(255,152,0,0.25)",
      }}
      animate={
        isEnded
          ? {}
          : isUrgent
          ? { opacity: [1, 0.2, 1], scale: [1, 1.05, 1] }
          : { opacity: [1, 0.5, 1] }
      }
      transition={
        isUrgent
          ? { repeat: Infinity, duration: 0.6, ease: "easeInOut" }
          : { repeat: Infinity, duration: 2 }
      }
    >
      {isEnded
        ? "⏰ Ended"
        : isUrgent
        ? `🚨 ${timeLeft}`
        : `⏳ ${timeLeft || "Loading..."}`}
    </motion.span>
  );
};

// ── CostRow ─────────────────────────────────────────────────
const CostRow = ({ label, value, highlight, index }) => (
  <motion.div
    style={styles.costRow}
    variants={rowVariant}
    initial="hidden"
    animate="visible"
    custom={index}
  >
    <span style={styles.costLabel}>{label}</span>
    <span
      style={{
        ...styles.costValue,
        ...(highlight ? { color: "#ffb74d", fontSize: "16px" } : {}),
      }}
    >
      {value}
    </span>
  </motion.div>
);

// ── TicketsViewerModal ───────────────────────────────────────
const TicketsViewerModal = ({ tickets, onClose, onReroll, disabled }) => {
  return (
    <AnimatePresence>
      <motion.div
        style={styles.ticketViewerOverlay}
        variants={overlayVariant}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          style={styles.ticketViewerModal}
          variants={modalVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={styles.tvHeader}>
            <div style={styles.tvTitleRow}>
              <motion.span
                style={styles.tvIcon}
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                🎲
              </motion.span>
              <div>
                <h3 style={styles.tvTitle}>Generated Tickets</h3>
                <p style={styles.tvSubtitle}>
                  {tickets.length} random ticket{tickets.length > 1 ? "s" : ""} ready
                </p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              style={styles.closeBtn}
              whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.12)" }}
              whileTap={{ scale: 0.92 }}
            >
              ✕
            </motion.button>
          </div>

          {/* Stats bar */}
          <motion.div
            style={styles.tvStatsBar}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div style={styles.tvStat}>
              <span style={styles.tvStatLabel}>Total Tickets</span>
              <span style={styles.tvStatValue}>{tickets.length}</span>
            </div>
            <div style={styles.tvStatDivider} />
            <div style={styles.tvStat}>
              <span style={styles.tvStatLabel}>Format</span>
              <span style={styles.tvStatValue}>7-digit</span>
            </div>
            <div style={styles.tvStatDivider} />
            <div style={styles.tvStat}>
              <span style={styles.tvStatLabel}>Type</span>
              <span style={styles.tvStatValue}>Random</span>
            </div>
          </motion.div>

          {/* Ticket Grid */}
          <div style={styles.tvScrollArea}>
            <div style={styles.tvGrid}>
              {tickets.map((ticket, i) => (
                <motion.div
                  key={`view-ticket-${ticket}-${i}`}
                  style={styles.tvTicketCard}
                  initial={{ opacity: 0, scale: 0.7, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.015, 0.6),
                    duration: 0.25,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  whileHover={{
                    scale: 1.06,
                    borderColor: "rgba(0,230,118,0.5)",
                    boxShadow: "0 4px 16px rgba(0,230,118,0.18)",
                    y: -2,
                  }}
                >
                  <span style={styles.tvTicketIndex}>#{i + 1}</span>
                  <span style={styles.tvTicketNumber}>{ticket}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div style={styles.tvFooter}>
            <motion.button
              onClick={onReroll}
              disabled={disabled}
              style={styles.tvRerollBtn}
              whileHover={!disabled ? { scale: 1.03, y: -1 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
            >
              🔄 Re-roll All
            </motion.button>
            <motion.button
              onClick={onClose}
              style={styles.tvCloseBtn}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              ✓ Done
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================
// 🏆 MAIN COMPONENT
// ============================================================
export default function BuyTickets({ contract }) {
  // ── Manual buy state ──
  const [showModal, setShowModal] = useState(false);
  const [numbers, setNumbers] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);

  // ── Instant buy state ──
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [instantCount, setInstantCount] = useState(5);
  const [instantTickets, setInstantTickets] = useState([]);
  const [instantLoading, setInstantLoading] = useState(false);
  const [showTicketViewer, setShowTicketViewer] = useState(false);

  // ── Shared state ──
  const [lotteryId, setLotteryId] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [ticketPrice, setTicketPrice] = useState(null);
  const [isEnded, setIsEnded] = useState(false);

  const parseTicketNumbers = (raw) =>
    raw
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .map((n) => parseInt(`1${n}`, 10))
      .filter((n) => !isNaN(n));

  const regenerateTickets = useCallback((count) => {
    const clamped = Math.min(Math.max(1, count), MAX_TICKETS);
    setInstantCount(clamped);
    setInstantTickets(generateRandomTickets(clamped));
  }, []);

  useEffect(() => {
    if (!contract) return;
    const fetchLottery = async () => {
      try {
        const id = await contract.viewCurrentLotteryId();
        if (id > 0) {
          const lottery = await contract.viewLottery(id);
          setLotteryId(Number(id));
          setEndTime(Number(lottery.endTime));
          setTicketPrice(lottery.priceTicketInCake);
          if (Number(lottery.endTime) < Math.floor(Date.now() / 1000)) {
            setIsEnded(true);
            setTimeLeft("Ended");
            setSecondsLeft(0);
          } else {
            setIsEnded(false);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch lottery data");
      }
    };
    fetchLottery();
    const interval = setInterval(fetchLottery, 5000);
    return () => clearInterval(interval);
  }, [contract]);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft("Ended");
        setSecondsLeft(0);
        setIsEnded(true);
        clearInterval(interval);
        return;
      }
      setSecondsLeft(diff);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  useEffect(() => {
    setTicketCount(parseTicketNumbers(numbers).length);
  }, [numbers]);

  const executePurchase = async (ticketNumbers, setLoadingFn, onSuccess) => {
    const toastId = toast.loading("🎟️ Preparing purchase...");
    try {
      setLoadingFn(true);
      const lottery = await contract.viewLottery(lotteryId);
      const totalCost = await contract.calculateTotalPriceForBulkTickets(
        lottery.discountDivisor,
        lottery.priceTicketInCake,
        ticketNumbers.length
      );
      const cakeTokenAddress = await contract.cakeToken();
      const signer = contract.runner;
      const cakeToken = new ethers.Contract(
        cakeTokenAddress,
        ["function approve(address spender, uint256 amount) external returns (bool)"],
        signer
      );
      toast.loading("✅ Approving CAKE spend...", { id: toastId });
      await (await cakeToken.approve(contract.target, totalCost)).wait();
      toast.loading("⛓️ Buying tickets on-chain...", { id: toastId });
      await (await contract.buyTickets(lotteryId, ticketNumbers)).wait();
      toast.success(
        `🎉 ${ticketNumbers.length} ticket${ticketNumbers.length > 1 ? "s" : ""} purchased!`,
        { id: toastId }
      );
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(err.reason || "Purchase failed ❌", { id: toastId });
    } finally {
      setLoadingFn(false);
    }
  };

  const handleBuy = async () => {
    if (!numbers.trim()) { toast.error("Please enter ticket numbers"); return; }
    const ticketNumbers = parseTicketNumbers(numbers);
    if (ticketNumbers.length === 0) { toast.error("No valid numbers found"); return; }
    if (ticketNumbers.length > MAX_TICKETS) { toast.error(`Maximum ${MAX_TICKETS} tickets per purchase`); return; }
    const invalid = ticketNumbers.find((n) => n < 1000000 || n > 1999999);
    if (invalid !== undefined) { toast.error("Each suffix must be exactly 6 digits (000000 – 999999)"); return; }
    await executePurchase(ticketNumbers, setLoading, () => {
      setShowModal(false);
      setNumbers("");
    });
  };

  const handleInstantBuy = async () => {
    if (instantTickets.length === 0) { toast.error("No tickets generated"); return; }
    await executePurchase(instantTickets, setInstantLoading, () => {
      setShowInstantModal(false);
      setInstantTickets([]);
      setInstantCount(5);
      setShowTicketViewer(false);
    });
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => { if (!loading) setShowModal(false); };
  const openInstantModal = () => { regenerateTickets(instantCount); setShowInstantModal(true); };
  const closeInstantModal = () => {
    if (!instantLoading) {
      setShowInstantModal(false);
      setShowTicketViewer(false);
    }
  };

  const pricePerTicket = ticketPrice ? Number(ethers.formatEther(ticketPrice)) : 0;
  const manualEstTotal = ticketPrice && ticketCount > 0 ? (pricePerTicket * ticketCount).toFixed(2) : null;
  const instantEstTotal = ticketPrice && instantCount > 0 ? (pricePerTicket * instantCount).toFixed(2) : null;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1a2e",
            color: "#fff",
            border: "1px solid rgba(255,152,0,0.3)",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
          },
          success: { iconTheme: { primary: "#00e676", secondary: "#000" } },
          error: { iconTheme: { primary: "#ef5350", secondary: "#fff" } },
          loading: { iconTheme: { primary: "#ffb74d", secondary: "#000" } },
        }}
      />

      {/* ── CARDS ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isEnded ? (
          <motion.div
            key="ended"
            style={styles.endedCard}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              style={styles.endedIcon}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              ❌
            </motion.div>
            <h3 style={styles.endedTitle}>Round Ended</h3>
            <p style={styles.endedText}>Wait for the next round to start.</p>
          </motion.div>
        ) : (
          <motion.div
            key="cards-row"
            style={styles.cardsRow}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* MANUAL BUY CARD */}
            <motion.div
              onClick={openModal}
              style={styles.card}
              whileHover={{
                scale: 1.02,
                borderColor: "rgba(255,152,0,0.35)",
                boxShadow: "0 8px 32px rgba(255,152,0,0.12)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div style={styles.cardTopRow}>
                <motion.span style={styles.roundBadge} whileHover={{ scale: 1.05 }}>
                  🆔 Round #{lotteryId ?? "--"}
                </motion.span>
                <TimerBadge timeLeft={timeLeft} isEnded={isEnded} secondsLeft={secondsLeft} />
              </div>
              <div style={styles.cardBody}>
                <motion.div
                  style={styles.cardIcon}
                  animate={{ rotate: [0, -8, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                >
                  🎟️
                </motion.div>
                <h2 style={styles.cardTitle}>Buy Tickets</h2>
                <p style={styles.cardDesc}>Pick your own lucky numbers manually.</p>
                {ticketPrice && (
                  <motion.div
                    style={styles.priceTag}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    💰 {ethers.formatEther(ticketPrice)} CAKE / ticket
                  </motion.div>
                )}
                <motion.div
                  style={styles.cardCta}
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                  Choose Numbers →
                </motion.div>
              </div>
            </motion.div>

            {/* INSTANT BUY CARD */}
            <motion.div
              onClick={openInstantModal}
              style={styles.card}
              whileHover={{
                scale: 1.02,
                borderColor: "rgba(0,230,118,0.35)",
                boxShadow: "0 8px 32px rgba(0,230,118,0.12)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div style={styles.cardTopRow}>
                <motion.span
                  style={{ ...styles.roundBadge, color: "#66bb6a", borderColor: "rgba(0,230,118,0.15)" }}
                  whileHover={{ scale: 1.05 }}
                >
                  ⚡ Instant
                </motion.span>
                <motion.span
                  style={{
                    ...styles.timerBadge,
                    color: "#66bb6a",
                    background: "rgba(0,230,118,0.1)",
                    borderColor: "rgba(0,230,118,0.25)",
                  }}
                >
                  Max {MAX_TICKETS}
                </motion.span>
              </div>
              <div style={styles.cardBody}>
                <motion.div
                  style={styles.cardIcon}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  🎲
                </motion.div>
                <h2 style={{ ...styles.cardTitle, color: "#a5d6a7" }}>Instant Buy</h2>
                <p style={styles.cardDesc}>Random lucky numbers generated instantly.</p>
                {ticketPrice && (
                  <motion.div
                    style={{
                      ...styles.priceTag,
                      background: "rgba(0,230,118,0.1)",
                      border: "1px solid rgba(0,230,118,0.25)",
                      color: "#66bb6a",
                    }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    💰 {ethers.formatEther(ticketPrice)} CAKE / ticket
                  </motion.div>
                )}
                <motion.div
                  style={{ ...styles.cardCta, color: "#00e676" }}
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                  Quick Buy →
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MANUAL BUY MODAL
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            style={styles.overlay}
            variants={overlayVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div
              style={styles.modal}
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>🎟️ Buy Tickets</h3>
                <motion.button
                  onClick={closeModal}
                  style={styles.closeBtn}
                  whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.12)" }}
                  whileTap={{ scale: 0.92 }}
                  disabled={loading}
                >
                  ✕
                </motion.button>
              </div>

              <div style={styles.modalInfo}>
                {[`Round #${lotteryId}`, timeLeft ? `⏳ ${timeLeft}` : "Loading..."].map((text, i) => (
                  <motion.span
                    key={text}
                    style={styles.modalBadge}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    {text}
                  </motion.span>
                ))}
              </div>

              <motion.div
                style={styles.instructionBox}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <p style={styles.instructionText}>
                  Enter your <b style={{ color: "#ffb74d" }}>6-digit</b> lucky numbers separated by commas.
                  The leading <b style={{ color: "#ffb74d" }}>1</b> is added automatically.
                </p>
                <p style={{ ...styles.instructionText, marginTop: "6px", opacity: 0.7 }}>
                  Example: <b style={{ color: "#ffb74d" }}>234567</b> → ticket{" "}
                  <b style={{ color: "#ffb74d" }}>1234567</b>
                  {" · "}Max <b style={{ color: "#ffb74d" }}>{MAX_TICKETS}</b> tickets
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <label style={styles.inputLabel}>Your Numbers</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputPrefix}>1–</span>
                  <motion.input
                    placeholder="e.g. 123456, 987654"
                    value={numbers}
                    onChange={(e) => setNumbers(e.target.value)}
                    style={styles.input}
                    disabled={loading}
                    whileFocus={{ borderColor: "rgba(255,152,0,0.5)", boxShadow: "0 0 0 3px rgba(255,152,0,0.1)" }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </motion.div>

              <AnimatePresence>
                {ticketCount > 0 && ticketPrice && (
                  <motion.div
                    style={styles.costPreview}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CostRow index={0} label="Tickets" value={ticketCount} />
                    <CostRow index={1} label="Price per ticket" value={`${ethers.formatEther(ticketPrice)} CAKE`} />
                    <motion.div style={styles.costDivider} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.15 }} />
                    <CostRow index={2} label="Est. Total" value={`~${manualEstTotal} CAKE`} highlight />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={handleBuy}
                disabled={loading}
                style={{ ...styles.buyBtn, opacity: loading ? 0.65 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                whileHover={!loading ? { scale: 1.03, y: -2 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span key="loading" style={styles.btnInner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-block" }}>⏳</motion.span>
                      Processing...
                    </motion.span>
                  ) : (
                    <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      🎟️ Confirm Purchase
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                onClick={closeModal}
                style={styles.cancelBtn}
                disabled={loading}
                whileHover={!loading ? { scale: 1.02, background: "rgba(255,255,255,0.08)" } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          INSTANT BUY MODAL
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showInstantModal && (
          <motion.div
            style={styles.overlay}
            variants={overlayVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeInstantModal}
          >
            <motion.div
              style={styles.modal}
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={styles.modalHeader}>
                <h3 style={{ ...styles.modalTitle, color: "#a5d6a7" }}>🎲 Instant Buy</h3>
                <motion.button
                  onClick={closeInstantModal}
                  style={styles.closeBtn}
                  whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.12)" }}
                  whileTap={{ scale: 0.92 }}
                  disabled={instantLoading}
                >
                  ✕
                </motion.button>
              </div>

              {/* Info badges */}
              <div style={styles.modalInfo}>
                {[
                  `Round #${lotteryId}`,
                  timeLeft ? `⏳ ${timeLeft}` : "Loading...",
                  `🎲 ${instantCount} ticket${instantCount > 1 ? "s" : ""}`,
                ].map((text, i) => (
                  <motion.span
                    key={`${text}-${i}`}
                    style={styles.modalBadge}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    {text}
                  </motion.span>
                ))}
              </div>

              {/* Instructions */}
              <motion.div
                style={{ ...styles.instructionBox, background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.2)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <p style={styles.instructionText}>
                  Choose how many tickets to buy. Random numbers are generated automatically. Max{" "}
                  <b style={{ color: "#66bb6a" }}>{MAX_TICKETS}</b> tickets per purchase.
                </p>
              </motion.div>

              {/* Quick Select */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <label style={styles.inputLabel}>Quick Select</label>
                <div style={styles.quickGrid}>
                  {QUICK_OPTIONS.map((qty, i) => (
                    <motion.button
                      key={qty}
                      onClick={() => { regenerateTickets(qty); }}
                      style={{ ...styles.quickBtn, ...(instantCount === qty ? styles.quickBtnActive : {}) }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={instantLoading}
                    >
                      {qty}x
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Custom Amount */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <label style={styles.inputLabel}>Or enter custom amount (1–{MAX_TICKETS})</label>
                <div style={styles.customRow}>
                  <div style={{ ...styles.inputWrapper, flex: 1 }}>
                    <motion.input
                      type="number"
                      min={1}
                      max={MAX_TICKETS}
                      value={instantCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        regenerateTickets(val);
                      }}
                      style={{ ...styles.input, textAlign: "center", padding: "12px 16px" }}
                      disabled={instantLoading}
                      whileFocus={{ borderColor: "rgba(0,230,118,0.5)", boxShadow: "0 0 0 3px rgba(0,230,118,0.1)" }}
                    />
                  </div>
                  <motion.button
                    onClick={() => regenerateTickets(instantCount)}
                    style={styles.rerollBtn}
                    whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.08)" }}
                    whileTap={{ scale: 0.95 }}
                    disabled={instantLoading}
                    title="Re-roll numbers"
                  >
                    🔄 Re-roll
                  </motion.button>
                </div>
              </motion.div>

              {/* ── View Generated Tickets BUTTON ────────── */}
              {instantTickets.length > 0 && (
                <motion.button
                  onClick={() => setShowTicketViewer(true)}
                  style={styles.viewTicketsBtn}
                  whileHover={{ background: "rgba(0,230,118,0.1)", scale: 1.01, borderColor: "rgba(0,230,118,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ marginRight: "8px", display: "inline-block" }}
                  >
                    🎲
                  </motion.span>
                  View {instantTickets.length} Generated Ticket{instantTickets.length > 1 ? "s" : ""}
                  <span style={styles.viewArrow}>→</span>
                </motion.button>
              )}

              {/* Cost Preview */}
              <AnimatePresence>
                {instantCount > 0 && ticketPrice && (
                  <motion.div
                    style={styles.costPreview}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CostRow index={0} label="Tickets" value={instantCount} />
                    <CostRow index={1} label="Price per ticket" value={`${ethers.formatEther(ticketPrice)} CAKE`} />
                    <motion.div style={styles.costDivider} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.15 }} />
                    <CostRow index={2} label="Est. Total" value={`~${instantEstTotal} CAKE`} highlight />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm Button */}
              <motion.button
                onClick={handleInstantBuy}
                disabled={instantLoading}
                style={{
                  ...styles.buyBtn,
                  background: "linear-gradient(135deg, #00e676, #00c853)",
                  opacity: instantLoading ? 0.65 : 1,
                  cursor: instantLoading ? "not-allowed" : "pointer",
                }}
                whileHover={!instantLoading ? { scale: 1.03, y: -2 } : {}}
                whileTap={!instantLoading ? { scale: 0.97 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <AnimatePresence mode="wait">
                  {instantLoading ? (
                    <motion.span key="loading" style={styles.btnInner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-block" }}>⏳</motion.span>
                      Processing...
                    </motion.span>
                  ) : (
                    <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      🎲 Buy {instantCount} Random Ticket{instantCount > 1 ? "s" : ""}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                onClick={closeInstantModal}
                style={styles.cancelBtn}
                disabled={instantLoading}
                whileHover={!instantLoading ? { scale: 1.02, background: "rgba(255,255,255,0.08)" } : {}}
                whileTap={!instantLoading ? { scale: 0.97 } : {}}
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          TICKETS VIEWER POPUP
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTicketViewer && (
          <TicketsViewerModal
            tickets={instantTickets}
            onClose={() => setShowTicketViewer(false)}
            onReroll={() => regenerateTickets(instantCount)}
            disabled={instantLoading}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// 🎨 STYLES
// ============================================================
const styles = {
  cardsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },

  endedCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "16px",
    padding: "40px 24px",
    textAlign: "center",
    opacity: 0.6,
    cursor: "not-allowed",
  },
  endedIcon: { fontSize: "32px", marginBottom: "8px", opacity: 0.5 },
  endedTitle: { fontSize: "18px", fontWeight: "700", color: "#888", margin: "0 0 8px" },
  endedText: { fontSize: "13px", color: "#666", margin: 0 },

  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "24px",
    cursor: "pointer",
    userSelect: "none",
  },
  cardTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  roundBadge: {
    fontSize: "12px",
    color: "#888",
    background: "rgba(255,255,255,0.05)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  timerBadge: {
    fontSize: "13px",
    fontWeight: "700",
    padding: "4px 12px",
    borderRadius: "20px",
    border: "1px solid",
    display: "inline-block",
  },
  cardBody: { textAlign: "center" },
  cardIcon: { fontSize: "40px", marginBottom: "12px", display: "inline-block" },
  cardTitle: { fontSize: "20px", fontWeight: "800", color: "#ffcc80", margin: "0 0 8px" },
  cardDesc: { fontSize: "14px", color: "#999", marginBottom: "16px", lineHeight: "1.5" },
  priceTag: {
    display: "inline-block",
    background: "rgba(255,152,0,0.1)",
    border: "1px solid rgba(255,152,0,0.25)",
    color: "#ffb74d",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  cardCta: { fontSize: "13px", color: "#ff9800", fontWeight: "700", letterSpacing: "0.5px", display: "inline-block" },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "16px",
  },
  modal: {
    background: "#12121f",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    padding: "28px",
    width: "100%",
    maxWidth: "420px",
    maxHeight: "90vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: "20px", fontWeight: "800", color: "#ffcc80", margin: 0 },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#aaa",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px 10px",
  },
  modalInfo: { display: "flex", gap: "8px", flexWrap: "wrap" },
  modalBadge: {
    fontSize: "12px",
    color: "#888",
    background: "rgba(255,255,255,0.05)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  instructionBox: {
    background: "rgba(255,152,0,0.06)",
    border: "1px solid rgba(255,152,0,0.2)",
    borderRadius: "10px",
    padding: "12px 16px",
  },
  instructionText: { fontSize: "13px", color: "#bbb", margin: 0, lineHeight: "1.6" },

  inputLabel: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    display: "block",
    marginBottom: "6px",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  inputPrefix: {
    padding: "12px 0 12px 14px",
    color: "#ffb74d",
    fontWeight: "700",
    fontSize: "14px",
    whiteSpace: "nowrap",
    userSelect: "none",
  },
  input: {
    flex: 1,
    padding: "12px 16px 12px 6px",
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },

  quickGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" },
  quickBtn: {
    padding: "12px 8px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#aaa",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  quickBtnActive: {
    background: "rgba(0,230,118,0.15)",
    border: "1px solid rgba(0,230,118,0.4)",
    color: "#00e676",
    boxShadow: "0 0 12px rgba(0,230,118,0.15)",
  },

  customRow: { display: "flex", gap: "8px", alignItems: "center" },
  rerollBtn: {
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#aaa",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // ── VIEW TICKETS BUTTON (redesigned) ──
  viewTicketsBtn: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(0,230,118,0.06)",
    border: "1px solid rgba(0,230,118,0.25)",
    borderRadius: "12px",
    color: "#66bb6a",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    letterSpacing: "0.3px",
  },
  viewArrow: {
    marginLeft: "auto",
    fontSize: "16px",
    color: "#00e676",
  },

  costPreview: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflow: "hidden",
  },
  costRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  costLabel: { fontSize: "13px", color: "#888" },
  costValue: { fontSize: "14px", fontWeight: "700", color: "#ccc" },
  costDivider: { borderTop: "1px solid rgba(255,255,255,0.07)", margin: "2px 0" },

  buyBtn: {
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
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
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

  // ══════════════════════════════════════════════════════
  // TICKET VIEWER MODAL STYLES
  // ══════════════════════════════════════════════════════
  ticketViewerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000, // above instant modal
    padding: "16px",
  },
  ticketViewerModal: {
    background: "#0e1520",
    border: "1px solid rgba(0,230,118,0.2)",
    borderRadius: "24px",
    padding: "28px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "88vh",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    boxShadow: "0 0 60px rgba(0,230,118,0.12), 0 24px 64px rgba(0,0,0,0.8)",
  },

  tvHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tvTitleRow: { display: "flex", alignItems: "center", gap: "14px" },
  tvIcon: { fontSize: "36px", display: "inline-block" },
  tvTitle: { fontSize: "20px", fontWeight: "800", color: "#a5d6a7", margin: "0 0 4px" },
  tvSubtitle: { fontSize: "13px", color: "#66bb6a", margin: 0, opacity: 0.8 },

  tvStatsBar: {
    display: "flex",
    background: "rgba(0,230,118,0.06)",
    border: "1px solid rgba(0,230,118,0.15)",
    borderRadius: "12px",
    padding: "12px 20px",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tvStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  tvStatLabel: { fontSize: "11px", color: "#66bb6a", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.8px" },
  tvStatValue: { fontSize: "18px", fontWeight: "800", color: "#00e676" },
  tvStatDivider: { width: "1px", height: "32px", background: "rgba(0,230,118,0.2)" },

  tvScrollArea: {
    overflowY: "auto",
    maxHeight: "380px",
    borderRadius: "12px",
    border: "1px solid rgba(0,230,118,0.12)",
    background: "rgba(0,0,0,0.2)",
    padding: "12px",
  },
  tvGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "8px",
  },
  tvTicketCard: {
    background: "rgba(0,230,118,0.06)",
    border: "1px solid rgba(0,230,118,0.2)",
    borderRadius: "10px",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    cursor: "default",
  },
  tvTicketIndex: {
    fontSize: "10px",
    color: "#66bb6a",
    opacity: 0.6,
    fontWeight: "600",
    letterSpacing: "0.5px",
  },
  tvTicketNumber: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#a5d6a7",
    fontFamily: "monospace",
    letterSpacing: "1px",
  },

  tvFooter: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  tvRerollBtn: {
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#aaa",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },
  tvCloseBtn: {
    padding: "12px",
    background: "linear-gradient(135deg, #00e676, #00c853)",
    border: "none",
    borderRadius: "12px",
    color: "#000",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
  },
};