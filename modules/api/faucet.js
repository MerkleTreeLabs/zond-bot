const axios = require('axios');
const web3 = require('@theqrl/web3');

const config = require('../../config.json');
const helper = require('../helpers');

async function sendFaucetTx(toAddress, amount) {
	console.log('sendFaucetTx called');
	try {
		const transferAmount = helper.decToHex(amount);
		console.log(`transferAmount:\t${transferAmount}`)
		// get nonce from address on chain
		const { nonce } = (await axios.get(`${config.zondPubAPI}/nonce?address=${config.faucetAddress}`)).data;
		console.log(`nonce:\t${nonce}`);
		const chainId = (await axios.get(`${config.zondPubAPI}/chainID`)).data.result;

		const pendingBaseFee = (await axios.get(`${config.zondPubAPI}/pendingBaseFee`)).data.result;
		// around 100 Shor
		const tip = 0x174876eabc;
		const txData = {
			from: config.faucetAddress,
			to: `0x${toAddress}`,
			gasLimit: 21000,
			type: '0x2',
			value: `0x${transferAmount}`,
			chainId,
			nonce,
		};

		const estimatedGas = (await axios.post(`${config.zondPubAPI}/estimateGas`, txData)).data;

		txData.gas = estimatedGas.result;
		txData.maxPriorityFeePerGas = `0x${tip.toString(16)}`;
		txData.maxFeePerGas = `0x${(tip + parseInt(pendingBaseFee, 16) - 1).toString(16)}`;
		console.log('Transaction data (unsigned):', txData);

		const transaction = web3.TransactionFactory.fromTxData(txData);
		const signedTx = await web3.signTransaction(transaction, `${HEXSEED.value}`);

		console.log('Signed transaction:', signedTx.rawTransaction);
		const txHash = (await axios.post(`${config.zondPubAPI}/rawTransaction`, { body: signedTx.rawTransaction })).data;
		console.log('Result of sending raw transaction:', txHash);
	}
	catch (error)	{
		throw new Error(`Error occurred: ${error.message}`);
	}
}

module.exports = sendFaucetTx;
