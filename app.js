const http = require('http');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const { ifError } = require('assert');
const sql = require('sqlite3').verbose();
const exec = require('child_process').exec;
var crypto = require('crypto');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

var host = '0.0.0.0';
var port = 80;

const packageDB = new sql.Database(__dirname+'/databases/content.sqlite');
const usersDB = new sql.Database(__dirname+'/databases/users.sqlite');

var connectedUser = {content : []}
var cartUser = {}

const requestListener = (req, res)=>{
    file = url.parse(req.url).pathname;
    if(file != '/ajax'){
        if(file == '/'){file='/html/index.html';}
        else{file = '/html'+file;}
        fs.readFile(__dirname+file, '', (err,content)=>{
            if (err){
                res.writeHead(404, {'Content-Type': 'text/html'});
                return res.end("404 Not Found");
            }else{
                res.writeHead(200);
                res.end(content);
            }
        });
    }else{
        data = qs.parse(url.parse(req.url).query);
        action = data['action'];   
        switch(action){
            case 'getElementsRandom':
                request = 'select * from packages natural join cssCode natural join jsCode natural join htmlCode order by random() limit 10;';
                packageDB.all(request,(err,rows)=>{
                    if(err){
                        res.writeHead(500, {'Content-Type': 'text/html'});
                        return res.end("500 Internal Server Error");
                    }else{
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify(rows));
                    }
                });
            break;
            case 'getCodeById':
                request = 'select * from packages natural join cssCode natural join jsCode natural join htmlCode where id = '+data['id']+';';
                packageDB.all(request,(err,rows)=>{
                    if(err){
                        res.writeHead(500, {'Content-Type': 'text/html'});
                        return res.end("500 Internal Server Error");
                    }else{
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify(rows));
                    }
                });
            break;
            case 'login':
                email = data['username'];
                password = data['password'];
                password = crypto.createHash('sha256').update(password).digest('base64');
                request = `select hash from informations where email='${email}';`;
                usersDB.all(request,(err,rows)=>{
                    if(err){throw err}
                    else{
                        if(rows[0] != undefined){
                            if (rows[0]['hash'] == password){
                                key = makeid(25);
                                userLogin = connectedUser['content'].find(dat => dat.email == email);
                                if(userLogin == undefined){connectedUser['content'].push({email:email,key:key});}
                                else{connectedUser['content'][connectedUser['content'].indexOf(userLogin)]['key'] = key;}
                                res.end(JSON.stringify({status : true, key:key}));
                            }else{res.end(JSON.stringify({status:false})); }
                        }else{res.end(JSON.stringify({status:false})); }
                    }
                });
            break;
            case 'checkCookie':
                user = data['user'];
                key = data['key'];
                userLogin = connectedUser['content'].find(dat => dat.email == user);
                if(userLogin != undefined){
                    if(userLogin.key == key){res.end('true');}
                    else{ res.end('false');}
                }else{res.end('false');}
            break;
            case 'addToCart':
                user = data['user'];
                id = data['id'];
                saved = cartUser[user];
                if(saved == undefined){saved = []}
                if(saved.indexOf(id) == -1 && id != 0){saved.push(id);}
                cartUser[user] = saved;
                res.end('success');
            break;
            case 'deleteFromCart':
                user = data['user'];
                id = data['id'];
                saved = cartUser[user];
                if(saved == undefined){saved = []}
                if(saved.indexOf(id) != -1){saved.splice(saved.indexOf(id),1);}
                cartUser[user] = saved;
                res.end('success');
            break;
            case 'IsCarted':
                user = data['user'];
                id = data['id'];
                saved = cartUser[user];
                if(saved == undefined){saved = []}
                if(saved.indexOf(id) != -1){res.end('true');}
                else{res.end('false');}
            break;
            case 'getCartedElement':
                user = data['user'];
                carted = cartUser[user];
                if(carted == undefined){res.end('empty');}
                else{
                    value = '(';
                    for(a=0;a<carted.length;a++){
                        value += carted[a];
                        if(a != carted.length-1){value += ',';}
                    }
                    value += ')';
                    request = `select * from packages natural join cssCode natural join jsCode natural join htmlCode where id in ${value} ;`;
                    packageDB.all(request,(err,rows)=>{
                        if(err){
                            res.writeHead(500, {'Content-Type': 'text/html'});
                            return res.end("500 Internal Server Error");
                        }else{
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify(rows));
                        }
                    });
                }
            break;
            case 'downloadFiles':
                user = data['user'];
                carted = cartUser[user];
                html_code = '';
                css_code = '';
                js_code = '';
                value = '(';
                    for(a=0;a<carted.length;a++){
                        value += carted[a];
                        if(a != carted.length-1){value += ',';}
                    }
                    value += ')';
                request = `select * from packages natural join cssCode natural join jsCode natural join htmlCode where id in ${value} ;`;
                packageDB.all(request,(err,rows)=>{
                    if(err){throw err;}
                    else{
                        for(a=0;a<rows.length;a++){
                            html_code += `\n<!--  ${rows[a]['name']}  -->\n ${rows[a]['html_code']}`;
                            css_code += `\n/*  ${rows[a]['name']}  */ \n${rows[a]['css_code']}`;
                            js_code += `\n/*  ${rows[a]['name']}  */ \n${rows[a]['js_code']}`;
                        }
                    }
                    fs.rmSync(__dirname+'/html/download_zone/'+user,{recursive:true});
                    fs.mkdirSync(__dirname+'/html/download_zone/'+user);
                    fs.writeFileSync(__dirname+'/html/download_zone/'+user+'/index.html',html_code);
                    fs.writeFileSync(__dirname+'/html/download_zone/'+user+'/style.css',css_code);
                    fs.writeFileSync(__dirname+'/html/download_zone/'+user+'/script.js',js_code);
                    path = `${__dirname}/html/download_zone/${user}/${user}.zip`;
                    os.execCommand(`zip -r ${path} ${__dirname}/html/download_zone/${user} -j`, (returnvalue)=> {
                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        res.end('success');
                        deleteFileUser(user);
                    });
                });
            break;
            case 'register':
                email = data['email'];
                username = data['name'];
                password = data['password'];
                password = crypto.createHash('sha256').update(password).digest('base64');
                request = `select * from informations where email='${email}';`;
                usersDB.all(request,(err,rows)=>{
                    if(err){throw err}
                    else{
                        if(rows[0] != undefined){
                            res.end(JSON.stringify({status:false}));
                        }else{
                            request = `insert into informations (email,name,hash) values ('${email}','${username}','${password}');`;
                            usersDB.run(request,(err)=>{
                                if(err){throw err}
                                else{
                                    key = makeid(25);
                                    connectedUser['content'].push({email:email,key:key});
                                    fs.mkdirSync(__dirname+'/html/download_zone/'+email);
                                    res.end(JSON.stringify({status:true,key:key}));
                                }
                            });
                        }
                    }
                });
            break;

        }
    }
}

const server = http.createServer(requestListener);

function startServer(){
    server.listen(port, host, () => {
       console.log(`Server running at http://${host}:${port}/`);
    });
}

startServer()

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function os_func() {
    this.execCommand = function(cmd, callback) {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            callback(stdout);
        });
    }
}
var os = new os_func();

async function deleteFileUser(user){
    await sleep(10000); 
    fs.rmSync(__dirname+'/html/download_zone/'+user,{recursive:true});
    fs.mkdirSync(__dirname+'/html/download_zone/'+user);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function enableConsoleInput(){
    readline.question(`> `, command => {
        command = command.split(' ');
        switch(command[0]){
            case 'shutdown':
                console.log('Shutting down...');
                process.exit();
            break;
            case 'show':
                switch(command[1]){
                    case 'user':
                        console.log('Connected users:');
                        for(a=0;a<connectedUser['content'].length;a++){
                            console.log(`${connectedUser['content'][a]['email']}`);
                        }
                    break;
                    case 'cart':
                        cartContent = cartUser[command[2]];
                        console.log(cartContent);
                    break;
                    case 'key': 
                        user = command[2];
                        console.log(connectedUser['content'][connectedUser['content'].findIndex(x => x.email == user)]['key']);
                    break;
                }
            break;
            case 'disconnect':
                userLogin = connectedUser['content'].find(user => user.email == command[1]);
                if(userLogin == undefined){
                    console.log('User not found');
                }else{
                    connectedUser['content'][connectedUser['content'].indexOf(userLogin)]['key'] = makeid(2);
                    console.log('User disconnected');
                }
            break;
            case 'variable':    
                console.log(eval(command[1]));
            break
            case 'server':
                switch(command[1]){
                    case 'stop':
                        console.log('Stopping server...');
                        server.close();
                    break;
                    case 'start':
                        console.log('Starting server...');
                        startServer();
                    break;
                    case 'restart':
                        console.log('Restarting server...');
                        server.close();
                        startServer();
                    break;
                }
            break;
            case 'set':
                eval(command[1] + '=' + command[2]);
            break;

        }
        enableConsoleInput();
    });
}

enableConsoleInput();