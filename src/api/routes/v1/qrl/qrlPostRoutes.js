const express = require('express');
// Import QRL API functions here
const config = require('@config');
const { addAddressesWithSlave } = require('@qrl-chain/addAddressesWithSlave');
const { balance } = require('@qrl-chain/balanceLookup');
const { blockByNumber } = require('@qrl-chain/blockLookup');
const { getTransaction } = require('@qrl-chain/transactionLookup');
const { isValidAddress } = require('@qrl-chain/isValidAddressLookup');
const { otsIndex } = require('@qrl-chain/otsLookup');

const router = express.Router();

const addressPattern = /^Q[0-9a-fA-F]{78}$/;

/*
QRL endpoints

Complete:
- /qrl-balance
- /qrl-block-by-number
- /qrl-ots
- /qrl-is-valid-address
- /qrl-get-transaction
- /qrl-add-addresses-with-slave

In Progress:
- GetRecoverySeeds
- GetWalletInfo
- GetTotalBalance
- RelayTransferTxnBySlave
- RelayMessageTxnBySlave
- RelayTokenTxnBySlave
- RelayTransferTokenTxnBySlave
- GetTransactionsByAddress
- GetNodeInfo

*/

// qrl balance
/**
 * @swagger
 * /v1/qrl-balance:
 *   post:
 *     summary: Retrieve the balance for a given QRL address
 *     description: Fetch the current balance of a specified QRL address. The address must be provided in the request body. If the address is invalid or missing, a 400 error is returned.
 *     tags: [QRL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: The QRL address to retrieve the balance for (without the 0x prefix)
 *                 example: "Q010300284cc14642e9b2978218f70fcf76274d67d82f3cf7d9038d0e3e43bacfe293773f803931"
 *                 pattern: "^Q[0-9a-fA-F]{78}$"  # QRL address validation pattern
 *     responses:
 *       200:
 *         description: Successfully retrieved the QRL balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                   example: true
 *                 balance:
 *                   type: string
 *                   description: The balance of the provided QRL address in atomic units
 *                   example: "500000000000"
 *       400:
 *         description: Bad request, address missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message explaining the issue (e.g., missing address or invalid format)
 *                   example: "Address is required or invalid"
 *       500:
 *         description: Internal server error, indicating an issue with retrieving the balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Failed to fetch balance"
 */


router.post('/qrl-balance', async (req, res) => {
	const address = req.body.address;

	if (!address) {
		return res.status(400).json({ success: false, error: 'Address is required' });
	}

	// Validate the QRL address format
	if (!addressPattern.test(address)) {
		return res.status(400).json({ success: false, error: 'Invalid QRL address format' });
	}

	try {
		const currentBalance = await balance(address);
		res.status(200).json({ success: true, balance: currentBalance });
	}
	catch (error) {
		res.status(500).json({ success: false, error: `Failed to fetch balance ${error.message}` });
	}
});

// GetBlockByNumber

/**
 * @swagger
 * /v1/qrl-block-by-number:
 *   post:
 *     summary: Retrieve block information by block number from the QRL blockchain
 *     description: This endpoint returns detailed information about a specific block on the QRL blockchain based on the block number provided in the request body. If the block number is missing or invalid, a 400 error is returned.
 *     tags: [QRL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - block
 *             properties:
 *               block:
 *                 type: number
 *                 description: The block number to retrieve information for
 *                 example: 3278560
 *     responses:
 *       200:
 *         description: Successfully retrieved the block information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                   example: true
 *                 block:
 *                   type: object
 *                   description: Details of the block associated with the provided block number
 *                   properties:
 *                     header:
 *                       type: object
 *                       description: Block header information
 *                       properties:
 *                         hash_header:
 *                           type: string
 *                           example: "8b8ca8f84838cc692a1c9d6400b40fd0606d5f094542ec24babf52ae01000000"
 *                         block_number:
 *                           type: string
 *                           example: "3278560"
 *                         timestamp_seconds:
 *                           type: string
 *                           example: "1725996149"
 *                         hash_header_prev:
 *                           type: string
 *                           example: "a1a370194f0f180757167d09aa04ac8db28262f4b12936a5cf21f65a02000000"
 *                         reward_block:
 *                           type: string
 *                           example: "1542955244"
 *                         reward_fee:
 *                           type: string
 *                           example: "100000000"
 *                         merkle_root:
 *                           type: string
 *                           example: "4d30255294b81383ea717a01b884b94df6c5eeb7dc7e69dcfc3f0c1e31d927fb"
 *                         mining_nonce:
 *                           type: number
 *                           example: 982254592
 *                         extra_nonce:
 *                           type: string
 *                           example: "479105918830"
 *                     transactions:
 *                       type: array
 *                       description: Array of transactions in the block
 *                       items:
 *                         type: object
 *                         properties:
 *                           master_addr:
 *                             type: string
 *                             example: "Q0000000000000000000000000000000000000000000000000000000000000000"
 *                           nonce:
 *                             type: string
 *                             example: "3278561"
 *                           transaction_hash:
 *                             type: string
 *                             example: "1f4eef2df69b966be245ac36cb46f31aab3495070a447028e7315e24a61146b1"
 *                           coinbase:
 *                             type: object
 *                             description: Details of the coinbase transaction
 *                             properties:
 *                               addr_to:
 *                                 type: string
 *                                 example: "Q010800d1f8900a72abeb583737b8bcd1185e07a54760551173cd15ffe2408048a2df150556cad9"
 *                               amount:
 *                                 type: string
 *                                 example: "1642955244"
 *                           fee:
 *                             type: string
 *                             example: "100000000"
 *                           public_key:
 *                             type: string
 *                             example: "010500ae07540a5aed6a55aade2e2e8825875f08bf8277749e8d0e73c850002593365bd1dc2e3f0dc69b87c2760f63b1c67b0ccb14b7630cf8cec41b74fccf94215cc9"
 *                           signature:
 *                             type: string
 *                             example: "000003712cab54c873b37d4a4f11fa4854224df87eb0318bc29409e17d834b453ac253b8920ad718a5acb3c40f49878c39703f47510dd49b01286cc698777153029e2b42529024b4d86286c65a8a37ed7585f344b1000325d66e98cbc778b7b6da1acddf222482fef5b7dee21f982cc1ebc15c5e3bf2c4c7a830cfde4713275cd4a665cc22089372db5222e457ecf50bd09416b96cad8cca25c9ef8858e32572f6d299ada1e068735a671f44110329394f5f0307484f06d43ebde4be48de05eba8d776e3e43e732572a2ee8ca6d85d2bda7f88b5c713d9db3cffcc1682e232c96ffa28120d992f47cb286bf439b2d6b55276fa117816e494c8b5c55c5b7e43f2821371b6fe11ead822c3a9df766d074a516b87713db09469359b3ef631f84db124f9d0d99592105928b3d743a1476b689f1b458d77b5fc6f4358fb29496baac90298e52e3e3bb0a04ac0fe877bf1e59648fee2efadad6c22261af4a9812b5f9018137cd90596a45b27b620820757d5c0d3b73bbbe7ca1752f21b68a8fcb2e37214d44a1ef1596e009e4fc700dd1742ef0e5356efbb1df7a12cfdcac15d7fed81cddc4390a51f95a49a41edaa742ee5f52c1f1d5ebec7e0317329ee9f5f5a4c1e368f3d7f2f7c65aabd67373b5919c0a02b144513396a09b332cc9c8f29b3c9a510b62869a87335843dc04b540e0ba30d2c4a87c97e7c89d03f0a31c555f2df690507d48112b0ee12d5e95a3b3ad06c668aadff4a0021db672ce70bc8cd90014235d57ce7e5df486aa79e5fe4045dcd67119af3cbd156ef5d03c4c1c7f351a671f8529be1f790c4bc2a48009540bf0289fa38aa71adfdab98d6b8c6be91fbc566e269826ba3c26f4f5a190da3b4622a17f8bb42747cbc9079957ce37d0b43988afb14470ef00bc3aeff9e3b4f20f1c7833aed48ba3bfe3e1e24ab3ee5350b1026d426770e0c3a2c23e3dfb0f5fe8e28a8faba8789393654ab000f0bc72c099ebd15cbf0d0f99d27db03c98cdced3a34b69fb73d1a9c4765261430d051bc8acb411218b0781eac8e944c3a60934e15028d1a2e4d933fe07b957ef92ba0002b264f93a24e5c9c18181bfaa9d1843b2b5b6071677e0aef920948bdb794a4a1fa49f91aeca5e9635e5446a917c866bde5c157be7b6240a18c3659fff9cbb5f73f3058eb3cd2df4f899dee3b447804b03ad8e75128238d82bdfca6665156e1b1802e3ac0124b157ec3f3dbe0bb1b8d38dec13aad751834536532e036f3cd22edd38c359735f9cb0174d75764e6973b4b22b79dd55af8de63559991504c69844441f4ce075f339b88afcfaf51219a461f1f525c379fd71d0b398c6338cf9bd4108a0d4c67b19af3d66557bf91e5861cd44cf5017170c30256b9cc4d19010da917556811e95e9f37929a38f40a93e81a169ca9efbf2a0a57fb8ba185e028a0249d86bdd33801212ef690586a0f04d0d5fcdafa4d86c27ef3ebda6202d07945cb411966bc8a66980cacec22d8dcda2c210b4e32d7d8da7a94c19401fdbb82ad75b0a99d1e2eace3f3fbf60dfa566f367231d7e636efd425e2e62a6be5e65b490373acecdaa95e88002d871e02b4331fdf73ebe9351df15a5294a0fa8b945ea070fdf300a2c7f391296df448469501de0f36cb7044ea2d5257d49812f9e6e5acad4ec327156b65f12255ed19decfcc3eb21126ce7f8bdcd94c2b6e22915f05cc155781f7ac3bfe054000815fe0da1b68efa76aee3dbc2e91f575d4cebcfaf6f6a56043a112ae66362a0c6bdf248469ced1e969c0c2fd3207296982a160ccb7a0433acdc48eebb6fe903f38e857c438c0ccfded982778ce47cb0c352ad7a84c872938880377bf0efb904a715e9ef8dd57c3ab77f98c4c0ea61b00e9f7b96f8f90bf92edb44e9fb0079592490afeb1a689469d3d625767a28e6b82c323aeb73718878cddba9d221570d059f417e874014baf0c560f5fc14c3c07f35057d407a94457333c209e66df3971802ff77419b88047d7011f1e2b7c36245453f45c7317637f2c9d42d22e221972ae6949dc748aeac3cc64044e6c1fa13a451ce05ac6c3615b29b8226536b9be0d4148553501b594d804c3672b2faca7fd125fc7e6b9ace60628c6c21e06fb5bfd1ff2e4b604c683b80d5cf8f4639bf9dde377a6e988cdc07bdb16df8c33fd9a949bb0fb784fa8521c62e8bc5bf39e037f000a9518a7a382e8407ef38db72f02a236a947b78cf79300866e5615da69b399eef848db7a4bda5213dd6b811072abf580a44a3e814be452743cd517938833f9a57b457d1922be9de342da98add9a3fc4b35919527c1f381a7d5a004bbc22498c1ced0bd14a942325c191d2eb33f50cdbaef29d3139a86ef8f332490b9caf15b4fa9396b4bd6786b61312273a7771f8253c730fbf8df893497d515a13357f8408e8191c7122db96da6be7a072c8ee5108031465291a5bbf0172502a86d70e5bf90c01a315bfd93f53b8f2beda23b9e8b51339ceb839104623f97e4966f6135d1b930b4e3e58379235656a30f5ea81b7894e4e8af62306273c565a1016aea46004a1c06875f3898710511fbc02de02f729d17b7213d49357948a697ee9d23964b4c28000143796564b9a38598c00253c6bbe8ddb209e51b4560caa639a0269dca3afcfb67ce4dbed8fa05ce7cb269c174c3caf68638f323b6937144898c5f47a229c25135c57f9afeece1199489b123651c767393b89ef362e29c9db3da56611f360728d0325f325bdc6beda4a35b7f23b5f6ea2fbb08f3671eb7582094786666e84eb7c01a4a47a614b86e3940343ebd891e627eb6c21e005009b6ea97f318a9e1304105fb1ca98960d5a701d29ff06f74383925df1316a1e3f635a47d1dc18ce5d0c7429bcd9eb7230cdc3aaaa7cd9efb74d89fb8c71316bf9d961d529f1c0c15eb2678915b12f03bfb12024ad83fd44eb8cc74bd536b8dc6b18aa76ca8236ac81cb861f834e4e6236979006d2c9009296b0f8eb2f7e55a64d426a1f1d8a12d4ee8a9764e704b42b26bdd2018f158daa45ee99886f315f50d7f3b4646d721e07189439d10d635a91e15ae58635407e17eee765d194b4bb845f599ce4664e4a6982fcf28b040eee90beb217bd26fcde1e1fcb59d51573c8cf649e748c1eaf468a8aef87fe4b229cc5f3001b266449654cac1553a7f2ec3688c4b3bf9cca2c9fe87f15000c208aa7542c51889519973ab9277ef99de4498018d8a42407c8b18060c724b0b7c2d63ad481f41b15e99ef69dd6ab5555dbf0540a4ba5d39d955aef63f1818952494fcb3e4281f099e858daabea7ae0eaee47c97d95e06222e7d981be50c14b37e71f0a410cc8a930e4953c261710f6d2ce30807e8474113641f64bd9861b4f847c1b5c8046dcdecab5a71afd74ad3f2f9cec77409c9ea11419ebcebefc6be5dc444ff9d227af6d652d2f6f73eaae0f56b2d047d4391fc3e9e96a297b2d74bb81d8970898210b0a9fd318ce88e4cdee970c7c58ce1d5d9a343630c185087309d65e331f577b0485c31d55202"
 *                           transfer:
 *                             type: object
 *                             description: Transfer details for the transaction
 *                             properties:
 *                               addrs_to:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                                 example:
 *                                   - "Q010500b8601fb018af63f22b31854f649f32249ffd7c2e887d80694b458bd18ee6ca9f9806c016"
 *                               amounts:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                                 example:
 *                                   - "10161000000"
 *                           signer_addr:
 *                             type: string
 *                             example: "Q0105008f07cbf475b718534feb885bb104e3b9597551d33c69cb6b60c86004cb6a01c084fcd2a8"
 *                           transaction_hash1: # Ensure this appears only once per transaction
 *                             type: string
 *                             example: "e8978f1ea1370dc7ce60163bbc23fadbb57cf3d46829ab539aacfe3719a44439"
 *       400:
 *         description: Bad request, block number missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message explaining what went wrong
 *                   example: "Block number is required"
 *       500:
 *         description: Internal server error, indicating an issue with retrieving the block information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Failed to fetch block number"
 */

router.post('/qrl-block-by-number', async (req, res) => {
	try {
		const block = req.body.block;

		if (!block) {
			return res.status(400).json({ success: false, error: 'Block number is required' });
		}

		// Process the block and get the data
		const blockData = await blockByNumber(block);

		res.status(200).json({ success: true, block: blockData });
	}
	catch (error) {
		// Handle any errors
		res.status(500).json({ success: false, error: `Failed to fetch block number ${error.message}` });
	}
});


// qrl OTS index

/**
 * @swagger
 * /v1/qrl-ots:
 *   post:
 *     summary: Retrieve the OTS index for a given QRL address
 *     description: This endpoint returns the OTS (One Time Signature) index for a specified QRL address. The address must be provided in the request body.
 *     tags: [QRL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: The QRL address to retrieve the OTS index for
 *                 example: "Q010300284cc14642e9b2978218f70fcf76274d67d82f3cf7d9038d0e3e43bacfe293773f803931"
 *     responses:
 *       200:
 *         description: Successfully retrieved the OTS index
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                   example: true
 *                 next_unused_ots_index:
 *                   type: number
 *                   description: The OTS index data associated with the provided address
 *                   example: 128
 *       400:
 *         description: Bad request, address missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message explaining the issue
 *                   example: "Address is required"
 *       500:
 *         description: Internal server error, indicating an issue with retrieving the OTS index
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Failed to fetch OTS index"
 */

router.post('/qrl-ots', async (req, res) => {
	try {
		const address = req.body.address;

		if (!address) {
			return res.status(400).json({ success: false, error: 'Address is required' });
		}
		// Process the address and get the OTS index
		const otsInfo = await otsIndex(address);
		res.status(200).json({ success: true, next_unused_ots_index: otsInfo });
	}
	catch (error) {
		// Handle any errors
		res.status(500).json({ success: false, error: `Failed to fetch OTS index ${error.message}` });
	}
});


// qrl is Valid Address

/**
 * @swagger
 * /v1/qrl-is-valid-address:
 *   post:
 *     summary: Validate if a QRL address is valid
 *     description: This endpoint checks if a provided QRL address is valid. The address must be included in the request body.
 *     tags: [QRL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: The QRL address to validate
 *                 example: "Q010300284cc14642e9b2978218f70fcf76274d67d82f3cf7d9038d0e3e43bacfe293773f803931"
 *     responses:
 *       200:
 *         description: Successfully validated the QRL address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                   example: true
 *                 data:
 *                   type: boolean
 *                   description: Indicates whether the address is valid or not
 *                   example: true
 *       400:
 *         description: Bad request, address missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message explaining the issue
 *                   example: "Address is required"
 *       500:
 *         description: Internal server error, indicating an issue with validating the address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Failed to validate address"
 */

router.post('/qrl-is-valid-address', async (req, res) => {
	try {
		const address = req.body.address;

		if (!address) {
			return res.status(400).json({ success: false, error: 'Address is required' });
		}
		// Process the address and get the balance
		const validAddress = await isValidAddress(address);
		res.status(200).json({ success: true, valid: validAddress });
	}
	catch (error) {
		// Handle any errors
		res.status(500).json({ success: false, error: `Failed to fetch IsValidAddress ${error.message}` });
	}
});

// GetTransaction
/**
 * @swagger
 * /v1/qrl-get-transaction:
 *   post:
 *     summary: Retrieve details of a QRL transaction by transaction hash
 *     description: This endpoint retrieves detailed information about a QRL transaction based on the provided transaction hash. The transaction hash must be included in the request body.
 *     tags: [QRL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - txHash
 *             properties:
 *               txHash:
 *                 type: string
 *                 description: The transaction hash of the QRL transaction to retrieve
 *                 example: "81f68f1f24f3377175de002ff6de76df30cb3da2f3dd79070709a0b6afa57be6"
 *     responses:
 *       200:
 *         description: Successfully retrieved the QRL transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: The details of the QRL transaction
 *                   properties:
 *                     tx:
 *                       type: object
 *                       description: Transaction details
 *                       properties:
 *                         master_addr:
 *                           type: string
 *                           description: The address of the master node
 *                           example: "Q010800d1f8900a72abeb583737b8bcd1185e07a54760551173cd15ffe2408048a2df150556cad9"
 *                         fee:
 *                           type: string
 *                           description: The transaction fee in atomic units
 *                           example: "4500000"
 *                         public_key:
 *                           type: string
 *                           description: The public key used to sign the transaction
 *                           example: "01060052b6f8399fb0b822d3106a5d91da974888d5a5f5edd92439a20f9cc961785c3e74a4f9a306..."
 *                         signature:
 *                           type: string
 *                           description: The signature of the transaction
 *                           example: "000002b72b77445c73169ee33137a5806cbcb0f2c3dca83b8e3175af48cf109907151ff646661e40acadd775297519c98969cda7b24a627cc2084157a90dfe555d4220ca6a4a78f40fdea64a36bccfa9880dd6a7163ce742fb4f24162bd4c3612cef9df042852d46aa686552ed2219e9690bc0e36e6b72b8a15655b7a60456f95a7c13768fd41b169ad4199d700b13e27953a7bae4151172ec02faa342a4219e2301d4798e9195076c019cf011a2ebabfbaddad966b40797bf23a09f82cc7f7d961dd04354423eb91b07593cd71431991a51cefadf78a6382671dece56e552fc0d8babf2f12c4e61788de168011f936ff29a4a66f5a931120513eda5ee110204eb61b2031c84da6b412a8ba77115ad583d1b9f9036e19daa5a1a03a970893eb8f40539fc12f2b55ee18f7a0dc937d12233bf9de9c439539016d412d632c3b42ecf4ccac47d3ff896589dbf1568a14d46c62c42dcc63fcf6f328768e35bd496f267a70af49c8b76889bc4c3ee66127ee115a37c5c4795cfe3ed56e9bd3369d40a8a5c81fa504d2b56aa7074216476dcdebca8b79619addbfa9ac81bb7a80eb87709ed6fd071efe2ef6afebf1567cac56968925ac7c2451ab844e7eb418f09f5735841134bb2a5b2e3a5568249af54844ad49878106a1165a65b9905c3106ed3a067806ea2bf22d0c6ebabbcecf470e9408815402b428e77f0b18adf1af65a08e0989a62afcbee7dba19a26ea2b5458516095ac5f10e21ebe51fdcb18e2caf93da6183a526d04604d7ae67299416ad3a45456fab0a05217a1b036a625e3577f8184acaf8b6eaa2fc0ebd940151f6aa66283440a6fb71f61fffa8e738de5477ec714b06f5677972f4253d3478e1595b81b0066995516b479cf4f5a7e756eac3249af5591666c5b885406a07f566ce8104ae7fe99092103e6f6d2f31705cdb2882a1478096b181031ad1173be8d8f4f114c9acc135f30b21112cbfcb9a8b2e2995065ac58d74c279298b404839bec59577f8df4da52f751eee068763d29d2d20a73a22a3e353d8fc08668c0750440821f4978cb1aaea8a2aa06a1677bdf277d041dc7ed9431dab4910b758b866bd09c2b5a87896a5a1e6fc983d7c0bbfabb276696d68de00956696183f352d78bc51d3531f17b8fb89ec544286f56e9d4227cab2abac01ab2847fe300b32693bff7eb73c45a1ecea08a68ee11ad0f303341e47b7e23da61b88fdcd7149cf0962281f5c6583bb1c115e92287dd42863b382ed43de4af2cbe8380741b69dbe804e2af49b8c53aae19a85c05ec3b605575d360d4adbc3b6af5dbcc454a617b6183fb9056281366dd9febcfa970f0897b72ff2db85385bf9433af8b345116278f920c04a0f51110db4ca7200e7dd7fee92bb4fa166a222bc5059c9539d320aa733299f18b25d32dca96bc629815826a39a95aee542da92b71a5cf6ea148139a8b7de9303d49e16382aae43f21f7f5ac6c5a87cb254cf40c82816c30a85b1d6c2655a5ab6aa03d9571b09880bd4d995bb4d07fdd1269adf4932a411b6f10a0593b878c47e4d49197c043f8ec247b5436fff2f6d6f833108a7e43bc473ab1bcb0d3a182fcaab7149e4b4fb6f9a8be52ad89e6581f9e21a46f6f67dafe4cf66209edc53c1a198429c7677aceba34ef012c8440e0af102a4e693b71feef86e5c9ca5f6d4f08029236cc199c3eeac9d9431db96de91ebdb0428dfbff09ba447c844fbbd0e751902d94b7c805b8639f2fa3c2680107b17be5810997674d45709b5bcd77a95b2e9c29fa9c06ba4495598415a8cb70fee087bd16697c36ce465f9e948ed7d0b10b3c95a66a844fe50dafc7357b598257ad5832e5b9e5ce3206d07903a0dbc767a797f8c7e9632d8ead37b03a8689920215c8aff68237b8de024b9f325c53b3e0ad46df307beac50c5de72dc48fd8a0f1b500e79725608f2b51b80c9b082c2306dbc9dbe9bab2dab7db45df64ae57bce4d6a71e19e61eeef9593928b2253591bff4479a2a252b63deb438f193ddf9d677374542e86406bb97a48eed78438a2bff79ff261e5e5fb6ffe7c49eb77cee43f5e0550aabd30be9409af54804671e07c4509cd6965c4d1805d811f34b2b05a8da6cd08657e3e96e8538c02fa1903b79ee99f994ba9d4ef3b095127fd6a15948b99a3aa57727774f0a3fa4a0e161816488af1ca63b1162236ff57be6fc6b476710961fdcd01eeda1562be573f3bc07d63340d19d3402b50c538daba9d3a691a3edd73cdeb773c469c1877edde5aea9b6193dd05174f5d70c1cab8a81cd96aea6364c869ee2debb3b20fd1c864f96c79de46cfdb80237836decd037b666ae8210240f1390ee2b3161de45a5e82f6ca4ff46ab5fdcc6b3b0879d104b5199d029aca32a8cdc677eaf9e0ac18b003b2a7a4c030591a8f1ed7fe66ed1f1e116b2c827c25a1675abab3c859ac5e6fbdc33c7383e8dd3b7fd5390fe6e8b5e5e8d60338b009c63c1d1ad49a48ed6ba0b25af89d4a9533d08c422e1ea92d2c772447a5b332136f08c039b90f69eee0a7c8899cdcd2ccec3b5843c17b0c61641a7e4b9754894378ade6c658a60146c964ec428eb9281453938bec04b5a41d564c9e31bb8605a6f504a251fa290c9739aaadcbdf79628bd6dfa02fc15267db174651624233c0c08765deff4835816451e3454357e9236c70a0a4bc1a42763e8d15d7bd92cb2a59d1745a4c27fddb63dc8d6960870c54ae2a9630ba470ba9f83139a13d2fb75fbac78dcac51471c82b623f75ec24652b353c2142865a10f4ecc0efad0985cba97c3f8bb8edd28077f493ebc5a59e15d908b66ef78d55c6c41c631152e34a03548827f835e36291ee6b28897fda5a7c27a861c3d33ef088ddfa7a4bece8b62feee4a3b2e89fd95c17ae2a32bd7b17f46afbf0fd85595884d221e9c334cdae28d6e875ebe3cb93fff662b98bff04485a8a84cc38be3c59efb0bef3e1bd85ec154035f5522f1821335900da4d681a8ee19df35f793384868afde0948857a52e17fefec5f6040b2c22cf8704665fc0286ace751e7832a8372424a648e842cb6238abf7660f0becd6dac237807cb72f008d4f45cb74677a90c14805929eb91cc032771707d94db88256f9d93d675126eeea23513b1fed5dc1877a341136ccc2fb8108d299f63d6b162863144d6feade440b9e17957446194ee01994b2946aedd3cafce828ff49f9f3555c7ff2ad38ba5b5996bc3e76be8e944e3fffb4b0b198ec29a8548c51d35a825f35ee372f32f51a006efc9c5e3703f284dc2690c67d46f60e43f3446f304f3cdb77a794f9667e7a4d747d7c2a36093dadd49442a17964009fe7a6a5286bf926957c46e209dabd7ba9e75aede7e75454bd43df0bdc5a03c080c9b90dc353bf364488d89aa08385cbddce7823ed27c533161bcd1aa1ab165eb2bf75def7da671b9526204634e32b4b71b752ea0584dbbf83b8705a1c7d92be25cdc798e6ee82197df670f2666a1ceaa92d859f0e7c95b44148a9ca68668633e6730ebaabc3831e97e4f7e4db06dc1a38a17bfdec977f2059d8d4dc805d9abfaefe4af61b99e3926db3f66c08ef8ff46245c02c5af2a3c2c9056cff4d6cd10337daef138d72a852d8daf0"
 *                         nonce:
 *                           type: string
 *                           description: The nonce value for the transaction
 *                           example: "696"
 *                         transaction_hash:
 *                           type: string
 *                           description: The hash of the transaction
 *                           example: "81f68f1f24f3377175de002ff6de76df30cb3da2f3dd79070709a0b6afa57be6"
 *                         signer_addr:
 *                           type: string
 *                           description: The address of the signer
 *                           example: "Q010600c3bd69e83534bf9b1cd0cf55d01ee6c9a60aadc1adf9077ad90d685689cf15a38a81e05b"
 *                         transfer:
 *                           type: object
 *                           description: Transfer details of the transaction
 *                           properties:
 *                             addrs_to:
 *                               type: array
 *                               description: The addresses that received funds
 *                               items:
 *                                 type: string
 *                               example:
 *                                 - "Q0105003c368cb2d481fae0e025e3725e7c458b40cc3a403469e8eb9398a10528a720e8f5918ddb"
 *
 */

router.post('/qrl-get-transaction', async (req, res) => {
	try {
		const txHash = req.body.txHash;
		if (!txHash) {
			return res.status(400).json({ success: false, error: 'TX Hash is required' });
		}

		// Process the txHash and get the balance
		const transactionResult = await getTransaction(txHash);
		res.status(200).json({ success: true, data: transactionResult });
	}
	catch (error) {
		// Handle any errors
		res.status(500).json({ success: false, error: `Failed to fetch GetTransaction ${error.message}` });
	}
});


// AddNewAddressWithSlaves

/**
 * @swagger
 * /v1/qrl-add-addresses-with-slave:
 *   post:
 *     summary: Basic example POST endpoint
 *     description: A minimal Swagger configuration for a POST request.
 *     tags: [QRL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height:
 *                 type: string
 *                 description: wallet tree height
 *                 example: "10"
 *               number_of_slaves:
 *                 type: string
 *                 description: Number of slaves to be generated
 *                 example: "3"
 *               hash_function:
 *                 type: string
 *                 description: Hash function to use {shake128, shake256, sha2_256}
 *                 example: "shake128"
 *     responses:
 *       200:
 *         description: Successful POST response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
*/


/*
pings on a different port from the main functions {THIS DID NOT WORK, STILL BOTTLENECK AT THE DAEMON}
qrlPubSlavesAPI
{
  "success": true,
  "address": "Q01050012bb067a12b7b1eaeba4c2b68d1e0776f6b6aeb8b697f635768781e35342c99a1fdeb6b8"
}
*/
router.post('/qrl-add-addresses-with-slave', async (req, res) => {
	try {
		console.log('AddNewAddress called');
		// either use the values provided or what we have in the configuration file
		const qrlWalletHeight = req.body.height ? req.body.height : config.qrl_wallet_height;
		const qrlWalletNumberOfSlaves = req.body.number_of_slaves ? req.body.number_of_slaves : config.qrl_wallet_number_of_slaves;
		const qrlWalletHashFunction = req.body.hash_function ? req.body.hash_function : config.qrl_wallet_hash_function;
		console.log(`values: ${qrlWalletHeight} ${qrlWalletNumberOfSlaves} ${qrlWalletHashFunction}`);
		if (!qrlWalletHeight || !qrlWalletNumberOfSlaves || !qrlWalletHashFunction) {
			return res.status(400).json({
				success: false,
				error: 'Valid wallet details are required: {height, number_of_slaves, hash_function}',
			});
		}

		// Process the address addition and return the pubkey
		const addAddressResponse = await addAddressesWithSlave(qrlWalletHeight, qrlWalletNumberOfSlaves, qrlWalletHashFunction);

		res.status(200).json({ success: true, address: addAddressResponse });
	}
	catch (error) {
		// Handle any errors
		res.status(500).json({ success: false, error: `Failed to add a new address: ${error.message}` });
	}
});


// GetRecoverySeeds
// GetWalletInfo
// GetTotalBalance
// RelayTransferTxnBySlave
// RelayMessageTxnBySlave
// RelayTokenTxnBySlave
// RelayTransferTokenTxnBySlave
// GetTransactionsByAddress
// GetNodeInfo

module.exports = router;
