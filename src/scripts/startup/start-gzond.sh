#! /bin/bash

/home/fr1t2/.local/bin/gzond \
	--nat=extip:0.0.0.0 \
	--betanet \
	--http \
	--http.api "web3,net,personal,zond,engine,debug" \
	--datadir=/home/fr1t2/ZOND/gzond/gzonddata \
	--syncmode=full \
	--snapshot=false \
	--gcmode=archive \
	--keystore=/home/fr1t2/ZOND/keystore \
	--history.state=0 \
	--allow-insecure-unlock \
	--unlock="0x20d20b8026b8f02540246f58120ddaaf35aecd9b" \
	--password=/home/fr1t2/ZOND/keystore/password.txt
#	--signer=/home/fr1t2/ZOND/clef/clef.ipc
