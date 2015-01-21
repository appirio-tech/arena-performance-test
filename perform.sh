COUNTER=0
 
while [  $COUNTER -lt 200 ]; do
	node perform.js 10 $COUNTER &
	let COUNTER=COUNTER+10
done
