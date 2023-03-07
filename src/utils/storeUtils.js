require('dotenv').config();
const fs = require('fs');

const buildDir = "./src/abi/";

const writeDir = "./src/store/modules/abisMethods/"
const addressDir = "./src/utils/"
if (!fs.existsSync(buildDir)) {
    throw new Error('ABI buildDir not exists');
}
if (!fs.existsSync(writeDir)) {
    throw new Error('ABI abisDirMap not exists');
}
if (!fs.existsSync(addressDir)) {
    throw new Error('ABI addressDir not exists');
}
const files = fs.readdirSync(buildDir);

console.log("所有合约数量：", files.length)
//创建index.js 导出所有合约
let indexStr = ``, exportStr = `export default { `;
//处理所有合约
let addressObj = {}
console.log(files.length )
for (let i = files.length - 1; i >= 0; i--) {
    // 获取合约 name 、 abi
    let contract = JSON.parse(fs.readFileSync(buildDir + files[i]), 'utf8');
    let name = contract.contractName;
    let abi = contract.abi;

    let tempFileStr = `
		import getContract from "@/utils/abiUtil";
		function judgeToken(rootState) {
			if (!state.token) state.token = getContract.getContractByName('${name}', rootState.web3)
		}
		const state = {};
		const mutations = {};
	`
    let actions = `const actions = { \n`;
    if(!contract.networks[1234]){continue}
    console.log("生成" + name+ ".js")


    console.log(contract.contractName,contract.networks[1234].address)
    addressObj[contract.contractName.toString()] = contract.networks[1234].address.toString()


    indexStr += `import ${name} from "@/store/modules/abisMethods/${name}";`
    exportStr += `${name},`
    for (let j = 0; j < abi.length; j++) {
        let functionObj = abi[j];

        if(functionObj.type == "function" &&functionObj.stateMutability == "view"){
            let params = functionObj.inputs;
            let tempParamStr = ``
            let reciveParamStr = ""
            if(params.length>1) {
                reciveParamStr+="{"
            }
            for (let k = 0; k < params.length; k++) {
                if(params[k].name.length>0){
                    tempParamStr += params[k].name + ","
                }else{
                    tempParamStr +=  "param" + k + ","
                }
            }
            tempParamStr = tempParamStr.substr(0,tempParamStr.length-1)
            reciveParamStr += tempParamStr
            if(params.length>1) {
                reciveParamStr+="}"
            }

            actions += `${functionObj.name} ({rootState}${params.length>0?',':''} ${reciveParamStr}){
					judgeToken(rootState)
					return new Promise((resolve,reject) => {
						state.token.methods.${functionObj.name}(${tempParamStr}).call().then(res => {
						resolve(res)
					}).catch(err=>{
                        reject(JSON.parse(err.message.substr(24,err.message.length)).message)
                    })
				})
			},\n`

        }
        if(functionObj.type == "function" &&functionObj.stateMutability == "nonpayable"){
            let params = functionObj.inputs;
            let tempParamStr = ``
            let reciveParamStr = ""
            if(params.length>1) {
                reciveParamStr+="{"
            }
            for (let k = 0; k < params.length; k++) {
                if(params[k].name.length>0){
                    tempParamStr += params[k].name + ","
                }else{
                    tempParamStr +=  "param" + k + ","
                }
            }

            tempParamStr = tempParamStr.substr(0,tempParamStr.length-1)
            reciveParamStr += tempParamStr
            if(params.length>1) {
                reciveParamStr+="}"
            }

            actions += `${functionObj.name} ({rootState}${params.length>0?',':''} ${reciveParamStr}){
                        judgeToken(rootState)
                        return new Promise((resolve,reject) => {
                            state.token.methods.${functionObj.name}(${tempParamStr}).estimateGas({
                            from: rootState.account,
                        }).then(gas => {
                            state.token.methods.${functionObj.name}(${tempParamStr}).send({
                                from: rootState.account,
                                gas: parseInt(gas * 1.2)
                            }).then(res => {
                                 let operateLogs = localStorage.getItem("operateLogs")?JSON.parse(localStorage.getItem("operateLogs")):[]
                                 operateLogs.push({
                                    name:"${functionObj.name}",
                                    from:res.from,
                                    to:res.to,
                                    gasUsed:res.gasUsed,
                                    blockHash: res.blockHash
                                 })
                                 if(operateLogs.length>20){
                                    operateLogs.shift()
                                 }
                                 localStorage.setItem("operateLogs", JSON.stringify(operateLogs))
                                 resolve(res)
                            })
                        }).catch(err=>{
                            reject(JSON.parse(err.message.substr(24,err.message.length)).message)
                        })
				})
			},\n`

        }
        if(functionObj.type == "function" &&functionObj.stateMutability == "payable"){
            let params = functionObj.inputs;
            let tempParamStr = ``
            let reciveParamStr = ""
            if(params.length>1) {
                reciveParamStr+="{"
            }
            for (let k = 0; k < params.length; k++) {
                tempParamStr += params[k].name + ","
            }
            tempParamStr = tempParamStr.substr(0,tempParamStr.length-1)
            reciveParamStr += tempParamStr
            if(params.length>1) {
                reciveParamStr+="}"
            }
            actions += `${functionObj.name} ({rootState}, value ${params.length>0?',':''} ${reciveParamStr}){
                        judgeToken(rootState)
                        return new Promise((resolve,reject) => {
                            state.token.methods.${functionObj.name}(${tempParamStr}).estimateGas({
                            from: rootState.account,
                        }).then(gas => {
                            state.token.methods.${functionObj.name}(${tempParamStr}).send({
                                from: rootState.account,
                                gas: parseInt(gas * 1.2),
                                value: rootState.web3.utils.toWei(value)
                            }).then(res => {
                              let operateLogs = localStorage.getItem("operateLogs")?JSON.parse(localStorage.getItem("operateLogs")):[]
                              operateLogs.push({
                                name:"${functionObj.name}",
                                from:res.from,
                                to:res.to,
                                gasUsed:res.gasUsed,
                                blockHash: res.blockHash
                              })
                              if(operateLogs.length>20){
                                operateLogs.shift()
                              }
                              localStorage.setItem("operateLogs", JSON.stringify(operateLogs))
                              resolve(res)
                            })
                        }).catch(err=>{
                            reject(JSON.parse(err.message.substr(24,err.message.length)).message)
                        })
				    })
			},\n`

        }
    }
    actions += `}`
    tempFileStr += actions
    tempFileStr += `
			export default {
			namespaced: true,
			mutations,
			state,
			actions
		}
	`
    fs.writeFileSync(`${writeDir}${name}.js`, tempFileStr, 'utf8');
}
exportStr += `}`
indexStr += exportStr
fs.writeFileSync(`${writeDir}index.js`, indexStr, 'utf8');
fs.writeFileSync(`${addressDir}address.json`, JSON.stringify(addressObj), 'utf8');
console.log("All generated vue store")
