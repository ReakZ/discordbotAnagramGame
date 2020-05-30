function randomNumber(min,max){
    return Math.floor(Math.random()*(max-min+1)+min)
}

function RandChar(str){
    let massiv= str.split("")
    let result=[]
    for(let a=0;a<massiv.length;a++){
        let i=randomNumber(0,massiv.length)
        while(result[i]!==undefined){
            i=randomNumber(0,massiv.length)
        }
        result[i]=massiv[a]
    }
    return result
}
function compare(a, b) {
    if (a.score < b.score) {
      return 1;
    }
    if (a.score > b.score) {
      return -1;
    }
    
    return 0;
  }

module.exports.randomNumber=randomNumber
module.exports.RandChar=RandChar
module.exports.compare=compare