import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS, ABI,
  RNG_ADDRESS, RNG_ABI,
  VRF_MOCK_ADDRESS, VRF_MOCK_ABI
} from "./Contract";

export function useContract() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [rngContract, setRngContract] = useState(null);
  const [vrfMockContract, setVrfMockContract] = useState(null);
  const [account, setAccount] = useState(null);

  // ✅ NEW: Helper to setup contracts in READ-ONLY mode (for guests)
  const setupReadOnlyContracts = async () => {
    if (!window.ethereum) return;
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
      // We pass 'prov' instead of 'signer'. This allows calling view functions.
      setContract(new ethers.Contract(CONTRACT_ADDRESS, ABI, prov));
      setRngContract(new ethers.Contract(RNG_ADDRESS, RNG_ABI, prov));
      setVrfMockContract(new ethers.Contract(VRF_MOCK_ADDRESS, VRF_MOCK_ABI, prov));
    } catch (err) {
      console.error("Read-only setup failed:", err);
    }
  };

  // ✅ MODIFIED: Setup contracts with a signer (for connected users)
  const setupWriteContracts = async (prov) => {
    const signer = await prov.getSigner();
    const address = await signer.getAddress();

    setProvider(prov);
    setSigner(signer);
    setAccount(address);
    // Using signer here allows sending transactions (buy tickets, etc.)
    setContract(new ethers.Contract(CONTRACT_ADDRESS, ABI, signer));
    setRngContract(new ethers.Contract(RNG_ADDRESS, RNG_ABI, signer));
    setVrfMockContract(new ethers.Contract(VRF_MOCK_ADDRESS, VRF_MOCK_ABI, signer));
  };

  // ✅ CONNECT WALLET
  const connectWallet = async () => {
    if (!window.ethereum) {
      const url = window.location.href;
      window.location.href = `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//, "")}`;
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      await setupWriteContracts(prov);

      localStorage.removeItem("isDisconnected");
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  // ✅ AUTO CONNECT & READ-ONLY INIT
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;

      // 1. ALWAYS initialize read-only contracts first so guests see data
      await setupReadOnlyContracts();

      // 2. Check if we should auto-connect the wallet
      const isDisconnected = localStorage.getItem("isDisconnected");
      if (isDisconnected) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          const prov = new ethers.BrowserProvider(window.ethereum);
          await setupWriteContracts(prov);
        }
      } catch (err) {
        console.error("Auto connect failed:", err);
      }
    };

    init();
  }, []);

  // ✅ LISTEN for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      const isDisconnected = localStorage.getItem("isDisconnected");
      if (isDisconnected) return;

      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const prov = new ethers.BrowserProvider(window.ethereum);
        await setupWriteContracts(prov);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // ✅ DISCONNECT
  const disconnectWallet = () => {
    localStorage.setItem("isDisconnected", "true");
    setAccount(null);
    setSigner(null);
    // IMPORTANT: Revert to Read-Only mode instead of setting contracts to null
    setupReadOnlyContracts(); 
  };

  return {
    provider,
    signer,
    contract,
    rngContract,
    vrfMockContract,
    account,
    connectWallet,
    disconnectWallet,
  };
}