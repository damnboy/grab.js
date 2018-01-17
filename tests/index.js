//https://medium.com/@dalaidunc/fs-readfile-vs-streams-to-read-text-files-in-node-js-5dd0710c80ea
//10m以上文件考虑流式解析 
var fs = require('fs');
function loadParser(protocol){
    return new Promise(function(resolve, reject){
        fs.readFile('./nmap/probes/ssh', function(err, data){
            if(err){
                reject(err)
            }
            else{
                resolve(data.toString('utf-8').split('\n'))
            }
        })
    })
}

loadParser('ssh')
.then(function(pattenStrings){
    var patterns = pattenStrings.reduce(function(results, string){
        if(string.length > 0){
            results.push(JSON.parse(string))
        }
        return results
    },[]);

    const grabber = require('../lib')
    grabber.grab('127.0.0.1', 22)
    .run()
    .then(result => { 
        var data = result.banner.toString('utf-8');
        patterns.forEach(function(pattern){
            var reg = new RegExp(pattern.pattern);
            var o =  reg.exec(data)
            if(o){
                console.log(pattern);
                console.log(o);
            }
            
        })
        /* process the result */ 
        console.log(result)
        })
    .catch(err => { /* error handling */ 
    })
})
.catch(function(err){
    console.log(err)
})


