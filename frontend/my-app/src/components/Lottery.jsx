// src/components/LotteryCarousel.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ethers } from "ethers";
import { createPortal } from "react-dom";
import BuyTickets from "./BuyTickets";
import ClaimTickets from "./ClaimTickets";
import MyTickets from "./ViewUserTickets";
import UserStats from "./UserStats";

const STATUS_MAP = {
  0: { label: "Pending", color: "#a1a1aa", bg: "rgba(161,161,170,0.1)" },
  1: { label: "Open", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  2: { label: "Closed", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  3: { label: "Claimable", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
};

const LotteryStatus = {
  PENDING: 0,
  OPEN: 1,
  CLOSE: 2,
  CLAIMABLE: 3,
};

const INITIAL_LOAD = 7;
const BATCH_SIZE = 5;

function parseLotteryStruct(raw, id) {
  try {
    const statusNum = Number(raw.status ?? raw[0]);
    const startTime = Number(raw.startTime ?? raw[1]);
    const endTime = Number(raw.endTime ?? raw[2]);
    const priceTicketInCake = raw.priceTicketInCake ?? raw[3];
    const discountDivisor = raw.discountDivisor ?? raw[4];

    const rewardsBreakdown = [];
    const rbRaw = raw.rewardsBreakdown ?? raw[5];
    if (rbRaw)
      for (let i = 0; i < 6; i++)
        rewardsBreakdown.push(rbRaw[i] !== undefined ? Number(rbRaw[i]) : 0);

    const treasuryFee = Number(raw.treasuryFee ?? raw[6] ?? 0);
    const amountCollectedInCake = raw.amountCollectedInCake ?? raw[7] ?? 0n;
    const finalNumber = Number(raw.finalNumber ?? raw[8] ?? 0);
    const firstTicketId = Number(raw.firstTicketId ?? raw[9] ?? 0);
    const firstTicketIdNextLottery = Number(
      raw.firstTicketIdNextLottery ?? raw[10] ?? 0
    );

    const countWinnersPerBracket = [];
    const cwRaw = raw.countWinnersPerBracket ?? raw[11];
    if (cwRaw)
      for (let i = 0; i < 6; i++)
        countWinnersPerBracket.push(
          cwRaw[i] !== undefined ? Number(cwRaw[i]) : 0
        );

    const cakePerBracket = [];
    const cpRaw = raw.cakePerBracket ?? raw[12];
    if (cpRaw)
      for (let i = 0; i < 6; i++)
        cakePerBracket.push(cpRaw[i] !== undefined ? cpRaw[i] : 0n);

    return {
      lotteryId: id,
      status: statusNum,
      startTime,
      endTime,
      priceTicketInCake,
      discountDivisor,
      rewardsBreakdown,
      treasuryFee,
      amountCollectedInCake,
      finalNumber,
      firstTicketId,
      firstTicketIdNextLottery,
      countWinnersPerBracket,
      cakePerBracket,
    };
  } catch (e) {
    console.error(`Failed to parse lottery #${id}:`, e);
    return null;
  }
}

function formatCake(val) {
  try {
    if (val === undefined || val === null) return "0.00";
    return Number(ethers.formatEther(val)).toFixed(2);
  } catch {
    return "0.00";
  }
}

function isLotteryActuallyLive(lottery) {
  if (!lottery) return false;
  const now = Math.floor(Date.now() / 1000);
  return lottery.status === LotteryStatus.OPEN && lottery.endTime > now;
}

function isLotteryClosed(lottery) {
  if (!lottery) return false;
  const now = Math.floor(Date.now() / 1000);
  return lottery.status !== LotteryStatus.OPEN || lottery.endTime <= now;
}

function getDisplayLotteryStatus(lottery) {
  if (!lottery) return LotteryStatus.PENDING;
  const now = Math.floor(Date.now() / 1000);

  if (lottery.status === LotteryStatus.CLAIMABLE)
    return LotteryStatus.CLAIMABLE;
  if (lottery.status === LotteryStatus.CLOSE) return LotteryStatus.CLOSE;
  if (
    lottery.status === LotteryStatus.OPEN &&
    Number(lottery.endTime) <= now
  )
    return LotteryStatus.CLOSE;

  return lottery.status;
}

function isWaitingForNextRound(lottery, currentId) {
  if (!lottery) return false;
  return lottery.lotteryId === currentId && isLotteryClosed(lottery);
}

function TicketBall({ num, dim }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim || 34,
        height: dim || 34,
        borderRadius: "8px",
        background: "#27272a",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#e4e4e7",
        fontWeight: 700,
        fontSize: dim ? dim * 0.4 : 13,
        flexShrink: 0,
      }}
    >
      {String(num).padStart(2, "0")}
    </span>
  );
}

function CountdownBadge({ endTime }) {
  const [left, setLeft] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    const tick = () => {
      const diff = endTime - Math.floor(Date.now() / 1000);
      if (diff <= 0) {
        setLeft("Ended");
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(diff);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(
          2,
          "0"
        )}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const isEnded = secondsLeft !== null && secondsLeft <= 0;
  const isUrgent = !isEnded && secondsLeft !== null && secondsLeft < 60;

  return (
    <span
      className={`lc-countdown-badge ${
        isEnded
          ? "lc-countdown-badge--ended"
          : isUrgent
          ? "lc-countdown-badge--urgent"
          : ""
      }`}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {isEnded ? "⏰ Ended" : isUrgent ? `🚨 ${left}` : left}
    </span>
  );
}

function LotteryClosedBanner({ lottery, isLastClosed }) {
  const displayStatus = getDisplayLotteryStatus(lottery);

  const config = {
    [LotteryStatus.CLOSE]: {
      icon: "🎰",
      title: "Round Closed",
      desc: "Drawing in progress…",
      showDots: true,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.07)",
      border: "rgba(239,68,68,0.2)",
    },
    [LotteryStatus.CLAIMABLE]: {
      icon: "🏆",
      title: "Results Available",
      desc: "Winners announced! Check your tickets.",
      showDots: false,
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.07)",
      border: "rgba(96,165,250,0.2)",
    },
    [LotteryStatus.PENDING]: {
      icon: "⏳",
      title: "Round Pending",
      desc: "Waiting for this round to open.",
      showDots: false,
      color: "#a1a1aa",
      bg: "rgba(161,161,170,0.07)",
      border: "rgba(161,161,170,0.2)",
    },
  };

  const cfg = config[displayStatus] ?? {
    icon: "🔒",
    title: "Round Ended",
    desc: isLastClosed
      ? "Waiting for the next round to start."
      : "Check the results below.",
    showDots: false,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
  };

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "14px",
        padding: "20px 20px 16px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 0%, ${cfg.border}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: `${cfg.bg}`,
          border: `1px solid ${cfg.border}`,
          borderRadius: "20px",
          padding: "4px 12px",
          marginBottom: "12px",
          position: "relative",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: cfg.color,
            display: "inline-block",
            boxShadow: `0 0 6px ${cfg.color}`,
          }}
        />
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: cfg.color,
            letterSpacing: "1.2px",
          }}
        >
          LOTTERY CLOSED
        </span>
      </div>

      <div style={{ fontSize: "36px", marginBottom: "8px" }}>{cfg.icon}</div>

      <p
        style={{
          fontSize: "16px",
          fontWeight: 800,
          color: "#e4e4e7",
          margin: "0 0 6px",
        }}
      >
        {cfg.title}
      </p>

      <p
        style={{
          fontSize: "13px",
          color: "#a1a1aa",
          margin: 0,
          lineHeight: "1.5",
        }}
      >
        {cfg.desc}
      </p>

      {cfg.showDots && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "10px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: cfg.color,
                display: "inline-block",
                animation: `lcDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {isLastClosed && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginTop: "14px",
            textAlign: "left",
            position: "relative",
          }}
        >
          <span style={{ fontSize: "20px", flexShrink: 0 }}>⏳</span>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#d4d4d8",
                margin: "0 0 2px",
              }}
            >
              Next Round Coming Soon
            </p>
            <p style={{ fontSize: "12px", color: "#71717a", margin: 0 }}>
              Ticket purchases will be available once the new round starts.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lcDotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ═══ COMPACT CARD ═══════════════════════════════════════════ */
function LotteryCardCompact({
  lottery,
  isCurrent,
  currentId,
  onClick,
  account,
}) {
  if (!lottery) {
    return (
      <div className="lc-card lc-card--empty">
        <div className="lc-empty-icon">🎟️</div>
        <p className="lc-empty-txt">No data</p>
        <p className="lc-empty-sub">Could not load this round</p>
      </div>
    );
  }

  const {
    lotteryId,
    status,
    endTime,
    priceTicketInCake,
    amountCollectedInCake,
    finalNumber,
    firstTicketId,
    firstTicketIdNextLottery,
    countWinnersPerBracket,
  } = lottery;

  const displayStatus = getDisplayLotteryStatus(lottery);
  const st = STATUS_MAP[displayStatus] ?? STATUS_MAP[0];

  const pool = formatCake(amountCollectedInCake);
  const ticketPr = formatCake(priceTicketInCake);

  const totalTix =
    firstTicketIdNextLottery &&
    firstTicketId &&
    firstTicketIdNextLottery > firstTicketId
      ? firstTicketIdNextLottery - firstTicketId
      : null;

  const totalWinners = countWinnersPerBracket
    ? countWinnersPerBracket.reduce((a, b) => a + b, 0)
    : 0;

  const winNums =
    finalNumber && finalNumber > 1000000
      ? String(finalNumber).slice(1).split("").reverse().map(Number)
      : null;

  const live = isLotteryActuallyLive(lottery);
  const closed = isLotteryClosed(lottery);
  const isOpen = status === LotteryStatus.OPEN;
  const isClaimable = status === LotteryStatus.CLAIMABLE;
  const showWaitNotice = isWaitingForNextRound(lottery, currentId);

  return (
    <div
      className={`lc-card ${isCurrent ? "lc-card--current" : ""} ${
        closed ? "lc-card--closed" : ""
      }`}
      onClick={onClick}
    >
      <div className="lc-card-header">
        <div className="lc-id-row">
          <span className="lc-round-badge">#{lotteryId}</span>
          {live && !closed && <span className="lc-current-badge">● LIVE</span>}
        </div>

        <div className="lc-header-right">
          <span
            className="lc-status-chip"
            style={{
              color: st.color,
              background: st.bg,
              border: `1px solid ${st.color}22`,
            }}
          >
            {st.label}
          </span>
        </div>
      </div>

      <div className="lc-pool-hero">
        <span className="lc-pool-label">Prize Pool</span>
        <span className="lc-pool-val">
          {pool} <span className="lc-pool-unit">CAKE</span>
        </span>
      </div>

      <div className="lc-preview-row">
        {winNums ? (
          <div className="lc-preview-balls">
            {winNums.map((n, i) => (
              <TicketBall key={i} num={n} dim={26} />
            ))}
          </div>
        ) : live ? (
          <div className="lc-preview-countdown">
            ⏳ <CountdownBadge endTime={endTime} />
          </div>
        ) : closed ? (
          <div
            className="lc-preview-closed"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: showWaitNotice ? "#ef4444" : "#a1a1aa",
              fontWeight: 600,
            }}
          >
            <span>🔒</span>
            <span>
              {displayStatus === LotteryStatus.CLOSE
                ? "Drawing in progress…"
                : displayStatus === LotteryStatus.CLAIMABLE
                ? "Results available"
                : displayStatus === LotteryStatus.PENDING
                ? "Waiting to open"
                : "Round closed"}
            </span>
          </div>
        ) : (
          <div className="lc-preview-status">
            {st.label === "Pending" ? "Waiting to start" : st.label}
          </div>
        )}

        <div className="lc-preview-stats">
          {totalTix !== null && (
            <span className="lc-preview-stat">🎫 {totalTix}</span>
          )}
          {totalWinners > 0 && (
            <span className="lc-preview-stat">🏆 {totalWinners}</span>
          )}
          <span className="lc-preview-stat">{ticketPr} CAKE</span>
        </div>
      </div>

      {isOpen && live && account && (
        <button
          className="lc-card-buy-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          🎟️ Buy Tickets
        </button>
      )}

      {showWaitNotice && !isClaimable && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#f87171",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          ⏳ Waiting for next round
        </div>
      )}

      {isClaimable && account && (
        <button
          className="lc-card-buy-btn lc-card-buy-btn--claim"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          💸 Claim Prize
        </button>
      )}

      <span className="lc-tap-hint">Tap to expand</span>
    </div>
  );
}

/* ═══ MODAL ══════════════════════════════════════════════════ */
function LotteryModal({
  lottery,
  isCurrent,
  currentId,
  onClose,
  contract,
  account,
}) {
  const [innerTab, setInnerTab] = useState("info");

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!lottery) return null;

  const {
    lotteryId,
    status,
    startTime,
    endTime,
    priceTicketInCake,
    amountCollectedInCake,
    finalNumber,
    firstTicketId,
    firstTicketIdNextLottery,
    rewardsBreakdown,
    treasuryFee,
    countWinnersPerBracket,
    cakePerBracket,
  } = lottery;

  const displayStatus = getDisplayLotteryStatus(lottery);
  const st = STATUS_MAP[displayStatus] ?? STATUS_MAP[0];

  const pool = formatCake(amountCollectedInCake);
  const ticketPr = formatCake(priceTicketInCake);

  const totalTix =
    firstTicketIdNextLottery &&
    firstTicketId &&
    firstTicketIdNextLottery > firstTicketId
      ? firstTicketIdNextLottery - firstTicketId
      : null;

  const treasury = treasuryFee ? (treasuryFee / 100).toFixed(0) : null;

  const totalWinners = countWinnersPerBracket
    ? countWinnersPerBracket.reduce((a, b) => a + b, 0)
    : 0;

  const winNums =
    finalNumber && finalNumber > 1000000
      ? String(finalNumber).slice(1).split("").reverse().map(Number)
      : null;

  const live = isLotteryActuallyLive(lottery);
  const closed = isLotteryClosed(lottery);
  const isOpen = status === LotteryStatus.OPEN;
  const isClaimable = status === LotteryStatus.CLAIMABLE;
  const isLastClosed = isWaitingForNextRound(lottery, currentId);

  const tiers = rewardsBreakdown
    ? [
        {
          label: "Match 6",
          pct: rewardsBreakdown[5],
          winners: countWinnersPerBracket?.[5] || 0,
          perWinner: cakePerBracket?.[5],
        },
        {
          label: "Match 5",
          pct: rewardsBreakdown[4],
          winners: countWinnersPerBracket?.[4] || 0,
          perWinner: cakePerBracket?.[4],
        },
        {
          label: "Match 4",
          pct: rewardsBreakdown[3],
          winners: countWinnersPerBracket?.[3] || 0,
          perWinner: cakePerBracket?.[3],
        },
        {
          label: "Match 3",
          pct: rewardsBreakdown[2],
          winners: countWinnersPerBracket?.[2] || 0,
          perWinner: cakePerBracket?.[2],
        },
        {
          label: "Match 2",
          pct: rewardsBreakdown[1],
          winners: countWinnersPerBracket?.[1] || 0,
          perWinner: cakePerBracket?.[1],
        },
        {
          label: "Match 1",
          pct: rewardsBreakdown[0],
          winners: countWinnersPerBracket?.[0] || 0,
          perWinner: cakePerBracket?.[0],
        },
      ].filter((t) => t.pct !== undefined)
    : [];

  const tabs = [{ key: "info", label: "Info" }];
  if (isOpen && live && account) tabs.push({ key: "buy", label: "Buy" });
  if ((isClaimable || status === LotteryStatus.CLOSE) && account)
    tabs.push({ key: "claim", label: "Claim" });
  if (account) {
    tabs.push({ key: "tickets", label: "Tickets" });
    tabs.push({ key: "stats", label: "Stats" });
  }

  return createPortal(
    <div className="lc-modal-overlay" onClick={onClose}>
      <div className="lc-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ──────────────────────────────────────── */}
        <div className="lc-modal-header">
          <div className="lc-modal-title-row">
            <span className="lc-round-badge">Round #{lotteryId}</span>

            {live && !closed && (
              <span className="lc-current-badge">● LIVE</span>
            )}

            {/* ✅ Single unified status chip — no extra badge */}
            <span
              className="lc-status-chip"
              style={{
                color: st.color,
                background: st.bg,
                border: `1px solid ${st.color}22`,
              }}
            >
              {st.label}
            </span>
          </div>

          <button className="lc-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Pool ────────────────────────────────────────── */}
        <div className="lc-pool-hero">
          <span className="lc-pool-label">Prize Pool</span>
          <span className="lc-pool-val">
            {pool} <span className="lc-pool-unit">CAKE</span>
          </span>
        </div>

        {/* ── CTA Area ────────────────────────────────────── */}
        {isOpen && live && account && (
          <button
            className="lc-modal-buy-btn"
            onClick={() => setInnerTab("buy")}
          >
            🎟️ Buy Tickets — {ticketPr} CAKE each
          </button>
        )}

        {closed && status !== LotteryStatus.CLAIMABLE && (
          <div style={{ marginBottom: "16px" }}>
            <LotteryClosedBanner
              lottery={lottery}
              isLastClosed={isLastClosed}
            />
          </div>
        )}

        {isClaimable && account && (
          <button
            className="lc-modal-buy-btn lc-modal-buy-btn--claim"
            onClick={() => setInnerTab("claim")}
          >
            💸 Claim Your Prize
          </button>
        )}

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className="lc-inner-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setInnerTab(tab.key)}
              className={`lc-inner-tab ${
                innerTab === tab.key ? "lc-inner-tab--active" : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ─────────────────────────────────── */}
        <div className="lc-inner-content" key={innerTab}>
          {innerTab === "info" && (
            <div className="lc-info-panel">
              {winNums ? (
                <div className="lc-section">
                  <p className="lc-section-title">Winning Numbers</p>
                  <div className="lc-balls-row">
                    {winNums.map((n, i) => (
                      <TicketBall key={i} num={n} />
                    ))}
                  </div>
                  <p className="lc-final-raw">Raw: {finalNumber}</p>
                </div>
              ) : live ? (
                <div className="lc-section">
                  <p className="lc-section-title">Draw Countdown</p>
                  <div className="lc-countdown">
                    <CountdownBadge endTime={endTime} />
                  </div>
                </div>
              ) : closed && status === LotteryStatus.CLAIMABLE ? (
                <div className="lc-section">
                  <LotteryClosedBanner
                    lottery={lottery}
                    isLastClosed={isLastClosed}
                  />
                </div>
              ) : null}

              <div className="lc-stats-grid">
                <div className="lc-stat">
                  <span className="lc-stat-icon">🎫</span>
                  <span className="lc-stat-label">Price</span>
                  <span className="lc-stat-val">{ticketPr} CAKE</span>
                </div>

                {totalTix !== null && (
                  <div className="lc-stat">
                    <span className="lc-stat-icon">🔢</span>
                    <span className="lc-stat-label">Sold</span>
                    <span className="lc-stat-val">
                      {totalTix.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="lc-stat">
                  <span className="lc-stat-icon">🏆</span>
                  <span className="lc-stat-label">Winners</span>
                  <span className="lc-stat-val">{totalWinners}</span>
                </div>

                {startTime > 0 && (
                  <div className="lc-stat">
                    <span className="lc-stat-icon">🕐</span>
                    <span className="lc-stat-label">Start</span>
                    <span className="lc-stat-val">
                      {new Date(startTime * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {endTime > 0 && (
                  <div className="lc-stat">
                    <span className="lc-stat-icon">🕔</span>
                    <span className="lc-stat-label">End</span>
                    <span className="lc-stat-val">
                      {new Date(endTime * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {treasury && (
                  <div className="lc-stat">
                    <span className="lc-stat-icon">🏦</span>
                    <span className="lc-stat-label">Treasury</span>
                    <span className="lc-stat-val">{treasury}%</span>
                  </div>
                )}
              </div>

              {tiers.length > 0 && (
                <div className="lc-section">
                  <p className="lc-section-title">Reward Breakdown</p>
                  <div className="lc-tiers">
                    {tiers.map((t, i) => {
                      const pctVal = (Number(t.pct) / 100).toFixed(0);
                      return (
                        <div key={i} className="lc-tier-row">
                          <span className="lc-tier-label">{t.label}</span>
                          <div className="lc-tier-bar-wrap">
                            <div
                              className="lc-tier-bar-fill"
                              style={{
                                width: `${Math.max(4, Number(pctVal))}%`,
                              }}
                            />
                          </div>
                          <span className="lc-tier-pct">{pctVal}%</span>
                          <span className="lc-tier-winners">
                            {t.winners > 0 ? `${t.winners}` : "—"}
                          </span>
                          {t.perWinner && Number(t.perWinner) > 0 && (
                            <span className="lc-tier-reward">
                              {formatCake(t.perWinner)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isOpen && live && account && (
                <button
                  className="lc-modal-buy-btn"
                  onClick={() => setInnerTab("buy")}
                >
                  🎟️ Buy Tickets for Round #{lotteryId}
                </button>
              )}

              {closed && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "12px 16px",
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: "#f87171",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  🔒 Ticket purchases are closed for this round
                </div>
              )}
            </div>
          )}

          {innerTab === "buy" && (
            <div className="lc-action-panel">
              {closed ? (
                <LotteryClosedBanner
                  lottery={lottery}
                  isLastClosed={isLastClosed}
                />
              ) : (
                <>
                  <div className="lc-action-header">
                    <h3 className="lc-action-title">
                      Buy Tickets — Round #{lotteryId}
                    </h3>
                    <p className="lc-action-sub">
                      {ticketPr} CAKE per ticket · Pool: {pool} CAKE
                    </p>
                  </div>
                  <BuyTickets contract={contract} />
                </>
              )}
            </div>
          )}

          {innerTab === "claim" && (
            <div className="lc-action-panel">
              <div className="lc-action-header">
                <h3 className="lc-action-title">
                  Claim Prize — Round #{lotteryId}
                </h3>
                {winNums && (
                  <div className="lc-action-winning">
                    <span>Winning: </span>
                    {winNums.map((n, i) => (
                      <TicketBall key={i} num={n} dim={22} />
                    ))}
                  </div>
                )}
              </div>
              <ClaimTickets contract={contract} account={account} />
            </div>
          )}

          {innerTab === "tickets" && (
            <div className="lc-action-panel">
              <div className="lc-action-header">
                <h3 className="lc-action-title">
                  My Tickets — Round #{lotteryId}
                </h3>
              </div>
              <MyTickets contract={contract} account={account} />
            </div>
          )}

          {innerTab === "stats" && (
            <div className="lc-action-panel">
              <div className="lc-action-header">
                <h3 className="lc-action-title">
                  My Stats — Round #{lotteryId}
                </h3>
              </div>
              <UserStats
                contract={contract}
                account={account}
                lotteryId={lotteryId}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══ MAIN CAROUSEL ══════════════════════════════════════════ */
export default function LotteryCarousel({ contract, account }) {
  const [lotteryMap, setLotteryMap] = useState({});
  const [currentId, setCurrentId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [modalLotteryId, setModalLotteryId] = useState(null);
  const [loadedMin, setLoadedMin] = useState(null);
  const [loadedMax, setLoadedMax] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingNewer, setLoadingNewer] = useState(false);

  const trackRef = useRef(null);
  const startXRef = useRef(null);
  const isDragging = useRef(false);
  const leftSentinelRef = useRef(null);
  const rightSentinelRef = useRef(null);

  const sortedIds = useMemo(
    () =>
      Object.keys(lotteryMap)
        .map(Number)
        .sort((a, b) => a - b),
    [lotteryMap]
  );

  const fetchSingleLottery = useCallback(
    async (id) => {
      if (!contract || id < 1) return null;
      try {
        const raw = await contract.viewLottery(id);
        return parseLotteryStruct(raw, id);
      } catch (e) {
        console.error(`Failed to fetch lottery #${id}:`, e);
        return null;
      }
    },
    [contract]
  );

  const fetchBatch = useCallback(
    async (ids) => {
      const results = await Promise.allSettled(
        ids.map((id) => fetchSingleLottery(id))
      );
      const map = {};
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value)
          map[r.value.lotteryId] = r.value;
      });
      return map;
    },
    [fetchSingleLottery]
  );

  const initialLoad = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      let cid;
      try {
        cid = Number(await contract.viewCurrentLotteryId());
      } catch {
        try {
          cid = Number(await contract.currentLotteryId());
        } catch {
          setError("Cannot read current lottery ID");
          setLoading(false);
          return;
        }
      }

      setCurrentId(cid);
      setTotalCount(cid);

      const startId = Math.max(1, cid - INITIAL_LOAD + 1);
      const ids = [];
      for (let i = startId; i <= cid; i++) ids.push(i);

      const fetched = await fetchBatch(ids);
      setLotteryMap(fetched);
      setLoadedMin(startId);
      setLoadedMax(cid);

      const sorted = Object.keys(fetched)
        .map(Number)
        .sort((a, b) => a - b);
      const curIdx = sorted.indexOf(cid);
      setActiveIdx(curIdx >= 0 ? curIdx : sorted.length - 1);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Failed to load lottery data.");
      setLoading(false);
    }
  }, [contract, fetchBatch]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  useEffect(() => {
    if (!contract || !currentId) return;
    const iv = setInterval(async () => {
      const updated = await fetchSingleLottery(currentId);
      if (updated)
        setLotteryMap((prev) => ({ ...prev, [currentId]: updated }));
      try {
        const latestId = Number(await contract.viewCurrentLotteryId());
        if (latestId > currentId) {
          setCurrentId(latestId);
          setTotalCount(latestId);
        }
      } catch {}
    }, 15000);
    return () => clearInterval(iv);
  }, [contract, currentId, fetchSingleLottery]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !contract || loadedMin === null || loadedMin <= 1)
      return;
    setLoadingOlder(true);
    const endId = loadedMin - 1;
    const startId = Math.max(1, endId - BATCH_SIZE + 1);
    const ids = [];
    for (let i = startId; i <= endId; i++) ids.push(i);
    const fetched = await fetchBatch(ids);
    const newCount = Object.keys(fetched).length;
    setLotteryMap((prev) => ({ ...prev, ...fetched }));
    setLoadedMin(startId);
    if (newCount > 0) setActiveIdx((prev) => prev + newCount);
    setLoadingOlder(false);
  }, [contract, loadedMin, loadingOlder, fetchBatch]);

  const loadNewer = useCallback(async () => {
    if (loadingNewer || !contract || loadedMax === null) return;
    let latestId;
    try {
      latestId = Number(await contract.viewCurrentLotteryId());
    } catch {
      try {
        latestId = Number(await contract.currentLotteryId());
      } catch {
        return;
      }
    }
    setCurrentId(latestId);
    setTotalCount(latestId);
    if (loadedMax >= latestId) return;
    setLoadingNewer(true);
    const startId = loadedMax + 1;
    const endId = Math.min(latestId, startId + BATCH_SIZE - 1);
    const ids = [];
    for (let i = startId; i <= endId; i++) ids.push(i);
    const fetched = await fetchBatch(ids);
    setLotteryMap((prev) => ({ ...prev, ...fetched }));
    setLoadedMax(endId);
    setLoadingNewer(false);
  }, [contract, loadedMax, loadingNewer, fetchBatch]);

  useEffect(() => {
    if (loading || sortedIds.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === leftSentinelRef.current) loadOlder();
            else if (entry.target === rightSentinelRef.current) loadNewer();
          }
        });
      },
      { root: trackRef.current, rootMargin: "0px 200px", threshold: 0.1 }
    );
    if (leftSentinelRef.current) observer.observe(leftSentinelRef.current);
    if (rightSentinelRef.current) observer.observe(rightSentinelRef.current);
    return () => observer.disconnect();
  }, [loading, sortedIds.length, loadOlder, loadNewer]);

  useEffect(() => {
    if (!trackRef.current || modalLotteryId !== null) return;
    const slides = trackRef.current.querySelectorAll(".lc-slide");
    const target = slides[activeIdx + 1];
    if (target)
      target.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
  }, [activeIdx, modalLotteryId]);

  const goTo = useCallback(
    (i) => setActiveIdx(Math.max(0, Math.min(sortedIds.length - 1, i))),
    [sortedIds.length]
  );
  const prev = () => goTo(activeIdx - 1);
  const next = () => goTo(activeIdx + 1);
  const goToCurrent = useCallback(() => {
    const idx = sortedIds.indexOf(currentId);
    if (idx >= 0) setActiveIdx(idx);
  }, [sortedIds, currentId]);

  const openModal = useCallback((id) => setModalLotteryId(id), []);
  const closeModal = useCallback(() => setModalLotteryId(null), []);

  const onPointerDown = (e) => {
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX;
    isDragging.current = false;
  };
  const onPointerMove = (e) => {
    if (startXRef.current === null) return;
    const dx = (e.clientX ?? e.touches?.[0]?.clientX) - startXRef.current;
    if (Math.abs(dx) > 8) isDragging.current = true;
  };
  const onPointerUp = (e) => {
    if (startXRef.current === null) return;
    const dx =
      (e.clientX ?? e.changedTouches?.[0]?.clientX) - startXRef.current;
    if (isDragging.current) {
      if (dx < -40) next();
      else if (dx > 40) prev();
    }
    startXRef.current = null;
    isDragging.current = false;
  };

  if (!contract)
    return (
      <div className="lc-placeholder">
        <div className="lc-placeholder-icon">🔌</div>
        <p>Connect your wallet to view lottery rounds.</p>
      </div>
    );
  if (loading)
    return (
      <div className="lc-placeholder">
        <div className="lc-loader" />
        <p>Loading lottery data…</p>
      </div>
    );
  if (error)
    return (
      <div className="lc-placeholder lc-placeholder--err">
        <div className="lc-placeholder-icon">⚠️</div>
        <p>{error}</p>
        <button className="lc-retry-btn" onClick={initialLoad}>
          Retry
        </button>
      </div>
    );
  if (sortedIds.length === 0)
    return (
      <div className="lc-placeholder">
        <div className="lc-placeholder-icon">🎟️</div>
        <p>No lotteries found.</p>
      </div>
    );

  const canLoadOlder = loadedMin !== null && loadedMin > 1;
  const canLoadNewer = loadedMax !== null && loadedMax < totalCount;
  const currentLottery = lotteryMap[currentId];
  const currentIsLive = isLotteryActuallyLive(currentLottery);
  const currentIsClosed = isLotteryClosed(currentLottery);

  return (
    <div className="lc-root">
      <div className="lc-header-bar">
        <div className="lc-header-left">
          <h2 className="lc-main-title">Lottery Rounds</h2>
          <span className="lc-round-count">
            {sortedIds.length} / {totalCount} loaded
          </span>
        </div>
        <div className="lc-header-actions">
          <button
            className="lc-nav-quick-btn"
            onClick={() => goTo(0)}
            disabled={activeIdx === 0}
          >
            ⏮ Oldest
          </button>

          <button
            className={`lc-nav-quick-btn ${
              currentIsLive
                ? "lc-nav-quick-btn--current"
                : "lc-nav-quick-btn--closed"
            }`}
            onClick={goToCurrent}
            style={
              currentIsClosed
                ? {
                    color: "#ef4444",
                    borderColor: "rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.08)",
                  }
                : {}
            }
          >
            {currentIsLive ? "● LIVE" : "🔒 Closed"} #{currentId}
          </button>

          <button
            className="lc-nav-quick-btn"
            onClick={() => goTo(sortedIds.length - 1)}
            disabled={activeIdx === sortedIds.length - 1}
          >
            Newest ⏭
          </button>
          <button className="lc-refresh-btn" onClick={initialLoad}>
            ↻
          </button>
        </div>
      </div>

      <div className="lc-viewport">
        <button
          className="lc-arrow"
          onClick={prev}
          disabled={activeIdx === 0 && !canLoadOlder}
          aria-label="Previous"
        >
          ‹
        </button>

        <div
          ref={trackRef}
          className="lc-track"
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={(e) => onPointerDown(e.touches[0])}
          onTouchMove={(e) => onPointerMove(e.touches[0])}
          onTouchEnd={onPointerUp}
        >
          <div ref={leftSentinelRef} className="lc-sentinel">
            {loadingOlder ? (
              <div className="lc-sentinel-loader" />
            ) : canLoadOlder ? (
              <span className="lc-sentinel-end">◀</span>
            ) : (
              <span className="lc-sentinel-end">START</span>
            )}
          </div>

          {sortedIds.map((id, i) => (
            <div
              key={id}
              className={`lc-slide ${
                activeIdx === i ? "lc-slide--active" : ""
              }`}
              onClick={() => {
                if (!isDragging.current) goTo(i);
              }}
            >
              <LotteryCardCompact
                lottery={lotteryMap[id]}
                isCurrent={id === currentId}
                currentId={currentId}
                account={account}
                onClick={() => {
                  if (!isDragging.current) openModal(id);
                }}
              />
            </div>
          ))}

          <div ref={rightSentinelRef} className="lc-sentinel">
            {loadingNewer ? (
              <div className="lc-sentinel-loader" />
            ) : canLoadNewer ? (
              <span className="lc-sentinel-end">▶</span>
            ) : (
              <span className="lc-sentinel-end">END</span>
            )}
          </div>
        </div>

        <button
          className="lc-arrow"
          onClick={next}
          disabled={activeIdx === sortedIds.length - 1 && !canLoadNewer}
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {sortedIds.length > 1 && (
        <div className="lc-progress-bar-wrap">
          <div className="lc-progress-bar">
            <div
              className="lc-progress-fill"
              style={{
                width: `${((activeIdx + 1) / sortedIds.length) * 100}%`,
              }}
            />
          </div>
          <span className="lc-progress-label">
            #{sortedIds[activeIdx]} · {activeIdx + 1} of {sortedIds.length}
          </span>
        </div>
      )}

      {sortedIds.length <= 20 && (
        <div className="lc-dots">
          {sortedIds.map((id, i) => (
            <button
              key={id}
              className={`lc-dot ${activeIdx === i ? "lc-dot--active" : ""} ${
                id === currentId ? "lc-dot--current" : ""
              }`}
              onClick={() => goTo(i)}
              title={`#${id}`}
            />
          ))}
        </div>
      )}

      <div className="lc-footer">
        {(loadingOlder || loadingNewer) && (
          <div className="lc-loading-more">
            <div className="lc-loader-sm" />
            <span>Loading more…</span>
          </div>
        )}
        <span className="lc-footer-hint">
          Scroll to load all {totalCount} rounds · Tap a card to expand
        </span>
      </div>

      {modalLotteryId !== null && lotteryMap[modalLotteryId] && (
        <LotteryModal
          lottery={lotteryMap[modalLotteryId]}
          isCurrent={modalLotteryId === currentId}
          currentId={currentId}
          onClose={closeModal}
          contract={contract}
          account={account}
        />
      )}
    </div>
  );
}