import React, { useEffect, useState } from "react";
import { useContract } from "./useContract";
import Admin from "./components/Admin";
import SwapUI from "./components/BuyToken";
import LotteryCarousel from "./components/Lottery";
import "./App.css";
import "./components/Lottery.css";
import axios from "axios";
import SiteSettings from "./components/Settings";

export default function App() {
  const {
    contract, rngContract, vrfMockContract,
    account, connectWallet, disconnectWallet,
  } = useContract();
  const [isAdmin, setIsAdmin] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [lotteryId, setLotteryId] = useState(null);
  const [collected, setCollected] = useState("0");
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [siteSettings, setSiteSettings] = useState({
    navLogo: "🎟️ Loading...",
    heroTitle: "Loading...",
    heroSub: "Loading...",
    footerText: "© 2025 Lucky Chain Lottery",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("https://lottery-5mbv.onrender.com/api/settings");
        if (response.data) {
          setSiteSettings(response.data);
        }
      } catch (err) {
        console.error("Error fetching site settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!contract || !account) return;
      try {
        const owner = await contract.owner();
        setIsAdmin(owner.toLowerCase() === account.toLowerCase());
      } catch (err) { console.error(err); }
    };
    checkAdmin();
  }, [contract, account]);

  useEffect(() => {
    if (!contract) return;
    const fetchData = async () => {
      try {
        const id = await contract.viewCurrentLotteryId();
        if (id > 0) {
          const lottery = await contract.viewLottery(id);
          setLotteryId(Number(id));
          setEndTime(Number(lottery.endTime));
          setCollected(lottery.amountCollectedInCake.toString());
        }
      } catch (err) { console.error(err); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [contract]);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = endTime - now;
      if (diff <= 0) { setTimeLeft("⏰ Ended"); clearInterval(interval); return; }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const prizePool = collected !== "0"
    ? `${(Number(collected) / 1e18).toFixed(2)} CAKE`
    : "-- CAKE";

  return (
    <div className="page">
      <nav className="navbar">
        <div className="nav-logo">{siteSettings.navLogo}</div>
        <div className="nav-right">
          <button onClick={() => setShowSwapModal(true)} className="get-cake-btn">
            🥇Get Lucky
          </button>
          {account ? (
            <div className="nav-account-row">
              <span className="nav-account">{account.slice(0,6)}...{account.slice(-4)}</span>
              <span className="nav-role">{isAdmin ? "Admin" : "👤"}</span>
              <button onClick={disconnectWallet} className="logout-btn">Logout</button>
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-btn">🔗 Connect Wallet</button>
          )}
        </div>
      </nav>

      {showSwapModal && (
        <div className="swap-overlay">
          <div className="swap-modal">
            <div className="swap-modal-header">
              <h3 className="swap-modal-title"/>
            </div>
            <SwapUI onClose={() => setShowSwapModal(false)} />
          </div>
        </div>
      )}

      {account && isAdmin && (
        <section className="admin-section">
          <div className="admin-box">
            <h2 className="admin-title">Admin Panel</h2>
            <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
        >
          ⚙️ Site Settings
        </button>
            <Admin contract={contract} randomGenerator={rngContract} vrfMock={vrfMockContract} />
          </div>
          {showSettings && (
      <SiteSettings onClose={() => setShowSettings(false)} />
    )}
        </section>
      )}

      {/* Lottery Carousel — below navbar, shows ALL rounds */}
      <LotteryCarousel contract={contract} account={account} />

      <section className="hero">
        <div className="hero-glow" />
        <h1 className="hero-title">{siteSettings.heroTitle}</h1>
        <p className="hero-sub">{siteSettings.heroSub}</p>
        <div className="stat-row">
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <span className="stat-abel">Prize Pool</span>
            <span className="stat-val">{prizePool}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <span className="stat-abel">Draw In</span>
            <span className="stat-val">{timeLeft || "Loading..."}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🆔</span>
            <span className="stat-abel">Round</span>
            <span className="stat-val">#{lotteryId ?? "--"}</span>
          </div>
        </div>
        {!account && (
          <button onClick={connectWallet} className="hero-cta">
            🔗 Connect Wallet to Play
          </button>
        )}
      </section>

      <section className="how-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-row">
          {[
            { n:"1", icon:"🔗", title:"Connect Wallet", desc:"Link your MetaMask to get started." },
            { n:"2", icon:"🎟️", title:"Buy Tickets", desc:"Pick 6 lucky numbers per ticket." },
            { n:"3", icon:"🎲", title:"Wait for Draw", desc:"On-chain VRF draws winning numbers." },
            { n:"4", icon:"💸", title:"Claim Prize", desc:"Match numbers and claim instantly." },
          ].map((s) => (
            <div key={s.n} className="step-card">
              <div className="step-num">{s.n}</div>
              <div className="step-icon">{s.icon}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="prize-section">
        <h2 className="section-title">Prize Breakdown</h2>
        <p className="section-sub">Match numbers from right to left to win bigger prizes</p>
        <div className="prize-grid">
          {[
            { match:"Match all 6", pct:"50%", stars:6 },
            { match:"Match first 5", pct:"25%", stars:5 },
            { match:"Match first 4", pct:"10%", stars:4 },
            { match:"Match first 3", pct:"8%", stars:3 },
            { match:"Match first 2", pct:"5%", stars:2 },
            { match:"Match first 1", pct:"2%", stars:1 },
          ].map((p,i) => (
            <div key={i} className="prize-card">
              <div className="prize-stars">{"⭐".repeat(p.stars)}</div>
              <div className="prize-match">{p.match}</div>
              <div className="prize-pct">{p.pct}</div>
              <div className="prize-sub">of prize pool</div>
            </div>
          ))}
        </div>
      </section>

      <section className="feat-section">
        <h2 className="section-title">Why Lucky Lottery?</h2>
        <div className="feat-grid">
          {[
            { icon:"🔒", title:"Fully On-Chain", desc:"All logic runs on audited smart contracts." },
            { icon:"🎲", title:"Provably Fair", desc:"Chainlink VRF guarantees tamper-proof randomness." },
            { icon:"⚡", title:"Instant Payouts", desc:"Winnings go directly to your wallet." },
            { icon:"🌍", title:"Open to Everyone", desc:"No KYC, no restrictions — just a wallet." },
            { icon:"📊", title:"Full Transparency", desc:"Every draw and result is on-chain forever." },
            { icon:"💎", title:"6 Prize Tiers", desc:"Even matching 1 number earns a reward." },
          ].map((f,i) => (
            <div key={i} className="feat-card">
              <span className="feat-icon">{f.icon}</span>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="faq-section">
        <h2 className="section-title">FAQ</h2>
        <div className="faq-list">
          {[
            { q:"What token do I need?", a:"You need CAKE tokens on BNB Smart Chain to buy tickets." },
            { q:"How are numbers drawn?", a:"We use Chainlink VRF for verifiable, tamper-proof randomness." },
            { q:"When does the round end?", a:"Check the countdown timer above — it updates every second." },
            { q:"What if nobody wins jackpot?", a:"Unclaimed prizes roll over to the next round automatically." },
          ].map((f,i) => (
            <div key={i} className="faq-card">
              <h4 className="faq-q">❓ {f.q}</h4>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p className="footer-text">{siteSettings.footerText}</p>
        <p className="footer-links">
          <a href="https://sepolia.etherscan.io/address/0xf951de8724aeea9b3a9d8efb15c7c1158c6205d5#code" className="footer-link">Smart Contract</a>{" · "}
          <a href="https://github.com/sathyaseelan1596-lgtm/Lottery" className="footer-link">GitHub</a>
        </p>
      </footer>
    </div>
  );
}