import React, { useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const VAULT_ADDRESS = "0x4fa10b7721d1e98f5ed992382ca59890cb70f5c5";
const USDC_ADDRESS = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];
const VAULT_ABI = [
  "function deposit(uint256 assets, address receiver) external returns (uint256)",
  "function convertToAssets(uint256 shares) external view returns (uint256)"
];

export default function VaultUI({ account, onClose }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");

  React.useEffect(() => {
    const fetchBal = async () => {
      if (!account) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      const bal = await usdc.balanceOf(account);
      setBalance(ethers.formatUnits(bal, 6));
    };
    fetchBal();
  }, [account]);

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return toast.error("⚠️ Enter amount");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      const parsedAmount = ethers.parseUnits(amount, 6);

      const allowance = await usdcContract.allowance(account, VAULT_ADDRESS);
      if (allowance < parsedAmount) {
        const tid = toast.loading("🔓 Approving USDC...");
        const appTx = await usdcContract.approve(VAULT_ADDRESS, ethers.MaxUint256);
        await appTx.wait();
        toast.dismiss(tid);
        toast.success("✅ Approved!");
      }

      const tid2 = toast.loading("🏦 Depositing into Vault...");
      const depTx = await vaultContract.deposit(parsedAmount, account);
      await depTx.wait();
      toast.dismiss(tid2);
      
      toast.success("🎉 Luck Tokens Minted!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("❌ Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex", flexDirection: "column", gap: "14px", width: "100%",
        background: "rgba(15,15,15,0.98)", backdropFilter: "blur(12px)",
        padding: "20px", borderRadius: "inherit", border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff", fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>🏦</span>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#ffb74d", margin: 0 }}>Vault Mint</h2>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#aaa", cursor: "pointer" }}>✕ Close</button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "#888", textTransform: "uppercase" }}>Deposit USDC</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffb74d", background: "rgba(255,152,0,0.1)", padding: "2px 10px", borderRadius: "20px" }}>USDC</span>
        </div>
        <input
          type="number" placeholder="0.0" value={amount} onChange={e => setAmount(e.target.value)}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "22px", fontWeight: 700 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span style={{ fontSize: "12px", color: "#666" }}>Balance: {balance}</span>
          <button onClick={() => setAmount(balance)} style={{ background: "rgba(255,152,0,0.15)", border: "1px solid rgba(255,152,0,0.3)", borderRadius: "6px", color: "#ff9800", fontSize: "11px", cursor: "pointer" }}>MAX</button>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={handleDeposit} disabled={loading}
        style={{
          width: "100%", padding: "15px", background: "linear-gradient(135deg,#ff9800,#f57c00)",
          border: "none", borderRadius: "12px", color: "#000", fontWeight: 800, cursor: "pointer",
        }}
      >
        {loading ? "⏳ Processing..." : "✨ Mint Luck Tokens"}
      </motion.button>
    </motion.div>
  );
}