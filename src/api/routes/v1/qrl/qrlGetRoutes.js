require('module-alias/register');
const express = require('express');
// Import QRL API functions here

const { height } = require('@qrl-chain/heightLookup');
const { listAddresses } = require('@qrl-chain/listAddressesLookup');
const router = express.Router();

/*
QRL GET endpoints

- /qrl-height
- /qrl-list-addresses

*/


/**
 * @swagger
 * /v1/qrl-height:
 *   get:
 *     summary: Retrieve the current block height of the QRL blockchain
 *     description: This endpoint returns the latest block height from the QRL blockchain, representing the most recent block added to the chain.
 *     tags: [QRL]
 *     responses:
 *       200:
 *         description: Successfully retrieved the current QRL block height
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                   example: true
 *                 height:
 *                   type: number
 *                   description: The current QRL block height
 *                   example: 3278560
 *       400:
 *         description: Invalid request, possibly due to missing or malformed parameters
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
 *                   description: Detailed error message explaining what went wrong
 *                   example: "Bad Request: Missing block parameter"
 *       500:
 *         description: Internal server error, indicating an issue with fetching the block height
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
 *                   description: Detailed error message explaining the server-side issue
 *                   example: "Failed to fetch QRL block height due to server error"
 */
router.get('/qrl-height', async (req, res) => {
	try {
		// fetch the current block height
		const currentBlock = await height();
		res.status(200).json({ success: true, height: currentBlock });
	}
	catch (error) {
		// Handle any errors
		console.error('Error in fetching height:', error);
		res.status(500).json({ success: false, error: 'Failed to fetch QRL height' });
	}
});


/**
 * @swagger
 * /v1/qrl-list-addresses:
 *   get:
 *     summary: Basic example GET endpoint
 *     description: A minimal Swagger configuration for a GET request.
 *     tags: [QRL]
 *     parameters:
 *       - name: param1
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: A simple string query parameter
 *         example: "example_value"
 *     responses:
 *       200:
 *         description: Successful GET response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */

router.get('/qrl-list-addresses', async (req, res) => {
	try {
		// fetch the current block height
		const addyList = await listAddresses();
		res.status(200).json({ success: true, addresses: addyList });
	}
	catch (error) {
		// Handle any errors
		console.error('Error in fetching height:', error);
		res.status(500).json({ success: false, error: 'Failed to fetch QRL height' });
	}
});


module.exports = router;
