import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LotteryCarousel from "./Lottery";
const SwapUI = React.lazy(() => import("./BuyToken"));
const VaultUI = React.lazy(() => import("./VaultUI"));

export default function HomePage({ contract, account, connectWallet }) {
  const [lotteryData, setLotteryData] = useState({ id: null, endTime: null, collected: "0" });
  const [timeLeft, setTimeLeft] = useState("");
  const [tokenMethod, setTokenMethod] = useState(null);

  useEffect(() => {
    if (!contract) return;
    const fetchData = async () => {
      try {
        const id = await contract.viewCurrentLotteryId();
        if (id > 0) {
          const lottery = await contract.viewLottery(id);
          setLotteryData({ id: Number(id), endTime: Number(lottery.endTime), collected: lottery.amountCollectedInCake.toString() });
        }
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [contract]);

  useEffect(() => {
    if (!lotteryData.endTime) return;
    const timer = setInterval(() => {
      const diff = lotteryData.endTime - Math.floor(Date.now() / 1000);
      if (diff <= 0) { setTimeLeft("⏰ Ended"); clearInterval(timer); return; }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [lotteryData.endTime]);

  return (
    <>
      <div className="carousel-wrapper">
        <LotteryCarousel contract={contract} account={account} />
      </div>

      <section className="hero">
        <h1 className="hero-title">The Most Transparent Lottery on Chain</h1>
        <p className="hero-sub">Buy tickets, trust the VRF, and win massive rewards instantly.</p>
        
        <div className="stat-row">
          <div className="stat-card">
            <span className="stat-abel">Prize Pool</span>
            <span className="stat-val">{lotteryData.collected !== "0" ? `${ethers.formatUnits(lotteryData.collected, 6)} Luck` : "-- Luck"}</span>
          </div>
          <div className="stat-card">
            <span className="stat-abel">Draw In</span>
            <span className="stat-val">{timeLeft || "Calculating..."}</span>
          </div>
          <div className="stat-card">
            <span className="stat-abel">Round</span>
            <span className="stat-val">#{lotteryData.id ?? "--"}</span>
          </div>
        </div>

        <button onClick={() => setTokenMethod('choice')} className="hero-cta">🥇 Get Luck Tokens</button>
      </section>

      <section className="prize-section">
        <h2 className="section-title">Prize Breakdown</h2>
        <div className="prize-grid">
          {[{ m:"Match 6", p:"50%" }, { m:"Match 5", p:"25%" }, { m:"Match 4", p:"10%" }, { m:"Match 3", p:"8%" }, { m:"Match 2", p:"5%" }, { m:"Match 1", p:"2%" }].map((p, i) => (
            <div key={i} className="prize-card">
              <div className="prize-match">{p.m}</div>
              <div className="prize-pct">{p.p}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Token Modals */}
      {tokenMethod && (
        <div className="swap-overlay">
           <div className="swap-scroll">
              {tokenMethod === 'choice' && (
                <div className="method-selector-modal">
                  <h3>Get Luck Tokens</h3>
                  <div className="choice-grid">
                    <button onClick={() => setTokenMethod('vault')} className="choice-card">🏦 Vault Mint</button>
                    <button onClick={() => setTokenMethod('swap')} className="choice-card">🔄 Uniswap</button>
                  </div>
                  <button onClick={() => setTokenMethod(null)} className="close-btn">Close</button>
                </div>
              )}
              <React.Suspense fallback={<div className="loader">Loading...</div>}>
                {tokenMethod === 'swap' && <SwapUI onClose={() => setTokenMethod(null)} />}
                {tokenMethod === 'vault' && <VaultUI account={account} onClose={() => setTokenMethod(null)} />}
              </React.Suspense>
           </div>
        </div>
      )}
    </>
  );
}