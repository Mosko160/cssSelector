async function register(){
    name = document.getElementById("username").value;
    email = document.getElementById("email").value;
    password = document.getElementById("password").value;
    confirm = document.getElementById("password2").value;
    if(name == "" || email == "" || password == "" || confirm == ""){
        alert("Please fill in all fields");
    }else if(password != confirm){
        alert("Passwords do not match");
    }else{
        password = await digestMessage(password);
        $.get('ajax',{action:'register',name:name,email:email,password:password},(data)=>{
            data = JSON.parse(data);
            if(data['status']){
                alert("Successfully registered");
                setCookie('loged','true',1);
                setCookie('user',email,1);
                setCookie('key',data['key'],1);
                window.location.href = "index.html";
            }else{
                alert("Error registering");
            }
        });
    }
}

async function digestMessage(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); 
    return hashHex;
}