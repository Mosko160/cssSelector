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
    },
    methods:{
        redirect : function(id){
            window.location = `details.html?id=${id}`;
        }
    }
});

$.get('ajax',{action:'getElementsRandom'},(data)=>{
    for(var a=0;a<data.length;a++){
        app.items.push({
            name: data[a].name,
            code: '<style>'+data[a].css_code+'</style><script>'+data[a].js_code+'</script><div>'+data[a].html_code+'</div>',
            id: data[a].id,
        });
    }
    for(var a=0;a<data.length;a++){
        app.items.push({
            name: data[a].name,
            code: '<style>'+data[a].css_code+'</style><script>'+data[a].js_code+'</script><div>'+data[a].html_code+'</div>',
            id: data[a].id,
        });
    }
});