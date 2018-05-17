String.prototype.hexEncode = function(){
    var hex, i;
    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    return result
}
String.prototype.hexDecode = function(){
  var j;
  var hexes = this.match(/.{1,4}/g) || [];
  var back = "";
  for(j = 0; j<hexes.length; j++) {
      back += String.fromCharCode(parseInt(hexes[j], 16));
  }

  return back;
}

var fetch = require('node-fetch');
var crypto = require('crypto');
var bip39 = require('bip39');
var sha256 = require('sha256');

var token = null
var key = null
var user = null

callAPI('login', 'POST', { emailAddress: 'test@test.com', password: '123123123' }, loginReturned)
//callAPI('register', 'POST', { username: 'test', emailAddress: 'test@test.com', password: '123123123' }, logData)

//callAPI('forgotPassword', 'POST', { emailAddress: 'test@test.com' }, logData)
//callAPI('resetPassword', 'POST', { password: '123123123' }, logData)



function callAPIFunctions() {
  /*callAPI('createContract', 'POST', {
    transactionHash:'0x12ac77978860806874b718b437c9e026fa199890d724d65f23c451fb596a59b2',
    ensName:'My Friendly Name',
    payerAddress:'0xb258aD4125e84068F3A47fbBC4F6aCeD2bC148EC',
    payeeAddress:'0xb258aD4125e84068F3A47fbBC4F6aCeD2bC148EC',
    type:'Interval',
    paymentInterval:2,
    paymentAmount:0.05
  }, logData)
  callAPI('setContractAddress', 'POST', { contractUuid: '1d46b81e-c434-4c97-8b97-ebe4245993e2', contractAddress: '0x7822a633d497a6610f536580d4437766bebde4fd' }, logData)
  callAPI('getContracts', 'POST', { userUuid: user.uuid }, logData)
  callAPI('getContract', 'POST', { contractUuid: '1d46b81e-c434-4c97-8b97-ebe4245993e2' }, logData)
  */
  /*
  callAPI('getContractActions', 'POST', { contractUuid: '1d46b81e-c434-4c97-8b97-ebe4245993e2' }, logData)
  callAPI('createContractAction', 'POST', {
    contractUuid: '1d46b81e-c434-4c97-8b97-ebe4245993e2',
    type: 'Deposit Funds',
    transactionHash: '0x92ba394c37a7384029a53836ee905cf31a5fb2fffa39e992293aa47bd5cf0d46',
    actionData: {
      payerAddress: '0xb258aD4125e84068F3A47fbBC4F6aCeD2bC148EC',
      paymentAmount: 0.02
    }
  }, logData)
  callAPI('createContractAction', 'POST', {
    contractUuid: '1d46b81e-c434-4c97-8b97-ebe4245993e2',
    type: 'Start Contract',
    transactionHash: '0x3eee9464eb302f7f1529a670b701d74a85051b3bc4d7fa32ce287c0b522d5c22',
    actionData: {
      requestAddress: '0xb258aD4125e84068F3A47fbBC4F6aCeD2bC148EC'
    }
  }, logData)
  */
  callAPI('setContractActionMined', 'POST', { contractActionUuid: '1d376544-0802-42e5-9f55-fc6666f42489'  }, logData)
}

function loginReturned(url, error, data) {
  if (error) {
    console.log("---------------------------\n"+url+"\n----------------------------\nERROR\n"+error)
  } else {
    console.log("----------------------------\n"+url+"\n----------------------------\nSUCCESS\n")
  }

  if (data.success) {
    var decodedObj = decodeMessage(data.message)
    console.log(JSON.stringify(decodedObj, null, 2))

    user = decodedObj.user;
    token = decodedObj.token.token;
    key = sha256(user.email_address);

    callAPIFunctions()
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}

function logData(url, error, data) {
  if (error) {
    console.log("\n\n----------------------------\n"+url+"\n----------------------------\nERROR\n"+error)
  } else {
    console.log("\n\n----------------------------\n"+url+"\n----------------------------\nSUCCESS\n")
  }

  if(data.success) {
    var decodedObj = decodeMessage(data.message)

    console.log(JSON.stringify(decodedObj, null, 2))
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}

function callAPI(url, method, postData, callback){
  let apiUrl = 'http://localhost:8081/api/v1/';
  var call = apiUrl+url

  if(method == 'GET') {
    postData = null
  } else {
    const signJson = JSON.stringify(postData);
    const signMnemonic = bip39.generateMnemonic();
    const cipher = crypto.createCipher('aes-256-cbc', signMnemonic);
    const signEncrypted = cipher.update(signJson, 'utf8', 'base64') + cipher.final('base64');
    var signData = {
      e: signEncrypted.hexEncode(),
      m: signMnemonic.hexEncode(),
      u: sha256(url).toUpperCase(),
      p: sha256(sha256(url).toUpperCase()).toUpperCase(),
      t: new Date().getTime(),
    }
    const signSeed = JSON.stringify(signData)
    const signSignature = sha256(signSeed)
    signData.s = signSignature
    postData = JSON.stringify(signData)
  }

  fetch(call, {
      method: method,
      body: postData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic NDk5MUQ1OTJFN0ZFQTE1MDkyQ0IwNjhFQkZCREVFQzczNzNBMTk0NEU1MTA3QTFERDE5MUMzMTBENkY5MDRBMDowRkYxNUI0NDMxQjI0RkE0M0U5RTYwODIxMERGNEU0QTVBNjBCQ0MzMTUzREIzMTlEMTU1MUE4RjEzQ0ZEMkUx',
        'x-access-token': token,
        'x-key': key
      },
  })
  .then(res => res.json())
  .then((res) => {
    return callback(url, null, res)
  })
  .catch((error) => {
    return callback(url, error, null)
  });
}

function decodeMessage(message) {
  const mnemonic = message.m.hexDecode()
  const encrypted = message.e.hexDecode()
  const time = message.t
  const signature = message.s

  const sig = {
    e: message.e,
    m: message.m,
    u: message.u,
    p: message.p,
    t: message.t
  }
  const seed = JSON.stringify(sig)
  const compareSignature = sha256(seed)

  if (compareSignature !== signature) {
    return null
  }

  const payload = decrypt(encrypted, mnemonic)
  var data = null
  try {
    data = JSON.parse(payload)
  } catch (ex) {
    return null
  }

  return data;
}

function decrypt(text,seed){
  var decipher = crypto.createDecipher('aes-256-cbc', seed)
  var dec = decipher.update(text,'base64','utf8')
  dec += decipher.final('utf8');
  return dec;
}
