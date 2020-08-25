// Nicholas Farrow 2020
// nickfarrow.com
// Minimum send defined by protocol
// https://bitcoinmagazine.com/articles/bitcoin-developers-adding-0-007-minimum-transaction-output-size-1367825159
const minSend = 0.0000543
const satoshi = 0.00000001

// Overview
//
// Message of words: Thanks for the great content
// convert to camel case: Thanks For The Great Content
// Group words into addresses [x chars per address]
// [Thanks For, The Great. Content]
// remove spaces: [ThanksFor, TheGreat, Content]
// Loop through each phrase:
//    '1' + ThanksFor + '77777777777777'  ( or another padding char )
//    Convert this base58 back into bytes
//    Recalculate the checksum from the first 21 bytes, overwrite the last 4 bytes.
//    Convert back into base58
// Print each "Address, amount" where amount is the minimum required for the tx
// Print the "RecipientAddress, SendAmount" where Sent Amount is chosen by the user
// Print the vanity address bc1JustReadAll6666qdqwdgd1eic with an optional donation amount
// This could also be printed at the top





///////////////////////////////////////////////////////////////////// Utils

// https://gist.github.com/diafygi/90a3e80ca1c2793220e5/#file-annotated-js-L1
var to_b58 = function(
    B            //Uint8Array raw byte input
) {
    var A = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    var d = [],   //the array for storing the stream of base58 digits
        s = "",   //the result string variable that will be returned
        i,        //the iterator variable for the byte input
        j,        //the iterator variable for the base58 digit array (d)
        c,        //the carry amount variable that is used to overflow from the current base58 digit to the next base58 digit
        n;        //a temporary placeholder variable for the current base58 digit
    for(i in B) { //loop through each byte in the input stream
        j = 0,                           //reset the base58 digit iterator
        c = B[i];                        //set the initial carry amount equal to the current byte amount
        s += c || s.length ^ i ? "" : 1; //prepend the result string with a "1" (0 in base58) if the byte stream is zero and non-zero bytes haven't been seen yet (to ensure correct decode length)
        while(j in d || c) {             //start looping through the digits until there are no more digits and no carry amount
            n = d[j];                    //set the placeholder for the current base58 digit
            n = n ? n * 256 + c : c;     //shift the current base58 one byte and add the carry amount (or just add the carry amount if this is a new digit)
            c = n / 58 | 0;              //find the new carry amount (floored integer of current digit divided by 58)
            d[j] = n % 58;               //reset the current base58 digit to the remainder (the carry amount will pass on the overflow)
            j++                          //iterate to the next base58 digit
        }
    }
    while(j--)        //since the base58 digits are backwards, loop through them in reverse order
        s += A[d[j]]; //lookup the character associated with each base58 digit
    return s          //return the final base58 string
}


var from_b58 = function(
    S            //Base58 encoded string input
  ) { // nwf
    var A = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    var d = [],   //the array for storing the stream of decoded bytes
        b = [],   //the result byte array that will be returned
        i,        //the iterator variable for the base58 string
        j,        //the iterator variable for the byte array (d)
        c,        //the carry amount variable that is used to overflow from the current byte to the next byte
        n;        //a temporary placeholder variable for the current byte
    for(i in S) { //loop through each base58 character in the input string
        j = 0,                             //reset the byte iterator
        c = A.indexOf( S[i] );             //set the initial carry amount equal to the current base58 digit
        if(c < 0)                          //see if the base58 digit lookup is invalid (-1)
            return undefined;              //if invalid base58 digit, bail out and return undefined
        c || b.length ^ i ? i : b.push(0); //prepend the result array with a zero if the base58 digit is zero and non-zero characters haven't been seen yet (to ensure correct decode length)
        while(j in d || c) {               //start looping through the bytes until there are no more bytes and no carry amount
            n = d[j];                      //set the placeholder for the current byte
            n = n ? n * 58 + c : c;        //shift the current byte 58 units and add the carry amount (or just add the carry amount if this is a new byte)
            c = n >> 8;                    //find the new carry amount (1-byte shift of current byte value)
            d[j] = n % 256;                //reset the current byte to the remainder (the carry amount will pass on the overflow)
            j++                            //iterate to the next byte
        }
    }
    while(j--)               //since the byte array is backwards, loop through it in reverse order
        b.push( d[j] );      //append each byte to the result
    return new Uint8Array(b) //return the final byte array in Uint8Array format
}


function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

const fromHexString = hexString =>
  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return word.toUpperCase()
  // }).replace(/\s+/g, '');
  });
}

// https://github.com/bitwiseshiftleft/sjcl/blob/master/core/codecBytes.js#L23-L36
function toBits(bytes) {
  var out = [], i, tmp=0;
  for (i=0; i<bytes.length; i++) {
    tmp = tmp << 8 | bytes[i];
    if ((i&3) === 3) {
      out.push(tmp);
      tmp = 0;
    }
  }
  if (i&3) {
    out.push(sjcl.bitArray.partial(8*(i&3), tmp));
  }
  return out;
}

function fromBits(arr) {
    var out = [], bl = sjcl.bitArray.bitLength(arr), i, tmp;
    for (i=0; i<bl/8; i++) {
      if ((i&3) === 0) {
        tmp = arr[i/4];
      }
      out.push(tmp >>> 24);
      tmp <<= 8;
    }
    return out;
}










function cleanInput(message) {
  console.log("\n\nCleaning input:")
  console.log(message);
  message = camelize(message);

  message = message.split("\n").join(" ");
  message = message.split("0").join("o");
  message = message.split("I").join("i");
  message = message.split("O").join("o");
  message = message.split("l").join("L");
  console.log(message);

  console.log("Clean input:");
  console.log(message);
  return message;
}


function groupWords(message, maxLen) {
  var words = message.split(" ");

  var groupedWordsList = [""];
  var groupedWords = [];
  var groupIndex = 0;

  console.log("\n Grouping Words:");
  console.log(words);
  for (i=0; i<words.length; i++) {
    var word = words[i];
    console.log(groupedWordsList);

    if (groupedWordsList[groupIndex].length + word.length > maxLen) {
      groupedWordsList.push(word);
      groupIndex = groupIndex + 1;
    }
    else {
      groupedWordsList[groupIndex] = groupedWordsList[groupIndex] + word;
    }
    console.log(groupedWordsList);
  }
  console.log(groupedWordsList);
  return groupedWordsList;
}


function recalcChecksum(address) {
  // console.log(toHexString(address.slice(0, 21)));
  const payload = toBits(address.slice(0, 21));
  // console.log(payload);

  // Calculate checksum
  const bitArray = sjcl.hash.sha256.hash(sjcl.hash.sha256.hash(payload));
  // console.log(bitArray)

  // const hash = sjcl.codec.hex.fromBits(bitArray);
  const hash = fromBits(bitArray);
  // console.log(toHexString(hash));

  const hexCheckSum = toHexString(hash.slice(0, 4))
  // console.log(hexCheckSum);

  // console.log(toHexString(address.slice(0, 21)) + hexCheckSum);
  return toHexString(address.slice(0, 21)) + hexCheckSum;
}

function convertToAddress(phrase, paddingChar) {
  var trueLen = 33;
  address = "1" + phrase + paddingChar.repeat(trueLen - phrase.length - 1);

  var addressBytes = from_b58(address);

  addressBytes = recalcChecksum(addressBytes);
  var newAddress = fromHexString(addressBytes);
  console.log(to_b58(newAddress));

  var convertedPhrase = to_b58(newAddress);

  console.log(convertedPhrase)
  return convertedPhrase;
}


function parseMessage(message) {
  var messageStr = message;
  var groupedWords = groupWords(cleanInput(messageStr), document.getElementById("phraseLength").value);

  var addresses = [];
  for (i=0; i<groupedWords.length; i++) {
    addresses.push([convertToAddress(groupedWords[i], document.getElementById("paddingCharacter").value), minSend + (1+i)*satoshi]);
  }

  // return addresses.join(", " + sendAmount + "\n") + ", " + sendAmount;
  return addresses
}




//////////////////////


function main() {
  var recipient = document.getElementById("recipient").value;
  var coreOutputs = parseMessage(document.getElementById("messageInput").value);
  var additionalSend = parseFloat(document.getElementById("additionalSend").value);
  var donationAddress = "1BTCmsgNzdcttzGLrcwz3BSNEtZdsfJ1E8";

  var outputs = [];

  if ($('#donateHeader').prop('checked')) {
    // var donationAmount = document.getElementById("donationSliderValue").value;
    outputs.push([donationAddress, minSend]);
  }
  else {
    var donationAmount = 0;
  }

  outputs = outputs.concat(coreOutputs)

  // if (recipient != "" && coreOutputs != "") {
  if (recipient != "") {
    // var outputs = outputs + coreOutputs  + "</br>"
    //   + recipient + ", " + additionalSend + "</br>";

    var minAdditionalSend = minSend + (outputs.length * satoshi);
    if (additionalSend < minAdditionalSend) {
      additionalSend = minAdditionalSend;
    }

    outputs.push([recipient, additionalSend]);

    var totalAmount = 0;
    var printText = "";
    for (i=0; i<outputs.length; i++) {
      console.log(outputs[i]);
      totalAmount = totalAmount + outputs[i][1];
      var strNum = outputs[i][1].toFixed(8);
      printText = printText + outputs[i][0] + ", " + strNum + "\n";
      console.log(printText);
      console.log(totalAmount);
    }
  }
  else {
    printText = "Please enter a recipient address.";
    totalAmount = 0;
  }


  // var totalAmount = parseFloat(additionalSend) + coreOutputs.split("\n").length * minSend + parseFloat(donationAmount);

  document.getElementById('outputs').innerHTML = printText;
  document.getElementById('totalAmount').innerHTML = totalAmount;
    // parseMessage(document.getElementById("messageInput").value);
    // parseMessage("1SendNickBitcoin111111111111111111");
}



function updateTextInput(val) {
          document.getElementById('donationLabel').innerHTML="Included donation to site: " + val + " BTC";
}


$('#masterFormID').on('input propertychange', function () {
// $('#messageInput').on('input propertychange', function () {
  main();
});


function copy() {
  let textarea = document.getElementById("outputs");
  textarea.select();
  document.execCommand("copy");
}

$(function () {
    $("#headerToggle input[type='radio']").click(function () {
        if ($('#donateHeader').prop('checked')) {
          $("#donationSlider").show();
        } else {
          $("#donationSlider").hide();
        }
    });
});
