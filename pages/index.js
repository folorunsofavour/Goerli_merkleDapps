import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import {
  getCurrentWalletConnected,
  connectWallet,
  getMaxSupply,
  getCurrentSupply,
  getMintState,
  getCost,
  getMerkleProof,
  getNumberMinted,
  getWlClaimed,
  getMaxPublicMint,
  getMaxWLMint,
  mintPublic,
  mintWhitelist
} from "../utils/interact.js";

export default function Home() {


  const [walletAddress, setWalletAddress] = useState("");
  const [mintAmount, setMintAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [maxSupply, setMaxSupply] = useState(0);
  const [currentSupply, setCurrentSupply] = useState(0);
  const [saleStatus, setSaleStatus] = useState(0);


  const [numberMinted, setNumberMinted] = useState(0);
  const [wlClaimed, setWlClaimed] = useState(0);
  const [maxPublicMint, setMaxPublicMint] = useState(0);
  const [publicCost, setPublicCost] = useState(0);
  const [wlMaxMint, setWlMaxMint] = useState(0);
  const [wlUser, setWlUser] = useState({proof: [], valid: false});
  const [minting, setMinting] = useState(false);


  const addWalletListener = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress("");
        }
      });
    }
  };

  const connectWalletPressed = async () => {
    const {address, status, success} = await connectWallet();
    setWalletAddress(address);
    if(!success) toast.error(status);
  }

  const truncate = (address) => {
    return String(address).substring(0, 6) +"..." +String(address).substring(38);
  };

  const fetchData =  async () => {
    const { success, status, address } = await getCurrentWalletConnected();
    setWalletAddress(address);
    if(!success) toast.error(status);
    setMaxSupply(Number(await getMaxSupply()));
    setCurrentSupply(Number(await getCurrentSupply()));
    setSaleStatus(Number(await getMintState()));
    setPublicCost(Number(await getCost()));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    addWalletListener();
  }, [])

  const getUserData = async () => {
    if(walletAddress.length > 0){
      setIsLoading(true);

      setNumberMinted(Number(await getNumberMinted(walletAddress)));
      setWlClaimed(Number(await getWlClaimed(walletAddress)));
      setMaxPublicMint(Number(await getMaxPublicMint()));
      setWlMaxMint(Number(await getMaxWLMint()));
      setCurrentSupply(Number(await getCurrentSupply()));

      const { proof, valid } = await getMerkleProof(walletAddress);
      setWlUser({...wlUser, proof , valid});

      // toast.success('Connected: '+ truncate(walletAddress));
      setIsLoading(false);

    }
  };

  useEffect(() => {
      getUserData();
  }, [walletAddress])

  const incrementCount = () => {
    let maxMintAmount;
    if (saleStatus == 1) {
      maxMintAmount =  wlMaxMint - wlClaimed;
    }else{
      maxMintAmount = maxPublicMint - (numberMinted - wlClaimed);
    }

    {mintAmount < maxMintAmount && setMintAmount(mintAmount + 1);}
  };

  const decrementCount = () => {
    if (mintAmount > 1) {
      setMintAmount(mintAmount - 1);
    }
  };


  const publicMintPressed = async () => {
    setMinting(true);

    const toastPublic = toast.loading(`Minting "${mintAmount}" DUCKS...`);
    const { success, status } = await mintPublic(mintAmount, walletAddress);
    toast.dismiss(toastPublic);

    if(success) {
      toast.success(status);
      getUserData(); 
    }else{
      toast.error(status);
    }
    setMintAmount(1);
    setMinting(false);
  }

  const whitelistMintPressed = async () => {
    setMinting(true);

    const toastWL = toast.loading(`Minting "${mintAmount}" DUCKS...`);
    const { success, status } = await mintWhitelist(wlUser.proof, mintAmount, walletAddress);
    toast.dismiss(toastWL);

    if(success) {
      toast.success(status);
      getUserData(); 
    }else{
      toast.error(status);
    }
    setMinting(false);
  }

  const mintSectionCount = () => {
    return (
      <>
        <div className="bg-gray-500 flex items-center mt-6 text-3xl font-bold text-gray-200" style={{width: 300, borderRadius: 10}}>
          <button
              className="flex items-center justify-center w-12 h-12"
              onClick={decrementCount}
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 12H4"
              />
            </svg>
          </button>

          <p className="mx-24 text-white">{mintAmount}</p>

          <button
              style={{marginLeft: 'auto', marginRight: 0}}
              className="flex items-center justify-center w-12 h-12 text-center"
              onClick={incrementCount}
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <div className="border-t-2 border-b-2 border-indigo-500  py-4 mt-5 w-full">
          <div className="w-full font-bold text-center text-white flex items-center justify-between">
            <p>Cost</p>

            <div className="flex items-center space-x-3 ">
              <p>
                {parseFloat(publicCost * mintAmount).toFixed(3)}{' '}
                ETH
              </p>{' '}
              <span className="text-sm text-gray-300">+ GAS</span>
            </div>
          </div>
        </div>
      </>
    )
  };

  return (
    <>
      <Head>
        <title>Duck Frens</title>
        <meta name="description" content="6969 of the frenliest ducks in the metaverse." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preload" href="/fonts/GothamRounded-Bold.otf" as="font" type="font/opentype" crossOrigin="anonymous"></link>
      </Head>

      <header className="inset-x-0 top-0 z-10 h-20 text-white">
        <div className="flex items-center container mx-auto justify-between h-full">
          {/* Logo */}
          <Link href="#">
            <img src="/images/logo.png" width={200} alt=""/>
          </Link>

          {/* Opensea Twitter Discord Links */}
          <nav aria-label="Contact Menu">
            <ul className="flex items-center space-x-6">
              <li>
                <a href="https://twitter.com/duckfrensNFT" target="_blank" rel="noreferrer">
                  <svg
                    className="w-7 h-7"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
                  </svg>
                </a>
              </li>

              <li>
                <a href="https://opensea.io/collection/duck-frens-nft" target="_blank" rel="noreferrer">
                  <svg
                    className="w-7 h-7"
                    viewBox="0 0 90 90"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M45 0C20.151 0 0 20.151 0 45C0 69.849 20.151 90 45 90C69.849 90 90 69.849 90 45C90 20.151 69.858 0 45 0ZM22.203 46.512L22.392 46.206L34.101 27.891C34.272 27.63 34.677 27.657 34.803 27.945C36.756 32.328 38.448 37.782 37.656 41.175C37.323 42.57 36.396 44.46 35.352 46.206C35.217 46.458 35.073 46.71 34.911 46.953C34.839 47.061 34.713 47.124 34.578 47.124H22.545C22.221 47.124 22.032 46.773 22.203 46.512ZM74.376 52.812C74.376 52.983 74.277 53.127 74.133 53.19C73.224 53.577 70.119 55.008 68.832 56.799C65.538 61.38 63.027 67.932 57.402 67.932H33.948C25.632 67.932 18.9 61.173 18.9 52.83V52.56C18.9 52.344 19.08 52.164 19.305 52.164H32.373C32.634 52.164 32.823 52.398 32.805 52.659C32.706 53.505 32.868 54.378 33.273 55.17C34.047 56.745 35.658 57.726 37.395 57.726H43.866V52.677H37.467C37.143 52.677 36.945 52.299 37.134 52.029C37.206 51.921 37.278 51.813 37.368 51.687C37.971 50.823 38.835 49.491 39.699 47.97C40.284 46.944 40.851 45.846 41.31 44.748C41.4 44.55 41.472 44.343 41.553 44.145C41.679 43.794 41.805 43.461 41.895 43.137C41.985 42.858 42.066 42.57 42.138 42.3C42.354 41.364 42.444 40.374 42.444 39.348C42.444 38.943 42.426 38.52 42.39 38.124C42.372 37.683 42.318 37.242 42.264 36.801C42.228 36.414 42.156 36.027 42.084 35.631C41.985 35.046 41.859 34.461 41.715 33.876L41.661 33.651C41.553 33.246 41.454 32.868 41.328 32.463C40.959 31.203 40.545 29.97 40.095 28.818C39.933 28.359 39.753 27.918 39.564 27.486C39.294 26.82 39.015 26.217 38.763 25.65C38.628 25.389 38.52 25.155 38.412 24.912C38.286 24.642 38.16 24.372 38.025 24.111C37.935 23.913 37.827 23.724 37.755 23.544L36.963 22.086C36.855 21.888 37.035 21.645 37.251 21.708L42.201 23.049H42.219C42.228 23.049 42.228 23.049 42.237 23.049L42.885 23.238L43.605 23.436L43.866 23.508V20.574C43.866 19.152 45 18 46.413 18C47.115 18 47.754 18.288 48.204 18.756C48.663 19.224 48.951 19.863 48.951 20.574V24.939L49.482 25.083C49.518 25.101 49.563 25.119 49.599 25.146C49.725 25.236 49.914 25.38 50.148 25.56C50.337 25.704 50.535 25.884 50.769 26.073C51.246 26.46 51.822 26.955 52.443 27.522C52.605 27.666 52.767 27.81 52.92 27.963C53.721 28.71 54.621 29.583 55.485 30.555C55.728 30.834 55.962 31.104 56.205 31.401C56.439 31.698 56.7 31.986 56.916 32.274C57.213 32.661 57.519 33.066 57.798 33.489C57.924 33.687 58.077 33.894 58.194 34.092C58.554 34.623 58.86 35.172 59.157 35.721C59.283 35.973 59.409 36.252 59.517 36.522C59.85 37.26 60.111 38.007 60.273 38.763C60.327 38.925 60.363 39.096 60.381 39.258V39.294C60.435 39.51 60.453 39.744 60.471 39.987C60.543 40.752 60.507 41.526 60.345 42.3C60.273 42.624 60.183 42.93 60.075 43.263C59.958 43.578 59.85 43.902 59.706 44.217C59.427 44.856 59.103 45.504 58.716 46.098C58.59 46.323 58.437 46.557 58.293 46.782C58.131 47.016 57.96 47.241 57.816 47.457C57.609 47.736 57.393 48.024 57.168 48.285C56.97 48.555 56.772 48.825 56.547 49.068C56.241 49.437 55.944 49.779 55.629 50.112C55.449 50.328 55.251 50.553 55.044 50.751C54.846 50.976 54.639 51.174 54.459 51.354C54.144 51.669 53.892 51.903 53.676 52.11L53.163 52.569C53.091 52.641 52.992 52.677 52.893 52.677H48.951V57.726H53.91C55.017 57.726 56.07 57.339 56.925 56.61C57.213 56.358 58.482 55.26 59.985 53.604C60.039 53.541 60.102 53.505 60.174 53.487L73.863 49.527C74.124 49.455 74.376 49.644 74.376 49.914V52.812V52.812Z"
                      fill="#fff"
                    ></path>
                  </svg>
                </a>
              </li>

              <li>
                <a href="https://discord.com/invite/duckfrens" target="_blank" rel="noreferrer">
                  <svg
                    className="w-7 h-7"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 448 512"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M297.216 243.2c0 15.616-11.52 28.416-26.112 28.416-14.336 0-26.112-12.8-26.112-28.416s11.52-28.416 26.112-28.416c14.592 0 26.112 12.8 26.112 28.416zm-119.552-28.416c-14.592 0-26.112 12.8-26.112 28.416s11.776 28.416 26.112 28.416c14.592 0 26.112-12.8 26.112-28.416.256-15.616-11.52-28.416-26.112-28.416zM448 52.736V512c-64.494-56.994-43.868-38.128-118.784-107.776l13.568 47.36H52.48C23.552 451.584 0 428.032 0 398.848V52.736C0 23.552 23.552 0 52.48 0h343.04C424.448 0 448 23.552 448 52.736zm-72.96 242.688c0-82.432-36.864-149.248-36.864-149.248-36.864-27.648-71.936-26.88-71.936-26.88l-3.584 4.096c43.52 13.312 63.744 32.512 63.744 32.512-60.811-33.329-132.244-33.335-191.232-7.424-9.472 4.352-15.104 7.424-15.104 7.424s21.248-20.224 67.328-33.536l-2.56-3.072s-35.072-.768-71.936 26.88c0 0-36.864 66.816-36.864 149.248 0 0 21.504 37.12 78.08 38.912 0 0 9.472-11.52 17.152-21.248-32.512-9.728-44.8-30.208-44.8-30.208 3.766 2.636 9.976 6.053 10.496 6.4 43.21 24.198 104.588 32.126 159.744 8.96 8.96-3.328 18.944-8.192 29.44-15.104 0 0-12.8 20.992-46.336 30.464 7.68 9.728 16.896 20.736 16.896 20.736 56.576-1.792 78.336-38.912 78.336-38.912z"></path>
                  </svg>
                </a>
              </li>

              <li>
                <a href="https://etherscan.io/address/0xa7f636adf14512199716688b33a069dbcb6d5766" target="_blank" rel="noreferrer">
                  <svg 
                    className="w-7 h-7"
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 293.775 293.667"
                  >
                    <g id="etherscan-logo-light-circle" transform="translate(-219.378 -213.333)">
                      <path id="Path_1" data-name="Path 1" d="M280.433,353.152A12.45,12.45,0,0,1,292.941,340.7l20.737.068a12.467,12.467,0,0,1,12.467,12.467v78.414c2.336-.692,5.332-1.43,8.614-2.2a10.389,10.389,0,0,0,8.009-10.11V322.073a12.469,12.469,0,0,1,12.467-12.47h20.779a12.47,12.47,0,0,1,12.467,12.47v90.276s5.2-2.106,10.269-4.245a10.408,10.408,0,0,0,6.353-9.577V290.9a12.466,12.466,0,0,1,12.465-12.467h20.779A12.468,12.468,0,0,1,450.815,290.9v88.625c18.014-13.055,36.271-28.758,50.759-47.639a20.926,20.926,0,0,0,3.185-19.537,146.6,146.6,0,0,0-136.644-99.006c-81.439-1.094-148.744,65.385-148.736,146.834a146.371,146.371,0,0,0,19.5,73.45,18.56,18.56,0,0,0,17.707,9.173c3.931-.346,8.825-.835,14.643-1.518a10.383,10.383,0,0,0,9.209-10.306V353.152" transform="translate(0 0)" fill="#fff"/>
                      <path id="Path_2" data-name="Path 2" d="M244.417,398.641A146.808,146.808,0,0,0,477.589,279.9c0-3.381-.157-6.724-.383-10.049-53.642,80-152.686,117.405-232.79,128.793" transform="translate(35.564 80.269)" fill="#bfcfda"/>
                    </g>
                  </svg>
                </a>
              </li>

            </ul>
          </nav>
        </div>
      </header>

      {/* main */}
      <main id="main" className="py-16 bg-pattern" style={{ marginBottom: '0px', marginTop: '0px'}}>
        <Toaster
          position="top-center"
          reverseOrder={false}
        />

        <div className="container mx-auto flex flex-col items-center pt-4">
          
          <div className="flex flex-col items-center">
          {isLoading ? 
            <div className="text-center mt-20">
              <div role="status">
                <svg className="inline mr-2 w-10 h-10 text-white-200 animate-spin dark:text-white-600 fill-amber-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          : <>
            {saleStatus > 0 ? (
              <>
                {/* Minted NFT Ratio */}
                <p className="bg-white rounded-md text-gray-800 font-extrabold text-lg my-4 py-1 px-3" style={{height: 80, fontSize: 45, borderRadius: 15, padding: 20}}>
                  <span style={{verticalAlign: 'middle'}} className="text-center">{`${currentSupply}`}/{maxSupply}</span> 
                </p>

                <h4 className="mt-2 font-bold text-lg text-center text-white">
                  {saleStatus === 1 ? "WHITELIST SALE" : "PUBLIC SALE"}
                </h4>
      
                {walletAddress.length > 0 ? (
                  <span className="text-sm text-gray-300">{truncate(walletAddress)}</span>
                  ) : (
                    <>
                      <h4 className="mt-2 font-bold text-center text-white">
                        DUCKS MINTED AT {publicCost} ETH{" "} EACH
                        {/* <span className="text-sm text-gray-300"> + GAS</span> */}
                      </h4>
                      
                      <button
                        style={{borderRadius: 15, width: 230}}
                        className="mt-6 py-2 px-4 text-4xl text-center text-white font-bold uppercase bg-green-400 rounded hover:bg-green-400 hover:border-green-500"
                        onClick={connectWalletPressed}
                      >
                        CONNECT
                      </button>
                  </>
                )}

                {(() => {
                  if(walletAddress !== ""){
                    if (saleStatus === 1 && wlUser.valid) {
                        if(wlClaimed >= wlMaxMint){
                          return(
                            <>
                              <h4 className="mt-2 font-bold text-center text-white">{`YOU HAVE MINTED ${wlClaimed}/${wlMaxMint} DUCKS`}</h4>
                            </>
                          )
                        }else{
                          return(
                            <>
                              {mintSectionCount()}
                              <h4 className="mt-2 font-bold text-center text-white">{`YOU MINTED ${wlClaimed}/${wlMaxMint} DUCKS SO FAR!`}</h4>
                              <button
                                  style={{borderRadius: 15, padding: 5, width: 150}}
                                  className="font-bold mt-6 py-2 px-4 text-4xl text-center text-white uppercase bg-green-400 rounded hover:bg-green-400 hover:border-green-500"
                                  disabled={minting}
                                  onClick={whitelistMintPressed}
                                >
                                  Mint
                              </button>
                            </>
                          )
                        }
                    } else if (saleStatus === 1 && !wlUser.valid) {
                      return (
                          <>
                            <h4 className="mt-2 font-bold text-center uppercase text-white">Sorry, you&#8242;re not whitelisted!</h4>
                          </>
                      )
                    } else {
                      return (
                        <>
                          {mintSectionCount()}
                          {/* <h4 className="mt-2 font-bold text-center text-white">PUBLIC SALE</h4> */}
                          <button
                              style={{borderRadius: 15, padding: 5, width: 150}}
                              className="font-bold mt-6 py-2 px-4 text-4xl text-center text-white uppercase bg-green-400 rounded hover:bg-green-400 hover:border-green-500"
                              disabled={minting}
                              onClick={publicMintPressed}
                            >
                             Mint
                          </button>
                        </>
                      )
                    }
                  }
                })()}

                {/* {mintSection()} */}
              </>
            ) : (
              <p className="text-white text-2xl mt-8">
                {" "}
                😥 Sale is not active yet!
              </p>
            )}
            </>}
          </div>
        </div>
      </main>
    </>
  )
}
