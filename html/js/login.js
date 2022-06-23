async function digestMessage(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); 
    return hashHex;
}

async function submit(){
    user = document.getElementById('username').value;
    pswd = document.getElementById('password').value;
    pswd = await digestMessage(pswd)
    $.get('ajax',{action:'login',username:user,password:pswd},(data)=>{
        data = JSON.parse(data);
        if(data['status'] == true){
            setCookie('loged','true',1)
            setCookie('key',data['key'],1)
            setCookie('user',user,1)
            window.location = 'index.html';
        }else{
            document.getElementById('failStatus').style.display = 'inline';
        }
    });
}