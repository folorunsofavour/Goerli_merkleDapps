const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3("https://eth-goerli.g.alchemy.com/v2/CH1V81ZMzVXNjIFWnRNNTTgY0nD_Twh6");

const whitelistedAddresses = require('./whitelist.json');

const abi = require('./abi.json');
const contractAddress = "0x22165aC977947a52E00f63d1E6408bD2d7003522";

const nftContract = new web3.eth.Contract(abi, contractAddress);


export const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            return {
                success: true,
                status: "connected",
                address: addressArray[0],
            };
        } catch (err) {
            return {
                success: false,
                address: "",
                status: err.message,
            };
        }
    } else {
        return {
            success: false,
            address: "",
            status: "You must install MetaMask, a virtual Ethereum wallet, in your browser.",
        };
    }
};
  
export const getCurrentWalletConnected = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_accounts",
            });

            if (addressArray.length > 0) {
                return {
                    address: addressArray[0],
                    status: "connected",
                    success: true,
                };
            } else {
                return {
                    address: "",
                    status: "connect wallet",
                    success: false,
                };
            }
        } catch (err) {
            return {
                address: "",
                status: err.message,
                success: false,
            };
        }
    } else {
        return {
            address: "",
            status: "You must install MetaMask, a virtual Ethereum wallet, in your browser.",
            success: false
        };
    }
};


export const getMerkleProof = async (address) => {

    const whitelistLeafNodes = whitelistedAddresses.map((addr) => keccak256(addr));
    const whitelistMerkleTree = new MerkleTree(whitelistLeafNodes, keccak256, { sortPairs: true });
    const whitelistRootHash = whitelistMerkleTree.getHexRoot();

    //code to generate proof and check if address is valid for wl
    const hashedAddress = keccak256(address);
    const proof = whitelistMerkleTree.getHexProof(hashedAddress);
    const valid = whitelistMerkleTree.verify(proof, hashedAddress, whitelistRootHash);

    return {proof : proof, valid : valid};
};

export const getMaxSupply = async () => {
    const result = await nftContract.methods.maxSupply().call();
    return result;
}

export const getCurrentSupply = async () => {
    const result = await nftContract.methods.totalSupply().call();
    return result;
}


export const getMaxWLMint = async () => {
    const result = await nftContract.methods.maxWLTokensPerWallet().call();
    return result;
}

export const getMaxPublicMint = async () => {
    const result = await nftContract.methods.maxPublicTokensPerWallet().call();
    return result;
}

export const getWlClaimed = async (address) => {
    const result = await nftContract.methods.numberMintedWl(address).call();
    return result;
}

export const getNumberMinted = async (address) => {
    const result = await nftContract.methods.numberMinted(address).call();
    return result;
}

export const getMintState = async () => {
    const result = await nftContract.methods.saleState().call();
    return result;
}

const getCost = async () => {
    const result = await nftContract.methods.cost().call();
    const resultEther = web3.utils.fromWei(result, "ether");
    return resultEther;
}

let responseMint = {
    success: false,
    status: ""
};

export const mintPublic = async (mintAmount, account) => {
    const costEther = await getCost();
    const costWEI = web3.utils.toWei(costEther, "ether");

    await nftContract.methods.publicMint(mintAmount)
    .send({
      from: account,
      to: contractAddress,
      value: (costWEI * mintAmount).toString()
    })
    .then(function(receipt){
    //   console.log("receipt: ", receipt);
      responseMint.success = true;
      responseMint.status = "Mint succesfull, Thank you for minting!";
    }).catch(function(error){
      console.log("error: ", error);
      responseMint.success = false;
      responseMint.status = "Something went wrong";
    });
  
    return responseMint;
}

export const mintWhitelist = async (proof, mintAmount, account) => {
    const costEther = await getCost();
    const costWEI = web3.utils.toWei(costEther, "ether");

    await nftContract.methods.whitelistMint(proof, mintAmount)
    .send({
      from: account,
      to: contractAddress,
      value: (costWEI * mintAmount).toString()
    })
    .then(function(receipt){
    //   console.log("receipt: ", receipt);
      responseMint.success = true;
      responseMint.status = "Mint succesfull, Thank you for minting!";
    }).catch(function(error){
      console.log("error: ", error);
      responseMint.success = false;
      responseMint.status = "Something went wrong";
    });
  
    return responseMint;
}

export {getCost}

