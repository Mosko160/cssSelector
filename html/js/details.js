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
        name : '',
        id : 0,
        html_code : '',
        css_code : '',
        js_code : '',
        code : '',
    }
});

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

$.get('ajax',{action:'getCodeById',id:params.id},(data)=>{
    app.name = data[0].name;
    app.id = data[0].id;
    app.html_code = data[0].html_code;
    app.css_code = data[0].css_code;
    app.js_code = data[0].js_code;
    app.code = '<style>'+data[0].css_code+'</style><script>'+data[0].js_code+'</script><div>'+data[0].html_code+'</div>';
    $.get('ajax',{action:'IsCarted',user:getCookie('user'),id:app.id},(data)=>{
        if(data == 'true'){
            document.getElementById('cartButton').innerHTML = 'Delete from cart';
        }
    });
});


function addCart(){
    if(document.getElementById('cartButton').innerHTML == 'Add to cart'){
        $.get('ajax',{action:'addToCart',user:getCookie('user'),id:app.id},(data)=>{
            if(data == 'success'){
                document.getElementById('cartButton').innerHTML = 'Delete from cart';
            }
        });
    }else{
        $.get('ajax',{action:'deleteFromCart',user:getCookie('user'),id:app.id},(data)=>{
            if(data == 'success'){
                document.getElementById('cartButton').innerHTML = 'Add to cart';
            }
        });
    }
}