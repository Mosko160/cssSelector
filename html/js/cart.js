if (getCookie('loged') != 'true'){
    window.location = 'login.html'
}
$.get('ajax',{action:'checkCookie',user:getCookie('user'),key:getCookie('key')},(data)=>{
    if(data == 'false'){
        eraseCookie('loged');
        window.location = 'login.html';
    }
});

app = new Vue({
    el: '#app',
    data: {
        items : [],
        id : []
    },
    methods:{
        redirect : (id)=>{
            window.location = `details.html?id=${id}`;
        },
        deleteFromCart : (id)=>{
            $.get('ajax',{action:'deleteFromCart',user:getCookie('user'),id:id},(data)=>{
                placement = app.id.indexOf(id);
                app.items.splice(placement,1);
                app.id.splice(placement,1);
            });
        }
    }
});

$.get('ajax',{action:'getCartedElement',user:getCookie('user')},(data)=>{
    for(var a=0;a<data.length;a++){
        app.items.push({
            name: data[a].name,
            code: '<style>'+data[a].css_code+'</style><script>'+data[a].js_code+'</script><div>'+data[a].html_code+'</div>',
            id: data[a].id,
        });
        app.id.push(data[a].id);
    }
});

function download(){
    if(app.id.length != 0){
        $.get('ajax',{action:'downloadFiles',user:getCookie('user')},(data)=>{
            var a = document.createElement('a');
            a.href = `/download_zone/${getCookie('user')}/${getCookie('user')}.zip`;
            a.download = 'files.zip';
            a.id = 'test';
            document.body.appendChild(a);
            a.click();
        });
    }else{
        alert('Cart is empty !');
    }
}