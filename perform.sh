COUNTER=0
 
while [  $COUNTER -lt 160 ]; do
	node perform.js 20 $COUNTER &
	let COUNTER=COUNTER+20
	sleep 15
done
