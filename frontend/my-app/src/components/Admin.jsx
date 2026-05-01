import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ============================================================
// 🎨 ANIMATIONS
// ============================================================
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" },
  }),
};

const digitVariant = {
  hidden: { opacity: 0, y: -20, scale: 0.6 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      type: "spring",
      stiffness: 300,
      damping: 18,
    },
  }),
};

const modalOverlayVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalContentVariant = {
  hidden: { opacity: 0, scale: 0.85, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } },
};

// ============================================================
// 🧩 HELPERS
// ============================================================
const shortAddr = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—";

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
};

const formatTicketNumber = (num) => {
  if (num === null || num === undefined) return "------";
  const s = String(num);
  if (s.length === 7 && s.startsWith("1")) return s.slice(1);
  return s.padStart(6, "0");
};

const ticketDigits = (num) => formatTicketNumber(num).split("");

// ============================================================
// 🧩 DETAIL MODAL
// ============================================================
const DetailModal = ({ isOpen, onClose, title, subtitle, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        style={styles.modalOverlay}
        variants={modalOverlayVariant}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          style={styles.modalBox}
          variants={modalContentVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.modalHeader}>
            <div>
              <div style={styles.modalTitle}>{title}</div>
              {subtitle && (
                <div style={styles.modalSubtitle}>{subtitle}</div>
              )}
            </div>
            <motion.button
              style={styles.modalClose}
              onClick={onClose}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          </div>
          <div style={styles.modalBody}>{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================
// 🔍 SEARCH BAR
// ============================================================
const SearchBar = ({ value, onChange, placeholder }) => (
  <div style={styles.searchWrap}>
    <span style={styles.searchIcon}>🔍</span>
    <input
      style={styles.searchInput}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "Search..."}
    />
    {value && (
      <motion.button
        style={styles.searchClear}
        onClick={() => onChange("")}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        ✕
      </motion.button>
    )}
  </div>
);

// ============================================================
// 🔢 MINI DIGITS
// ============================================================
const MiniDigits = ({ number, winningNumber }) => {
  const digs = ticketDigits(number);
  const winDigs = winningNumber ? ticketDigits(winningNumber) : null;

  let totalMatches = 0;
  if (winDigs) {
    for (let k = 5; k >= 0; k--) {
      if (digs[k] === winDigs[k]) totalMatches++;
      else break;
    }
  }

  return (
    <div style={styles.miniDigitRow}>
      {digs.map((d, i) => {
        const isMatch = winDigs && i >= 6 - totalMatches;
        return (
          <span
            key={i}
            style={{
              ...styles.miniDigit,
              color: isMatch ? "#00e676" : "#aaa",
              background: isMatch
                ? "rgba(0,230,118,0.15)"
                : "rgba(255,255,255,0.05)",
              borderColor: isMatch
                ? "rgba(0,230,118,0.4)"
                : "rgba(255,255,255,0.1)",
              fontWeight: isMatch ? "800" : "400",
              boxShadow: isMatch ? "0 0 8px rgba(0,230,118,0.2)" : "none",
            }}
          >
            {d}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================
// 📍 ADDRESS ROW
// ============================================================
const AddressRow = ({ address, badge, extra, index }) => (
  <motion.div
    style={styles.addressRow}
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04 }}
  >
    <div style={styles.addressIndex}>#{index + 1}</div>
    <div style={styles.addressMain}>
      <span style={styles.addressShort}>{shortAddr(address)}</span>
    </div>
    {badge && <div style={styles.addressBadge}>{badge}</div>}
    {extra && <div style={styles.addressExtra}>{extra}</div>}
    <motion.button
      style={styles.copyBtn}
      onClick={() => copyToClipboard(address)}
      whileHover={{ scale: 1.1, background: "rgba(255,152,0,0.25)" }}
      whileTap={{ scale: 0.9 }}
      title="Copy address"
    >
      📋
    </motion.button>
  </motion.div>
);

// ============================================================
// 🎫 TICKET ROW
// ============================================================
const TicketRow = ({ ticket, index, winningNumber }) => {
  const [expanded, setExpanded] = useState(false);
  const hasNumber =
    ticket.ticketNumber !== undefined && ticket.ticketNumber !== null;

  const bracketMatch = (() => {
    if (!hasNumber || !winningNumber) return null;
    const tDigs = ticketDigits(ticket.ticketNumber);
    const wDigs = ticketDigits(winningNumber);
    let match = 0;
    for (let k = 5; k >= 0; k--) {
      if (tDigs[k] === wDigs[k]) match++;
      else break;
    }
    return match;
  })();

  return (
    <motion.div
      style={styles.ticketRowEnhanced}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div style={styles.ticketRowHeader}>
        <div style={styles.ticketIdBadge}>
          🎫 #{ticket.ticketId ?? index + 1}
        </div>

        <div style={styles.ticketOwnerWrap}>
          <span style={styles.ticketLabel}>Owner</span>
          <div style={styles.ticketAddressRow}>
            <span style={styles.ticketAddress}>{shortAddr(ticket.owner)}</span>
            <motion.button
              style={styles.copyBtnSm}
              onClick={() => copyToClipboard(ticket.owner)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              📋
            </motion.button>
          </div>
        </div>

        {hasNumber && (
          <div style={styles.ticketNumWrap}>
            <span style={styles.ticketLabel}>Number</span>
            <MiniDigits
              number={ticket.ticketNumber}
              winningNumber={winningNumber}
            />
          </div>
        )}

        {hasNumber && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={styles.ticketLabel}>Raw</span>
            <span style={styles.rawNumber}>{ticket.ticketNumber}</span>
          </div>
        )}

        {bracketMatch !== null && bracketMatch > 0 && (
          <div style={styles.bracketMatchBadge}>
            ✅ {bracketMatch} match{bracketMatch !== 1 ? "es" : ""}
          </div>
        )}

        {ticket.amount && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={styles.ticketLabel}>Reward</span>
            <span style={{ color: "#00e676", fontWeight: 700, fontSize: "13px" }}>
              {ethers.formatEther(ticket.amount)} CAKE
            </span>
          </div>
        )}

        {ticket.bracket !== undefined && ticket.bracket !== null && (
          <div style={styles.bracketPill}>Bracket #{ticket.bracket + 1}</div>
        )}

        {(hasNumber || ticket.amount) && (
          <motion.button
            style={styles.expandBtn}
            onClick={() => setExpanded((p) => !p)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: expanded ? 180 : 0 }}
          >
            ▼
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            style={styles.ticketExpandBody}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={styles.ticketDetailGrid}>
              <div style={styles.ticketDetailItem}>
                <span style={styles.ticketLabel}>Ticket ID</span>
                <span style={styles.ticketDetailValue}>
                  #{ticket.ticketId ?? index + 1}
                </span>
              </div>
              <div style={styles.ticketDetailItem}>
                <span style={styles.ticketLabel}>Full Address</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ ...styles.ticketDetailValue, fontSize: "11px", wordBreak: "break-all" }}>
                    {ticket.owner}
                  </span>
                  <motion.button
                    style={styles.copyBtnSm}
                    onClick={() => copyToClipboard(ticket.owner)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    📋
                  </motion.button>
                </div>
              </div>
              {hasNumber && (
                <>
                  <div style={styles.ticketDetailItem}>
                    <span style={styles.ticketLabel}>Ticket Number (raw)</span>
                    <span style={styles.ticketDetailValue}>{ticket.ticketNumber}</span>
                  </div>
                  <div style={styles.ticketDetailItem}>
                    <span style={styles.ticketLabel}>Ticket Number (display)</span>
                    <span style={{ ...styles.ticketDetailValue, color: "#ffb74d", letterSpacing: "3px", fontFamily: "monospace", fontSize: "18px" }}>
                      {formatTicketNumber(ticket.ticketNumber)}
                    </span>
                  </div>
                  <div style={styles.ticketDetailItem}>
                    <span style={styles.ticketLabel}>Digits (left → right)</span>
                    <div style={styles.miniDigitRowLg}>
                      {ticketDigits(ticket.ticketNumber).map((d, i) => (
                        <span key={i} style={styles.miniDigitLg}>{d}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {bracketMatch !== null && (
                <div style={styles.ticketDetailItem}>
                  <span style={styles.ticketLabel}>Matching Digits</span>
                  <span style={{ ...styles.ticketDetailValue, color: bracketMatch > 0 ? "#00e676" : "#ef5350" }}>
                    {bracketMatch} / 6{bracketMatch > 0 && ` → Bracket #${bracketMatch}`}
                  </span>
                </div>
              )}
              {ticket.amount && (
                <div style={styles.ticketDetailItem}>
                  <span style={styles.ticketLabel}>Claimed Reward</span>
                  <span style={{ ...styles.ticketDetailValue, color: "#00e676" }}>
                    {ethers.formatEther(ticket.amount)} CAKE
                  </span>
                </div>
              )}
              {ticket.txHash && (
                <div style={styles.ticketDetailItem}>
                  <span style={styles.ticketLabel}>Transaction</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ ...styles.ticketDetailValue, fontSize: "11px" }}>
                      {shortAddr(ticket.txHash)}
                    </span>
                    <motion.button
                      style={styles.copyBtnSm}
                      onClick={() => copyToClipboard(ticket.txHash)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      📋
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================
// 📊 STAT CARD
// ============================================================
const Stat = ({
  label,
  value,
  icon,
  index,
  modalContent,
  modalTitle,
  modalSubtitle,
  loadingModal,
}) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <motion.div
        style={styles.statCard}
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        custom={index}
        whileHover={{
          scale: 1.04,
          borderColor: "rgba(255,152,0,0.35)",
          boxShadow: "0 4px 20px rgba(255,152,0,0.1)",
        }}
        transition={{ type: "spring", stiffness: 300 }}
        onClick={() => setShowDetail(true)}
        role="button"
        tabIndex={0}
      >
        <div style={styles.statIcon}>{icon}</div>
        <div style={styles.statLabel}>{label}</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={String(value)}
            style={styles.statValue}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {value}
          </motion.div>
        </AnimatePresence>
        <div style={styles.clickHint}>tap for details</div>
      </motion.div>

      <DetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={modalTitle || `${icon} ${label}`}
        subtitle={modalSubtitle}
      >
        {loadingModal ? (
          <div style={styles.modalLoadingWrap}>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ fontSize: "28px" }}
            >
              ⏳
            </motion.span>
            <span style={{ color: "#888", fontSize: "14px" }}>
              Loading data...
            </span>
          </div>
        ) : (
          modalContent
        )}
      </DetailModal>
    </>
  );
};

// ============================================================
// 🔘 ACTION BUTTON
// ============================================================
const ActionButton = ({ children, onClick, disabled, loading, variant = "primary" }) => {
  const variantStyle =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "danger"
      ? styles.btnDanger
      : variant === "info"
      ? styles.btnInfo
      : styles.btnPrimary;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles.btn,
        ...variantStyle,
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
      whileHover={!disabled && !loading ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.96 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ display: "inline-block" }}
            >
              ⏳
            </motion.span>
            Processing...
          </motion.span>
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ============================================================
// 📛 STATUS BADGE
// ============================================================
const StatusBadge = ({ status, onClick }) => {
  const cfg = {
    Open: {
      bg: "rgba(0,200,100,0.15)",
      border: "rgba(0,200,100,0.4)",
      color: "#00e676",
      desc: "Lottery is currently accepting ticket purchases.",
    },
    Close: {
      bg: "rgba(255,152,0,0.15)",
      border: "rgba(255,152,0,0.4)",
      color: "#ffb74d",
      desc: "Lottery is closed. Awaiting random number draw.",
    },
    Claimable: {
      bg: "rgba(100,180,255,0.15)",
      border: "rgba(100,180,255,0.4)",
      color: "#90caf9",
      desc: "Winners can now claim their rewards.",
    },
    Pending: {
      bg: "rgba(255,255,255,0.05)",
      border: "rgba(255,255,255,0.1)",
      color: "#888",
      desc: "No active lottery round.",
    },
  };
  const s = cfg[status] || cfg.Pending;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        style={{
          marginTop: "6px",
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: "700",
          background: s.bg,
          border: `1px solid ${s.border}`,
          color: s.color,
          cursor: "pointer",
        }}
        onClick={() => onClick && onClick(s.desc)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {status === "Open" && (
          <motion.span
            style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#00e676",
              marginRight: "6px",
              verticalAlign: "middle",
            }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          />
        )}
        {status || "N/A"}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================
// 🔍 EMPTY STATE
// ============================================================
const EmptyState = ({ message }) => (
  <div style={styles.emptyState}>
    <span style={{ fontSize: "32px" }}>🔍</span>
    <span style={{ color: "#666", fontSize: "14px" }}>{message}</span>
  </div>
);

// ============================================================
// 🏆 MAIN COMPONENT
// ============================================================
export default function Admin({ contract, randomGenerator, vrfMock }) {
  const [currentLotteryId, setCurrentLotteryId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState({ start: false, close: false, draw: false });
  const [dataLoading, setDataLoading] = useState(false);
  const [finalNumber, setFinalNumber] = useState(null);
  const [totalWinners, setTotalWinners] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0n);
  const [totalCollected, setTotalCollected] = useState(0n);
  const [treasuryAmount, setTreasuryAmount] = useState(0n);
  const [claimedRewards, setClaimedRewards] = useState(0n);
  const [claimedTickets, setClaimedTickets] = useState(0);
  const [uniqueWinners, setUniqueWinners] = useState(0);
  const [bracketsData, setBracketsData] = useState([]);
  const [lotteryTimes, setLotteryTimes] = useState({ start: null, end: null });
  const [ticketPrice, setTicketPrice] = useState(0n);
  const [idInput, setIdInput] = useState("");

  const [claimEvents, setClaimEvents] = useState([]);
  const [winnerAddresses, setWinnerAddresses] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [statusModal, setStatusModal] = useState({ open: false, message: "" });
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: null,
    title: "",
    message: "",
  });

  const isViewingCurrent = viewingId === currentLotteryId;

  // ── Fetch all events ──────────────────────────────────────
  const fetchAllEvents = useCallback(
    async (lotteryId, winningNum, firstTicketId, firstTicketIdNextLottery) => {
      if (!contract) return;
      setEventsLoading(true);

      try {
        // ══════════════════════════════════════════════════════
        // STEP 1: TicketsClaim events
        // event TicketsClaim(
        //   address indexed claimer,    → args.claimer  or args[0]
        //   uint256 amount,             → args.amount   or args[1]
        //   uint256 indexed lotteryId,  → args.lotteryId or args[2]
        //   uint256 numberTickets       → args.numberTickets or args[3]
        // )
        // ══════════════════════════════════════════════════════
        let claimEvts = [];
        try {
          const claimFilter = contract.filters.TicketsClaim();
          claimEvts = await contract.queryFilter(claimFilter, 0, "latest");
          console.log(
            `[Admin] Total TicketsClaim events found: ${claimEvts.length}`
          );
        } catch (err) {
          console.warn("[Admin] Could not query TicketsClaim events:", err);
        }

        let totalClaimed = 0n;
        let ticketsCt = 0;
        const claimUsers = new Set();
        const claimRows = [];

        claimEvts.forEach((e) => {
          // Robustly read args — try named first, then positional
          const evtClaimer   = e.args?.claimer      ?? e.args?.[0];
          const evtAmount    = e.args?.amount        ?? e.args?.[1];
          const evtLotteryId = Number(e.args?.lotteryId ?? e.args?.[2]);
          const evtNumTix    = Number(e.args?.numberTickets ?? e.args?.[3] ?? 1);

          if (evtLotteryId !== Number(lotteryId)) return;

          totalClaimed += BigInt(evtAmount ?? 0);
          ticketsCt    += evtNumTix;
          if (evtClaimer) claimUsers.add(evtClaimer);

          claimRows.push({
            claimer: evtClaimer,
            amount:  BigInt(evtAmount ?? 0),
            numTix:  evtNumTix,
            bracket: null,
            txHash:  e.transactionHash,
          });
        });

        console.log(
          `[Admin] TicketsClaim for lottery #${lotteryId}: ` +
          `${claimRows.length} claims, ${claimUsers.size} unique claimers, ` +
          `totalClaimed=${ethers.formatEther(totalClaimed)} CAKE`
        );

        setClaimedRewards(totalClaimed);
        setClaimedTickets(ticketsCt);
        setClaimEvents(claimRows);

        // ══════════════════════════════════════════════════════
        // STEP 2: Enumerate all tickets in this lottery's range
        // ══════════════════════════════════════════════════════
        const ticketCount = firstTicketIdNextLottery - firstTicketId;
        const enriched = [];

        if (ticketCount > 0 && ticketCount <= 10000) {
          const BATCH = 300;
          const allIds = [];
          for (let t = firstTicketId; t < firstTicketIdNextLottery; t++) {
            allIds.push(t);
          }

          for (let start = 0; start < allIds.length; start += BATCH) {
            const batchIds = allIds.slice(start, start + BATCH);
            try {
              const result =
                await contract.viewNumbersAndStatusesForTicketIds(batchIds);
              const numbers  = result[0];
              const statuses = result[1];

              for (let idx = 0; idx < batchIds.length; idx++) {
                enriched.push({
                  ticketId:     batchIds[idx],
                  ticketNumber: Number(numbers[idx]),
                  claimed:      statuses[idx],
                  owner:        null,
                });
              }
            } catch (_batchErr) {
              console.warn(
                `[Admin] Batch failed tickets ${start}–${start + BATCH}:`,
                _batchErr
              );
              for (const tid of batchIds) {
                enriched.push({
                  ticketId:     tid,
                  ticketNumber: null,
                  claimed:      false,
                  owner:        null,
                });
              }
            }
          }

          // ══════════════════════════════════════════════════════
          // STEP 3: TicketsPurchase events → assign owners
          // event TicketsPurchase(
          //   address indexed buyer,      → args.buyer   or args[0]
          //   uint256 indexed lotteryId,  → args.lotteryId or args[1]
          //   uint256 numberTickets       → args.numberTickets or args[2]
          // )
          // ══════════════════════════════════════════════════════
          const allBuyers = new Set();
          try {
            const buyFilter = contract.filters.TicketsPurchase();
            const buyEvts   = await contract.queryFilter(buyFilter, 0, "latest");

            console.log(
              `[Admin] Total TicketsPurchase events: ${buyEvts.length}`
            );

            // Filter to this lottery only, then assign ownership sequentially
            const lotteryBuyEvts = buyEvts.filter(
              (e) =>
                Number(e.args?.lotteryId ?? e.args?.[1]) === Number(lotteryId)
            );

            console.log(
              `[Admin] TicketsPurchase for lottery #${lotteryId}: ${lotteryBuyEvts.length} events`
            );

            let runningId = firstTicketId;
            lotteryBuyEvts.forEach((e) => {
              const buyer = e.args?.buyer ?? e.args?.[0];
              const count = Number(e.args?.numberTickets ?? e.args?.[2] ?? 1);

              if (buyer) allBuyers.add(buyer);

              for (let t = 0; t < count; t++) {
                const ticket = enriched.find(
                  (tk) => tk.ticketId === runningId
                );
                if (ticket) ticket.owner = buyer;
                runningId++;
              }
            });
          } catch (_buyErr) {
            console.warn(
              "[Admin] Could not fetch TicketsPurchase events:",
              _buyErr
            );
          }

          setAllTickets(enriched);

          // ══════════════════════════════════════════════════════
          // STEP 4: Determine winner addresses
          //
          // Priority 1 — TicketsClaim events (most accurate, post-claim)
          // Priority 2 — Tickets with claimed=true and a known owner
          // Priority 3 — No one has claimed yet (show info message)
          // ══════════════════════════════════════════════════════
          if (claimUsers.size > 0) {
            console.log(
              `[Admin] Winners from TicketsClaim events: ${claimUsers.size}`
            );
            setUniqueWinners(claimUsers.size);
            setWinnerAddresses([...claimUsers]);
          } else {
            const claimedOwners = new Set(
              enriched
                .filter((t) => t.claimed && t.owner)
                .map((t) => t.owner)
            );

            if (claimedOwners.size > 0) {
              console.log(
                `[Admin] Winners from claimed ticket owners: ${claimedOwners.size}`
              );
              setUniqueWinners(claimedOwners.size);
              setWinnerAddresses([...claimedOwners]);
            } else {
              // Winners exist per countWinnersPerBracket but haven't claimed yet
              console.log(
                "[Admin] No claims yet — winners exist per bracket data but have not claimed."
              );
              setUniqueWinners(0);
              setWinnerAddresses([]);
            }
          }
        } else if (ticketCount > 10000) {
          setAllTickets([]);
          toast("Too many tickets to enumerate individually", { icon: "⚠️" });

          // Still set whatever we got from claim events
          setUniqueWinners(claimUsers.size);
          setWinnerAddresses([...claimUsers]);
        } else {
          setAllTickets([]);
          setUniqueWinners(claimUsers.size);
          setWinnerAddresses([...claimUsers]);
        }
      } catch (err) {
        console.error("[Admin] Event fetch error:", err);
      } finally {
        setEventsLoading(false);
      }
    },
    [contract]
  );

  // ── Fetch lottery by ID ───────────────────────────────────
  const fetchLotteryById = useCallback(
    async (id) => {
      if (!contract || !id || id < 1) return;
      setDataLoading(true);
      try {
        const lottery    = await contract.viewLottery(id);
        const statusMap  = ["Pending", "Open", "Close", "Claimable"];
        const statusNum  = Number(lottery.status);
        setStatus(statusMap[statusNum] || "Pending");
        setFinalNumber(Number(lottery.finalNumber));
        setTicketPrice(lottery.priceTicketInCake || 0n);
        setLotteryTimes({
          start: Number(lottery.startTime)
            ? new Date(Number(lottery.startTime) * 1000)
            : null,
          end: Number(lottery.endTime)
            ? new Date(Number(lottery.endTime) * 1000)
            : null,
        });

        const collected = lottery.amountCollectedInCake;
        setTotalCollected(collected);

        const winners = [];
        for (let i = 0; i < 6; i++) {
          winners.push(Number(lottery.countWinnersPerBracket[i]));
        }
        setTotalWinners(winners.reduce((a, b) => a + b, 0));

        let totalR = 0n;
        const bkts = [];
        for (let i = 0; i < 6; i++) {
          const perBracket = lottery.cakePerBracket[i] || 0n;
          totalR += perBracket * BigInt(winners[i]);
          bkts.push({
            bracket:         i + 1,
            matchDigits:     i + 1,
            winners:         winners[i],
            rewardPerWinner: perBracket,
            totalReward:     perBracket * BigInt(winners[i]),
            rewardBreakdown: lottery.rewardsBreakdown
              ? Number(lottery.rewardsBreakdown[i]) / 100
              : 0,
          });
        }
        setTotalRewards(totalR);
        setBracketsData(bkts);
        setTreasuryAmount(collected > totalR ? collected - totalR : 0n);

        const firstId     = Number(lottery.firstTicketId);
        const nextFirstId = Number(lottery.firstTicketIdNextLottery);
        await fetchAllEvents(
          id,
          Number(lottery.finalNumber),
          firstId,
          nextFirstId
        );
      } catch (err) {
        console.error(err);
        toast.error(`Failed to fetch lottery #${id}`);
      } finally {
        setDataLoading(false);
      }
    },
    [contract, fetchAllEvents]
  );

  // ── Fetch current lottery ID ──────────────────────────────
  const fetchCurrentId = useCallback(async () => {
    if (!contract) return;
    try {
      let id;
      if (contract.viewCurrentLotteryId) {
        id = await contract.viewCurrentLotteryId();
      } else if (contract.currentLotteryId) {
        id = await contract.currentLotteryId();
      } else {
        toast.error("Cannot read current lottery ID from contract");
        return;
      }
      const numId = Number(id);
      setCurrentLotteryId(numId);
      if (viewingId === null) {
        setViewingId(numId);
        setIdInput(String(numId));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch current lottery ID");
    }
  }, [contract, viewingId]);

  useEffect(() => { fetchCurrentId(); }, [fetchCurrentId]);
  useEffect(() => {
    if (viewingId !== null) fetchLotteryById(viewingId);
  }, [viewingId, fetchLotteryById]);

  // ── Navigation ────────────────────────────────────────────
  const goToLottery = (id) => {
    if (id >= 1 && id <= currentLotteryId) {
      setViewingId(id);
      setIdInput(String(id));
    }
  };

  const handleIdInputSubmit = (e) => {
    e.preventDefault();
    const p = parseInt(idInput, 10);
    if (!isNaN(p) && p >= 1 && p <= currentLotteryId) goToLottery(p);
    else toast.error(`Enter a valid ID (1 – ${currentLotteryId})`);
  };

  // ── Confirm wrapper ───────────────────────────────────────
  const confirmAction = (action, title, message) =>
    setConfirmModal({ open: true, action, title, message });

  const executeConfirmed = () => {
    const { action } = confirmModal;
    setConfirmModal({ open: false, action: null, title: "", message: "" });
    if (action) action();
  };

  // ── Start Lottery ─────────────────────────────────────────
  const handleStartLottery = async () => {
    const tid = toast.loading("🚀 Starting lottery...");
    try {
      setLoading((p) => ({ ...p, start: true }));
      const endTime = Math.floor(Date.now() / 1000) + 360;
      const tx = await contract.startLottery(
        endTime,
        ethers.parseEther("1"),
        500,
        [200, 500, 800, 1000, 2500, 5000],
        500
      );
      toast.loading("⛓️ Confirming...", { id: tid });
      await tx.wait();
      toast.success(
        <div>
          <strong>Lottery Started! 🎉</strong>
          <br />
          <span style={{ fontSize: "12px", opacity: 0.8 }}>
            Ends: {new Date(endTime * 1000).toLocaleString()}
          </span>
        </div>,
        { id: tid, duration: 5000 }
      );
      await fetchCurrentId();
      let newId = contract.viewCurrentLotteryId
        ? await contract.viewCurrentLotteryId()
        : await contract.currentLotteryId();
      goToLottery(Number(newId));
    } catch (err) {
      toast.error(`Failed: ${err.reason || err.message}`, { id: tid });
    } finally {
      setLoading((p) => ({ ...p, start: false }));
    }
  };

  // ── Close Lottery ─────────────────────────────────────────
  const handleCloseLottery = async () => {
    const tid = toast.loading("🔒 Closing...");
    try {
      setLoading((p) => ({ ...p, close: true }));
      const tx = await contract.closeLottery(viewingId);
      toast.loading("⛓️ Confirming...", { id: tid });
      await tx.wait();
      toast.success(
        <div>
          <strong>Lottery #{viewingId} Closed! 🔒</strong>
          <br />
          <span style={{ fontSize: "12px", opacity: 0.8 }}>
            VRF requested. Proceed to draw.
          </span>
        </div>,
        { id: tid, duration: 5000 }
      );
      fetchLotteryById(viewingId);
    } catch (err) {
      toast.error(`Failed: ${err.reason || err.message}`, { id: tid });
    } finally {
      setLoading((p) => ({ ...p, close: false }));
    }
  };

  // ── Draw Winner ───────────────────────────────────────────
  const handleDrawWinner = async () => {
    const tid = toast.loading("🎲 Preparing draw...");
    try {
      setLoading((p) => ({ ...p, draw: true }));
      if (!randomGenerator || !vrfMock) {
        toast.error("Contracts not ready ❌", { id: tid });
        return;
      }
      const requestId = await randomGenerator.latestRequestId();
      if (!requestId || requestId === ethers.ZeroHash) {
        toast.error("No VRF request. Close lottery first.", { id: tid });
        return;
      }
      toast.loading("🔮 Fulfilling VRF...", { id: tid });
      await (await vrfMock.fulfill(randomGenerator.target, requestId)).wait();

      const latestLotteryIdFromRng = await randomGenerator.viewLatestLotteryId();
      if (Number(latestLotteryIdFromRng) !== Number(viewingId)) {
        toast.error("Randomness not ready. Try again.", { id: tid });
        return;
      }

      toast.loading("🏆 Drawing...", { id: tid });
      await (
        await contract.drawFinalNumberAndMakeLotteryClaimable(viewingId, true)
      ).wait();
      toast.success(
        <div>
          <strong>Winner Drawn! 🎉</strong>
          <br />
          <span style={{ fontSize: "12px", opacity: 0.8 }}>
            Lottery #{viewingId} is Claimable!
          </span>
        </div>,
        { id: tid, duration: 6000 }
      );
      fetchLotteryById(viewingId);
    } catch (err) {
      toast.error(`Draw failed: ${err.reason || err.message}`, { id: tid });
    } finally {
      setLoading((p) => ({ ...p, draw: false }));
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const digits =
    finalNumber && finalNumber !== 0
      ? String(finalNumber % 1000000).padStart(6, "0").split("")
      : ["-", "-", "-", "-", "-", "-"];

  const formatDate = (d) =>
    d
      ? d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const anyLoading = loading.start || loading.close || loading.draw;
  const winningNumberForCompare =
    finalNumber && finalNumber !== 0 ? finalNumber : null;

  // ── Total structure-level winner count ────────────────────
  const structWinnerCount = bracketsData.reduce((s, b) => s + b.winners, 0);

  // ============================================================
  // 🧩 MODAL CONTENT BUILDERS
  // ============================================================

  const TotalWinnersModal = () => {
    const [search, setSearch] = useState("");
    const filtered = winnerAddresses.filter((a) =>
      a.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div>
        <div style={styles.modalSummaryRow}>
          <span style={styles.modalBigNum}>{winnerAddresses.length}</span>
          <span style={styles.modalBigLabel}>unique winner wallets</span>
        </div>

        {/* ── Info: winners exist but haven't claimed yet ── */}
        {structWinnerCount > 0 && winnerAddresses.length === 0 && (
          <div style={styles.infoBox}>
            <span>ℹ️</span>
            <div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#ffb74d" }}>
                {structWinnerCount} winning ticket
                {structWinnerCount !== 1 ? "s" : ""} exist
              </p>
              <p style={{ margin: 0, fontSize: "12px" }}>
                Winners have not claimed their prizes yet. Wallet
                addresses will appear here once they claim.
              </p>
            </div>
          </div>
        )}

        {winnerAddresses.length > 0 && (
          <>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search address..."
            />
            <div style={styles.listWrap}>
              {filtered.length === 0 ? (
                <EmptyState message="No winners found" />
              ) : (
                filtered.map((addr, i) => {
                  const wins  = claimEvents.filter((e) => e.claimer === addr);
                  const total = wins.reduce((s, e) => s + e.amount, 0n);
                  return (
                    <AddressRow
                      key={addr}
                      index={i}
                      address={addr}
                      badge={`${wins.length} claim${wins.length !== 1 ? "s" : ""}`}
                      extra={`${ethers.formatEther(total)} CAKE`}
                    />
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── Always show per-bracket breakdown ─────────── */}
        {bracketsData.some((b) => b.winners > 0) && (
          <div style={{ marginTop: "16px" }}>
            <div style={styles.sectionTitle}>🏆 Winners Per Bracket</div>
            <div style={styles.bracketList}>
              {bracketsData
                .filter((b) => b.winners > 0)
                .map((b, i) => (
                  <div key={i} style={styles.bracketCard}>
                    <div style={styles.bracketCardHeader}>
                      <span style={styles.bracketNum}>
                        Bracket {b.bracket} — {b.matchDigits} digit
                        {b.matchDigits !== 1 ? "s" : ""} matched
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#00e676",
                        }}
                      >
                        {b.winners} ticket{b.winners !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={styles.bracketCardBody}>
                      <div style={styles.bStat}>
                        <span style={styles.bStatLabel}>Per Winner</span>
                        <span style={styles.bStatValue}>
                          {ethers.formatEther(b.rewardPerWinner)} CAKE
                        </span>
                      </div>
                      <div style={styles.bStat}>
                        <span style={styles.bStatLabel}>Total in Bracket</span>
                        <span style={{ color: "#ffb74d", fontWeight: 700 }}>
                          {ethers.formatEther(b.totalReward)} CAKE
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const TicketsClaimedModal = () => {
    const [search, setSearch] = useState("");
    const filtered = claimEvents.filter(
      (e) =>
        e.claimer.toLowerCase().includes(search.toLowerCase()) ||
        (e.txHash && e.txHash.toLowerCase().includes(search.toLowerCase()))
    );
    return (
      <div>
        <div style={styles.modalSummaryRow}>
          <span style={styles.modalBigNum}>{claimedTickets}</span>
          <span style={styles.modalBigLabel}>
            tickets claimed across {claimEvents.length} transactions
          </span>
        </div>

        {claimEvents.length === 0 && structWinnerCount > 0 && (
          <div style={styles.infoBox}>
            <span>ℹ️</span>
            <span>
              {structWinnerCount} winning ticket
              {structWinnerCount !== 1 ? "s" : ""} exist but no claims
              have been made yet.
            </span>
          </div>
        )}

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search address or tx..."
        />
        <div style={styles.listWrap}>
          {filtered.length === 0 ? (
            <EmptyState message="No claim transactions found" />
          ) : (
            filtered.map((ev, i) => (
              <TicketRow
                key={i}
                index={i}
                winningNumber={winningNumberForCompare}
                ticket={{
                  ticketId: i + 1,
                  owner:    ev.claimer,
                  amount:   ev.amount,
                  bracket:  ev.bracket,
                  txHash:   ev.txHash,
                }}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const PrizePoolModal = () => (
    <div>
      <div style={styles.modalSummaryRow}>
        <span style={styles.modalBigNum}>
          {ethers.formatEther(totalRewards ?? 0n)}
        </span>
        <span style={styles.modalBigLabel}>CAKE total prize pool</span>
      </div>
      <div style={styles.bracketList}>
        {bracketsData.map((b, i) => (
          <motion.div
            key={i}
            style={styles.bracketCard}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div style={styles.bracketCardHeader}>
              <span style={styles.bracketNum}>Bracket {b.bracket}</span>
              <span style={styles.bracketMatch}>
                {b.matchDigits} digits matched
              </span>
              <span style={styles.bracketShare}>{b.rewardBreakdown}%</span>
            </div>
            <div style={styles.bracketCardBody}>
              <div style={styles.bStat}>
                <span style={styles.bStatLabel}>Winners</span>
                <span style={{ color: b.winners > 0 ? "#00e676" : "#666", fontWeight: 700 }}>
                  {b.winners}
                </span>
              </div>
              <div style={styles.bStat}>
                <span style={styles.bStatLabel}>Per Winner</span>
                <span style={styles.bStatValue}>
                  {ethers.formatEther(b.rewardPerWinner)} CAKE
                </span>
              </div>
              <div style={styles.bStat}>
                <span style={styles.bStatLabel}>Total</span>
                <span style={{ color: "#ffb74d", fontWeight: 700 }}>
                  {ethers.formatEther(b.totalReward)} CAKE
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const ClaimedModal = () => {
    const [search, setSearch] = useState("");
    const grouped = {};
    claimEvents.forEach((e) => {
      if (!grouped[e.claimer])
        grouped[e.claimer] = { total: 0n, claims: 0, tickets: 0 };
      grouped[e.claimer].total   += e.amount;
      grouped[e.claimer].claims  += 1;
      grouped[e.claimer].tickets += e.numTix;
    });
    const rows = Object.entries(grouped)
      .sort(([, a], [, b]) => (b.total > a.total ? 1 : -1))
      .filter(([addr]) =>
        addr.toLowerCase().includes(search.toLowerCase())
      );

    return (
      <div>
        <div style={styles.modalSummaryRow}>
          <span style={styles.modalBigNum}>
            {ethers.formatEther(claimedRewards ?? 0n)}
          </span>
          <span style={styles.modalBigLabel}>
            CAKE claimed by {winnerAddresses.length} winners
          </span>
        </div>

        {claimEvents.length === 0 && structWinnerCount > 0 && (
          <div style={styles.infoBox}>
            <span>ℹ️</span>
            <span>
              No claims yet. {structWinnerCount} winning ticket
              {structWinnerCount !== 1 ? "s" : ""} are waiting to be claimed.
            </span>
          </div>
        )}

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search address..."
        />
        <div style={styles.listWrap}>
          {rows.length === 0 ? (
            <EmptyState message="No claims yet" />
          ) : (
            rows.map(([addr, data], i) => (
              <AddressRow
                key={addr}
                index={i}
                address={addr}
                badge={`${data.tickets} ticket${data.tickets !== 1 ? "s" : ""}`}
                extra={`${ethers.formatEther(data.total)} CAKE`}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const UnclaimedModal = () => {
    const unclaimed = (totalRewards ?? 0n) - (claimedRewards ?? 0n);
    return (
      <div>
        <div style={styles.modalSummaryRow}>
          <span style={styles.modalBigNum}>
            {ethers.formatEther(unclaimed)}
          </span>
          <span style={styles.modalBigLabel}>CAKE still unclaimed</span>
        </div>
        <div style={styles.infoBox}>
          <span>📌</span>
          <span>
            Unclaimed rewards typically roll over to the next round's
            treasury depending on contract configuration.
          </span>
        </div>
        <div style={styles.bracketList}>
          {bracketsData.map((b, i) => (
            <motion.div
              key={i}
              style={styles.bracketCard}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div style={styles.bracketCardHeader}>
                <span style={styles.bracketNum}>Bracket {b.bracket}</span>
                <span style={styles.bracketMatch}>
                  {b.winners} winners
                </span>
              </div>
              <div style={styles.bracketCardBody}>
                <div style={styles.bStat}>
                  <span style={styles.bStatLabel}>Total Pool</span>
                  <span style={styles.bStatValue}>
                    {ethers.formatEther(b.totalReward)} CAKE
                  </span>
                </div>
                <div style={styles.bStat}>
                  <span style={styles.bStatLabel}>Remaining</span>
                  <span style={{ color: b.totalReward > 0n ? "#ef5350" : "#666", fontWeight: 700 }}>
                    {ethers.formatEther(b.totalReward)} CAKE
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const TreasuryModal = () => {
    const pct =
      totalCollected > 0n
        ? ((Number(treasuryAmount) / Number(totalCollected)) * 100).toFixed(1)
        : "0";
    return (
      <div>
        <div style={styles.modalSummaryRow}>
          <span style={styles.modalBigNum}>
            {ethers.formatEther(treasuryAmount ?? 0n)}
          </span>
          <span style={styles.modalBigLabel}>
            CAKE to treasury ({pct}% of collected)
          </span>
        </div>
        <div style={styles.infoBox}>
          <span>🏦</span>
          <span>
            Treasury funds are sent to the platform wallet for operations,
            development, and burns.
          </span>
        </div>
        <div style={styles.extraInfoGrid}>
          {[
            { label: "Total Collected",  value: `${ethers.formatEther(totalCollected ?? 0n)} CAKE` },
            { label: "Total Prize Pool", value: `${ethers.formatEther(totalRewards ?? 0n)} CAKE` },
            { label: "Treasury Amount",  value: `${ethers.formatEther(treasuryAmount ?? 0n)} CAKE` },
            { label: "Treasury Share",   value: `${pct}%` },
          ].map((row, i) => (
            <div key={i} style={styles.extraInfoItem}>
              <span style={styles.extraInfoLabel}>{row.label}</span>
              <span style={styles.extraInfoValue}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TotalCollectedModal = () => {
    const [search,  setSearch]  = useState("");
    const [sortBy,  setSortBy]  = useState("id");
    const ticketCount = allTickets.length;

    const filtered = allTickets
      .filter(
        (t) =>
          String(t.ticketId).includes(search) ||
          (t.owner && t.owner.toLowerCase().includes(search.toLowerCase())) ||
          (t.ticketNumber !== null && String(t.ticketNumber).includes(search)) ||
          (t.ticketNumber !== null && formatTicketNumber(t.ticketNumber).includes(search))
      )
      .sort((a, b) => {
        if (sortBy === "id")     return a.ticketId - b.ticketId;
        if (sortBy === "number") return (a.ticketNumber ?? 0) - (b.ticketNumber ?? 0);
        if (sortBy === "owner")  return (a.owner ?? "").localeCompare(b.owner ?? "");
        return 0;
      });

    return (
      <div>
        <div style={styles.modalSummaryRow}>
          <span style={styles.modalBigNum}>
            {ethers.formatEther(totalCollected ?? 0n)}
          </span>
          <span style={styles.modalBigLabel}>
            CAKE collected from ticket sales
          </span>
        </div>

        <div style={styles.extraInfoGrid}>
          {[
            { label: "Tickets Sold",    value: ticketCount > 0 ? ticketCount : "—" },
            { label: "Price / Ticket",  value: ticketPrice ? `${ethers.formatEther(ticketPrice)} CAKE` : "—" },
            { label: "Prize Pool",      value: `${ethers.formatEther(totalRewards ?? 0n)} CAKE` },
            { label: "Treasury",        value: `${ethers.formatEther(treasuryAmount ?? 0n)} CAKE` },
            { label: "Claimed So Far",  value: `${ethers.formatEther(claimedRewards ?? 0n)} CAKE` },
          ].map((row, i) => (
            <div key={i} style={styles.extraInfoItem}>
              <span style={styles.extraInfoLabel}>{row.label}</span>
              <span style={styles.extraInfoValue}>{row.value}</span>
            </div>
          ))}
        </div>

        {allTickets.length > 0 && (
          <>
            <div style={{ ...styles.sectionTitle, marginTop: "16px" }}>
              🎫 Purchased Tickets
            </div>

            <div style={styles.sortRow}>
              <span style={styles.sortLabel}>Sort by:</span>
              {[
                { key: "id",     label: "Ticket ID" },
                { key: "number", label: "Number" },
                { key: "owner",  label: "Owner" },
              ].map((s) => (
                <motion.button
                  key={s.key}
                  style={{
                    ...styles.sortBtn,
                    ...(sortBy === s.key ? styles.sortBtnActive : {}),
                  }}
                  onClick={() => setSortBy(s.key)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {s.label}
                </motion.button>
              ))}
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search ID, address, or number..."
            />

            {winningNumberForCompare && (
              <div style={styles.winLegend}>
                <span>🎯 Winning:</span>
                <MiniDigits number={winningNumberForCompare} />
                <span style={{ fontSize: "11px", color: "#555" }}>
                  — green = matching digits (right to left)
                </span>
              </div>
            )}

            <div style={styles.listWrap}>
              {filtered.slice(0, 100).map((t, i) => (
                <TicketRow
                  key={t.ticketId}
                  index={i}
                  winningNumber={winningNumberForCompare}
                  ticket={{
                    ticketId:     t.ticketId,
                    owner:        t.owner || "Unknown",
                    ticketNumber: t.ticketNumber,
                    claimed:      t.claimed,
                  }}
                />
              ))}
              {filtered.length > 100 && (
                <div style={styles.moreHint}>
                  … showing 100 of {filtered.length} tickets
                </div>
              )}
              {filtered.length === 0 && (
                <EmptyState message="No tickets match your search" />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const UniqueWinnersModal = () => {
    const [search, setSearch] = useState("");
    const filtered = winnerAddresses.filter((a) =>
      a.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div>
        <div style={styles.modalSummaryRow}>
          <span style={styles.modalBigNum}>{uniqueWinners}</span>
          <span style={styles.modalBigLabel}>distinct winning wallets</span>
        </div>

        {/* ── Info: winners exist but haven't claimed yet ── */}
        {structWinnerCount > 0 && winnerAddresses.length === 0 && (
          <div style={styles.infoBox}>
            <span>ℹ️</span>
            <div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#ffb74d" }}>
                {structWinnerCount} winning ticket
                {structWinnerCount !== 1 ? "s" : ""} exist
              </p>
              <p style={{ margin: 0, fontSize: "12px" }}>
                Winners have not claimed yet. Addresses will appear
                here once they submit a claim transaction.
              </p>
            </div>
          </div>
        )}

        {winnerAddresses.length > 0 && (
          <>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search address..."
            />
            <div style={styles.listWrap}>
              {filtered.length === 0 ? (
                <EmptyState message="No winners found" />
              ) : (
                filtered.map((addr, i) => {
                  const evs     = claimEvents.filter((e) => e.claimer === addr);
                  const total   = evs.reduce((s, e) => s + e.amount, 0n);
                  const tickets = evs.reduce((s, e) => s + e.numTix, 0);
                  return (
                    <AddressRow
                      key={addr}
                      index={i}
                      address={addr}
                      badge={`${tickets} ticket${tickets !== 1 ? "s" : ""}`}
                      extra={`${ethers.formatEther(total)} CAKE`}
                    />
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── Always show per-bracket breakdown ─────────── */}
        {bracketsData.some((b) => b.winners > 0) && (
          <div style={{ marginTop: "16px" }}>
            <div style={styles.sectionTitle}>🏆 Per-Bracket Breakdown</div>
            <div style={styles.bracketList}>
              {bracketsData
                .filter((b) => b.winners > 0)
                .map((b, i) => (
                  <div key={i} style={styles.bracketCard}>
                    <div style={styles.bracketCardHeader}>
                      <span style={styles.bracketNum}>
                        Bracket {b.bracket} — {b.matchDigits} digit
                        {b.matchDigits !== 1 ? "s" : ""} matched
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#00e676" }}>
                        {b.winners} ticket{b.winners !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={styles.bracketCardBody}>
                      <div style={styles.bStat}>
                        <span style={styles.bStatLabel}>Per Winner</span>
                        <span style={styles.bStatValue}>
                          {ethers.formatEther(b.rewardPerWinner)} CAKE
                        </span>
                      </div>
                      <div style={styles.bStat}>
                        <span style={styles.bStatLabel}>Total in Bracket</span>
                        <span style={{ color: "#ffb74d", fontWeight: 700 }}>
                          {ethers.formatEther(b.totalReward)} CAKE
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Stat definitions ──────────────────────────────────────
  const statDefs = [
    {
      icon:         "🏆",
      label:        "Total Winners",
      value:        totalWinners,
      modalTitle:   "🏆 Total Winners",
      modalSubtitle: `Lottery #${viewingId} — winning tickets per bracket`,
      modalContent: <TotalWinnersModal />,
    },
    {
      icon:         "🎟️",
      label:        "Tickets Claimed",
      value:        claimedTickets,
      modalTitle:   "🎟️ Claimed Tickets",
      modalSubtitle: `${claimEvents.length} claim transactions`,
      modalContent: <TicketsClaimedModal />,
    },
    {
      icon:         "💰",
      label:        "Prize Pool",
      value:        `${ethers.formatEther(totalRewards ?? 0n)} CAKE`,
      modalTitle:   "💰 Prize Pool Breakdown",
      modalSubtitle: "Reward distribution across 6 brackets",
      modalContent: <PrizePoolModal />,
    },
    {
      icon:         "✅",
      label:        "Claimed",
      value:        `${ethers.formatEther(claimedRewards ?? 0n)} CAKE`,
      modalTitle:   "✅ Claimed Rewards",
      modalSubtitle: "Sorted by total claimed (highest first)",
      modalContent: <ClaimedModal />,
    },
    {
      icon:         "⏳",
      label:        "Unclaimed",
      value:        `${ethers.formatEther((totalRewards ?? 0n) - (claimedRewards ?? 0n))} CAKE`,
      modalTitle:   "⏳ Unclaimed Rewards",
      modalSubtitle: "Per-bracket remaining balances",
      modalContent: <UnclaimedModal />,
    },
    {
      icon:         "🏦",
      label:        "Treasury",
      value:        `${ethers.formatEther(treasuryAmount ?? 0n)} CAKE`,
      modalTitle:   "🏦 Treasury Allocation",
      modalSubtitle: "Platform fee from this round",
      modalContent: <TreasuryModal />,
    },
    {
      icon:         "📦",
      label:        "Total Collected",
      value:        `${ethers.formatEther(totalCollected ?? 0n)} CAKE`,
      modalTitle:   "📦 Total Collected",
      modalSubtitle: "All ticket sale revenue",
      modalContent: <TotalCollectedModal />,
    },
    {
      icon:         "👥",
      label:        "Unique Winners",
      value:        uniqueWinners,
      modalTitle:   "👥 Unique Winner Wallets",
      modalSubtitle: "Each address that won at least once",
      modalContent: <UniqueWinnersModal />,
    },
  ];

  // ============================================================
  // 🖼️ RENDER
  // ============================================================
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
            maxWidth: "420px",
          },
          success: { iconTheme: { primary: "#00e676", secondary: "#000" } },
          error:   { iconTheme: { primary: "#ef5350", secondary: "#fff" } },
          loading: { iconTheme: { primary: "#ffb74d", secondary: "#000" } },
        }}
      />

      {/* CONFIRM MODAL */}
      <DetailModal
        isOpen={confirmModal.open}
        onClose={() =>
          setConfirmModal({ open: false, action: null, title: "", message: "" })
        }
        title={confirmModal.title}
      >
        <p style={{ color: "#ccc", lineHeight: 1.6, marginBottom: "20px" }}>
          {confirmModal.message}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <motion.button
            style={{ ...styles.btn, ...styles.btnInfo, minWidth: "100px", padding: "10px 20px" }}
            onClick={() =>
              setConfirmModal({ open: false, action: null, title: "", message: "" })
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            style={{ ...styles.btn, ...styles.btnPrimary, minWidth: "100px", padding: "10px 20px" }}
            onClick={executeConfirmed}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Confirm
          </motion.button>
        </div>
      </DetailModal>

      {/* STATUS MODAL */}
      <DetailModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, message: "" })}
        title="📋 Status Details"
      >
        <p style={{ color: "#ccc", lineHeight: 1.8 }}>{statusModal.message}</p>
        <div style={styles.extraInfoGrid}>
          {[
            { label: "Status",     value: status },
            { label: "Round",      value: `#${viewingId}` },
            { label: "Start Time", value: formatDate(lotteryTimes.start) },
            { label: "End Time",   value: formatDate(lotteryTimes.end) },
          ].map((r, i) => (
            <div key={i} style={styles.extraInfoItem}>
              <span style={styles.extraInfoLabel}>{r.label}</span>
              <span style={styles.extraInfoValue}>{r.value}</span>
            </div>
          ))}
        </div>
      </DetailModal>

      <motion.div
        style={styles.wrapper}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {/* NAVIGATOR */}
        <motion.div style={styles.navigator} variants={fadeUp} custom={0}>
          <div style={styles.navHeader}>
            <span style={styles.navTitle}>🎰 Admin Panel</span>
            {!isViewingCurrent && viewingId !== null && (
              <motion.button
                style={styles.currentBadge}
                onClick={() => goToLottery(currentLotteryId)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                ← Back to Current (#{currentLotteryId})
              </motion.button>
            )}
          </div>

          <div style={styles.navControls}>
            {[
              { icon: "⏮", action: () => goToLottery(1),              disabled: !viewingId || viewingId <= 1 },
              { icon: "◀", action: () => goToLottery(viewingId - 1),   disabled: !viewingId || viewingId <= 1 },
            ].map(({ icon, action, disabled }) => (
              <motion.button
                key={icon}
                style={{ ...styles.navBtn, opacity: disabled ? 0.3 : 1 }}
                onClick={action}
                disabled={disabled}
                whileHover={!disabled ? { scale: 1.1 } : {}}
                whileTap={!disabled ? { scale: 0.9 } : {}}
              >
                {icon}
              </motion.button>
            ))}

            <form onSubmit={handleIdInputSubmit} style={styles.navForm}>
              <span style={styles.navInputLabel}>Round #</span>
              <input
                type="number"
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                style={styles.navInput}
                min={1}
                max={currentLotteryId || 1}
              />
              <motion.button
                type="submit"
                style={styles.navGoBtn}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                Go
              </motion.button>
            </form>

            {[
              { icon: "▶", action: () => goToLottery(viewingId + 1),    disabled: !viewingId || viewingId >= currentLotteryId },
              { icon: "⏭", action: () => goToLottery(currentLotteryId), disabled: !viewingId || viewingId >= currentLotteryId },
            ].map(({ icon, action, disabled }) => (
              <motion.button
                key={icon}
                style={{ ...styles.navBtn, opacity: disabled ? 0.3 : 1 }}
                onClick={action}
                disabled={disabled}
                whileHover={!disabled ? { scale: 1.1 } : {}}
                whileTap={!disabled ? { scale: 0.9 } : {}}
              >
                {icon}
              </motion.button>
            ))}
          </div>

          {!isViewingCurrent && (
            <motion.div
              style={styles.historyBanner}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              📜 Viewing historical round #{viewingId}
            </motion.div>
          )}
        </motion.div>

        {/* LOADING */}
        <AnimatePresence>
          {dataLoading && (
            <motion.div
              style={styles.dataLoadingOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{ fontSize: "28px" }}
              >
                ⏳
              </motion.span>
              <span>Loading lottery data...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP ROW */}
        <div style={styles.topRow}>
          <motion.div style={styles.infoCard} variants={fadeUp} custom={0}>
            <div style={styles.infoLabel}>🆔 Lottery Round</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={viewingId}
                style={styles.infoValue}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                #{viewingId ?? "--"}
              </motion.div>
            </AnimatePresence>
            {isViewingCurrent && (
              <span style={styles.liveBadge}>● LIVE</span>
            )}
          </motion.div>

          <motion.div style={styles.infoCard} variants={fadeUp} custom={1}>
            <div style={styles.infoLabel}>📋 Status</div>
            <StatusBadge
              status={status}
              onClick={(desc) => setStatusModal({ open: true, message: desc })}
            />
          </motion.div>

          <motion.div
            style={{ ...styles.infoCard, ...styles.infoCardWide }}
            variants={fadeUp}
            custom={2}
          >
            <div style={styles.infoLabel}>🎯 Winning Number</div>
            <div style={styles.winningNumber}>
              {digits.map((d, i) => (
                <motion.span
                  key={`${finalNumber}-${i}`}
                  style={{
                    ...styles.digitBox,
                    color:       d === "-" ? "#555" : "#ffb74d",
                    background:  d === "-" ? "rgba(255,255,255,0.03)" : "rgba(255,152,0,0.12)",
                    borderColor: d === "-" ? "rgba(255,255,255,0.08)" : "rgba(255,152,0,0.35)",
                  }}
                  variants={digitVariant}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  {d}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div style={styles.infoCard} variants={fadeUp} custom={3}>
            <div style={styles.infoLabel}>🕐 Timeline</div>
            {[
              { label: "Start", value: formatDate(lotteryTimes.start) },
              { label: "End",   value: formatDate(lotteryTimes.end) },
              {
                label: "Price",
                value: ticketPrice
                  ? `${ethers.formatEther(ticketPrice)} CAKE`
                  : "—",
              },
            ].map((r) => (
              <div key={r.label} style={styles.timelineRow}>
                <span style={styles.timeLabel}>{r.label}</span>
                <span style={styles.timeValue}>{r.value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* STATS GRID */}
        <motion.div style={styles.statsGrid}>
          {statDefs.map((s, i) => (
            <Stat
              key={s.label}
              {...s}
              index={i}
              loadingModal={eventsLoading}
            />
          ))}
        </motion.div>

        {/* BRACKET TABLE */}
        {bracketsData.length > 0 && totalWinners > 0 && (
          <motion.div
            style={styles.tableContainer}
            variants={fadeUp}
            custom={5}
          >
            <div style={styles.tableTitle}>📊 Bracket Breakdown</div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Bracket", "Match", "Share %", "Winners", "Per Winner", "Total"].map(
                      (h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bracketsData.map((b, i) => (
                    <motion.tr
                      key={i}
                      style={styles.tr}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <td style={styles.td}>#{b.bracket}</td>
                      <td style={styles.td}>{b.matchDigits} digits</td>
                      <td style={styles.td}>{b.rewardBreakdown}%</td>
                      <td style={styles.td}>
                        <span style={{ color: b.winners > 0 ? "#00e676" : "#666", fontWeight: 700 }}>
                          {b.winners}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {ethers.formatEther(b.rewardPerWinner)} CAKE
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: "#ffb74d", fontWeight: 700 }}>
                          {ethers.formatEther(b.totalReward)} CAKE
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ACTION BUTTONS */}
        {isViewingCurrent && (
          <motion.div style={styles.btnRow} variants={fadeUp} custom={6}>
            <ActionButton
              variant="primary"
              loading={loading.start}
              disabled={anyLoading || status === "Open"}
              onClick={() =>
                confirmAction(
                  handleStartLottery,
                  "🚀 Start New Lottery",
                  `Create lottery #${(currentLotteryId || 0) + 1} with 6-min duration and 1 CAKE ticket price. Continue?`
                )
              }
            >
              🚀 Start Lottery
            </ActionButton>
            <ActionButton
              variant="info"
              loading={loading.close}
              disabled={!viewingId || anyLoading || status !== "Open"}
              onClick={() =>
                confirmAction(
                  handleCloseLottery,
                  "🔒 Close Lottery",
                  `Close lottery #${viewingId} and trigger VRF randomness request. No more tickets after this. Continue?`
                )
              }
            >
              🔒 Close Lottery
            </ActionButton>
            <ActionButton
              variant="danger"
              loading={loading.draw}
              disabled={!viewingId || anyLoading || status !== "Close"}
              onClick={() =>
                confirmAction(
                  handleDrawWinner,
                  "🎲 Draw Winner",
                  `Fulfill VRF and draw the winning number for lottery #${viewingId}. It will become claimable. Continue?`
                )
              }
            >
              🎲 Draw Winner
            </ActionButton>
            <ActionButton
              variant="info"
              disabled={anyLoading}
              onClick={() => fetchLotteryById(viewingId)}
            >
              🔄 Refresh
            </ActionButton>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

// ============================================================
// 🎨 STYLES
// ============================================================
const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px",
    position: "relative",
  },
  navigator: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  navHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  navTitle:     { fontSize: "18px", fontWeight: "800", color: "#ffb74d" },
  currentBadge: {
    background: "rgba(255,152,0,0.15)",
    border: "1px solid rgba(255,152,0,0.3)",
    color: "#ffb74d",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  navControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  navBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navForm: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "10px",
    padding: "4px 10px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  navInputLabel: { fontSize: "12px", color: "#888", fontWeight: "600" },
  navInput: {
    width: "60px",
    padding: "6px 8px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.3)",
    color: "#ffb74d",
    fontSize: "14px",
    fontWeight: "700",
    textAlign: "center",
    outline: "none",
  },
  navGoBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    background: "rgba(255,152,0,0.2)",
    color: "#ffb74d",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
  },
  historyBanner: {
    background: "rgba(255,152,0,0.08)",
    border: "1px solid rgba(255,152,0,0.2)",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "13px",
    color: "#ffb74d",
    fontWeight: "600",
    textAlign: "center",
  },
  dataLoadingOverlay: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "20px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "12px",
    color: "#ffb74d",
    fontWeight: "600",
    fontSize: "14px",
  },
  topRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  infoCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "16px 20px",
    position: "relative",
  },
  infoCardWide: { gridColumn: "span 1" },
  infoLabel: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "6px",
  },
  infoValue:  { fontSize: "22px", fontWeight: "800", color: "#ffb74d" },
  liveBadge:  {
    position: "absolute",
    top: "12px",
    right: "14px",
    fontSize: "10px",
    fontWeight: "800",
    color: "#00e676",
    letterSpacing: "1px",
  },
  timelineRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  timeLabel:     { fontSize: "11px", color: "#888", fontWeight: "600" },
  timeValue:     { fontSize: "12px", color: "#ccc", fontWeight: "600" },
  winningNumber: { display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" },
  digitBox: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "1px solid rgba(255,152,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "800",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },
  statCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "16px",
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
  },
  statIcon:  { fontSize: "22px", marginBottom: "6px" },
  statLabel: {
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px",
  },
  statValue: { fontSize: "15px", fontWeight: "800", color: "#ffcc80", wordBreak: "break-all" },
  clickHint: {
    fontSize: "9px",
    color: "rgba(255,255,255,0.2)",
    marginTop: "6px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  tableContainer: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "16px",
    overflow: "hidden",
  },
  tableTitle:   { fontSize: "14px", fontWeight: "700", color: "#ffb74d", marginBottom: "12px" },
  tableWrapper: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
  table:        { width: "100%", borderCollapse: "collapse", minWidth: "500px" },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
  td: { padding: "10px 12px", fontSize: "13px", color: "#ccc", whiteSpace: "nowrap" },
  btnRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btn: {
    padding: "12px 24px",
    borderRadius: "10px",
    border: "none",
    fontSize: "14px",
    fontWeight: "700",
    minWidth: "140px",
    textAlign: "center",
  },
  btnPrimary: { background: "linear-gradient(135deg, #ff9800, #f57c00)", color: "#000" },
  btnInfo:    { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" },
  btnDanger:  { background: "linear-gradient(135deg, #e74c3c, #c0392b)", color: "#fff" },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  modalBox: {
    background: "#12122a",
    border: "1px solid rgba(255,152,0,0.2)",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "88vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "18px 20px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  modalTitle:    { fontSize: "16px", fontWeight: "800", color: "#ffb74d" },
  modalSubtitle: { fontSize: "12px", color: "#666", marginTop: "3px" },
  modalClose: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalBody:        { padding: "16px 20px", overflowY: "auto", flex: 1 },
  modalLoadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "40px 0",
  },
  modalSummaryRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
    paddingBottom: "14px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  modalBigNum:   { fontSize: "32px", fontWeight: "900", color: "#ffb74d" },
  modalBigLabel: { fontSize: "13px", color: "#888" },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "8px 12px",
    marginBottom: "12px",
  },
  searchIcon:  { fontSize: "14px" },
  searchInput: { flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "13px" },
  searchClear: { background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  sortRow:     { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" },
  sortLabel:   { fontSize: "11px", color: "#666", fontWeight: "600" },
  sortBtn: {
    padding: "4px 12px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#888",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  sortBtnActive: {
    background: "rgba(255,152,0,0.15)",
    border: "1px solid rgba(255,152,0,0.4)",
    color: "#ffb74d",
  },
  winLegend: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    background: "rgba(0,230,118,0.05)",
    border: "1px solid rgba(0,230,118,0.15)",
    borderRadius: "10px",
    padding: "8px 12px",
    marginBottom: "10px",
    fontSize: "12px",
    color: "#aaa",
  },
  listWrap:     { display: "flex", flexDirection: "column", gap: "8px" },
  addressRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.05)",
    flexWrap: "wrap",
  },
  addressIndex: { fontSize: "11px", color: "#555", fontWeight: "700", minWidth: "26px" },
  addressMain:  { flex: 1, minWidth: "100px" },
  addressShort: { fontSize: "12px", color: "#aaa", fontFamily: "monospace" },
  addressBadge: { fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: "rgba(255,152,0,0.15)", color: "#ffb74d", fontWeight: "700" },
  addressExtra: { fontSize: "12px", color: "#00e676", fontWeight: "700" },
  copyBtn: {
    padding: "4px 8px",
    borderRadius: "6px",
    border: "none",
    background: "rgba(255,255,255,0.06)",
    cursor: "pointer",
    fontSize: "13px",
  },
  ticketRowEnhanced: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  ticketRowHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    flexWrap: "wrap",
    cursor: "default",
  },
  ticketIdBadge: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#ffb74d",
    background: "rgba(255,152,0,0.1)",
    border: "1px solid rgba(255,152,0,0.25)",
    borderRadius: "8px",
    padding: "3px 8px",
    whiteSpace: "nowrap",
  },
  ticketOwnerWrap: { display: "flex", flexDirection: "column", gap: "2px", minWidth: "100px" },
  ticketNumWrap:   { display: "flex", flexDirection: "column", gap: "4px" },
  ticketLabel:     { fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px" },
  ticketAddressRow:{ display: "flex", alignItems: "center", gap: "5px" },
  ticketAddress:   { fontSize: "12px", color: "#aaa", fontFamily: "monospace" },
  copyBtnSm:       { background: "none", border: "none", cursor: "pointer", fontSize: "11px", padding: "2px" },
  rawNumber:       { fontSize: "11px", color: "#666", fontFamily: "monospace" },
  bracketMatchBadge: {
    fontSize: "11px",
    padding: "3px 8px",
    borderRadius: "20px",
    background: "rgba(0,230,118,0.12)",
    border: "1px solid rgba(0,230,118,0.3)",
    color: "#00e676",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  bracketPill: {
    fontSize: "11px",
    padding: "3px 8px",
    borderRadius: "20px",
    background: "rgba(100,180,255,0.12)",
    border: "1px solid rgba(100,180,255,0.3)",
    color: "#90caf9",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  expandBtn: {
    marginLeft: "auto",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#888",
    borderRadius: "6px",
    padding: "3px 8px",
    cursor: "pointer",
    fontSize: "10px",
  },
  ticketExpandBody: { borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)", overflow: "hidden" },
  ticketDetailGrid: { display: "flex", flexDirection: "column", gap: "8px", padding: "12px 14px" },
  ticketDetailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px 10px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.04)",
  },
  ticketDetailValue: { fontSize: "13px", color: "#ccc", fontWeight: "600" },
  miniDigitRow:   { display: "flex", gap: "3px", alignItems: "center" },
  miniDigit: {
    width: "22px",
    height: "22px",
    borderRadius: "5px",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "800",
    fontFamily: "monospace",
  },
  miniDigitRowLg: { display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" },
  miniDigitLg: {
    width: "30px",
    height: "30px",
    borderRadius: "7px",
    border: "1px solid rgba(255,152,0,0.3)",
    background: "rgba(255,152,0,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffb74d",
    fontFamily: "monospace",
  },
  bracketList:       { display: "flex", flexDirection: "column", gap: "8px" },
  bracketCard: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    padding: "12px 14px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  bracketCardHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" },
  bracketNum:    { fontSize: "13px", fontWeight: "800", color: "#ffb74d" },
  bracketMatch:  { fontSize: "12px", color: "#888", flex: 1 },
  bracketShare:  { fontSize: "12px", color: "#90caf9", fontWeight: "700" },
  bracketCardBody: { display: "flex", gap: "16px", flexWrap: "wrap" },
  bStat:         { display: "flex", flexDirection: "column", gap: "2px" },
  bStatLabel:    { fontSize: "10px", color: "#666", textTransform: "uppercase" },
  bStatValue:    { fontSize: "13px", color: "#ccc", fontWeight: "700" },
  infoBox: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    background: "rgba(255,152,0,0.06)",
    border: "1px solid rgba(255,152,0,0.15)",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "#aaa",
    lineHeight: 1.6,
    marginBottom: "16px",
  },
  extraInfoGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "8px" },
  extraInfoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.05)",
    flexWrap: "wrap",
    gap: "4px",
  },
  extraInfoLabel: { fontSize: "12px", color: "#888", fontWeight: "600" },
  extraInfoValue: { fontSize: "13px", color: "#ffcc80", fontWeight: "700" },
  sectionTitle:   { fontSize: "13px", fontWeight: "700", color: "#ffb74d", marginBottom: "10px" },
  moreHint:       { textAlign: "center", color: "#666", fontSize: "12px", padding: "10px" },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "40px 0",
  },
};