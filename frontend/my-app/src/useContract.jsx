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

  const setupReadOnlyContracts = async () => {
    if (!window.ethereum) return;
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      console.log(await prov.getNetwork());
      setProvider(prov);
      setContract(new ethers.Contract(CONTRACT_ADDRESS, ABI, prov));
      setRngContract(new ethers.Contract(RNG_ADDRESS, RNG_ABI, prov));
      setVrfMockContract(new ethers.Contract(VRF_MOCK_ADDRESS, VRF_MOCK_ABI, prov));
    } catch (err) {
      console.error("Read-only setup failed:", err);
    }
  };

  const setupWriteContracts = async (prov) => {
    const signer = await prov.getSigner();
    const address = await signer.getAddress();

    setProvider(prov);
    setSigner(signer);
    setAccount(address);
    setContract(new ethers.Contract(CONTRACT_ADDRESS, ABI, signer));
    setRngContract(new ethers.Contract(RNG_ADDRESS, RNG_ABI, signer));
    setVrfMockContract(new ethers.Contract(VRF_MOCK_ADDRESS, VRF_MOCK_ABI, signer));
  };

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

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;

      await setupReadOnlyContracts();

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

  const disconnectWallet = () => {
    localStorage.setItem("isDisconnected", "true");
    setAccount(null);
    setSigner(null);
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