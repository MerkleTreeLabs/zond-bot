#!/bin/bash

## This script is not in use if this text is present...
## awaiting the integration of dilithuium into the clef system upstream

source /home/fr1t2/ZOND/clef/secrets.sh

echo $MasterseedPW | /home/fr1t2/.local/bin/clef \
	--chainid 1 \
	--keystore /home/fr1t2/ZOND/keystore/ \
	--configdir /home/fr1t2/ZOND/clef/ \
	--rules /home/fr1t2/ZOND/clef/rules.js  \
	--loglevel 6 \
	--auditlog /home/fr1t2/ZOND/clef/audit.log \
	--http \
        --suppress-bootwarn
#	--signersecret /home/fr1t2/ZOND/clef/signer.txt \
#	--stdio-ui true\
