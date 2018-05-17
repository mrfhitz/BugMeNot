(function () {
    var baseURL = "http://bugmenot.com/view/";
    var domain = "";


    var requestUsers = function(domain) {

        $.get( baseURL + domain, function( htmlPage ) {
            var data = [];
            var accounts = $(htmlPage).find(".account");

            for(var i = 0; i < accounts.length; i++) {

                var user = $(accounts[i]).find('dd:not(.stats)');

                if(user.length >= 2) {
                    var obj = {
                        user: {
                            username : "",
                            password : "",
                            other : ""
                        },
                        stats: {
                            success_date: "",
                            votes: "",
                            old: ""
                        }
                    };

                    obj.user.username = user[0].innerText;
                    obj.user.password = user[1].innerText;
                    if(user.length > 2) {
                        obj.user.other = user[2].innerText;
                    }

                    var stats = $(accounts[i]).find(".stats li");

                    if(stats) {
                        obj.stats = {
                            success_date: stats[0].innerText,
                            votes: stats[1].innerText,
                            old: stats[2].innerText
                        }
                    }

                    data.push(obj);
                }
            }

            if(data.length == 0) {
                var errors = $(htmlPage).find("#content > p");
                if(errors.length != 0) {
                    drawError(errors[0].innerText);
                    return [];
                }
            }

            loading(false);
            drawUsers(data);
        }).fail(function(){
            drawError("O servidor não consegue resolver este dominio.");
        });

    };

    var drawUsers = function (data) {
        //TODO: Draw users into the page
        //TODO: Draw Error if there is no data
        console.log(data);

    };

    var drawError = function (message) {
        $(".wrapper").append("<div class=\"error\">"+message+"</div>");
        if($(".loading").css("display") == "block") {
            loading(false, function(){
                $(".error").slideDown(200);
            });
        }else {
            $(".error").slideDown(200);
        }
    };

    function extractUrlDomain(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
    }

    var loading = function (active, callback) {
        if(active) {
            $(".loading").fadeIn( 0 );
            $(".loading").css("margin-top", "200px");
        } else {
            $(".loading img").fadeOut( 200, function(){
                if(typeof callback === "function") {
                    $(".loading").slideUp( 100, callback);
                }else {
                    $(".loading").slideUp( 100 );
                }
            });
        }
    };

    /*********** BOOTSTRAP THE EXTENSION ***********/
    loading(true);
    chrome.tabs.getSelected(null, function(tab) {
        domain = extractUrlDomain(tab.url);
        console.log(domain);
        requestUsers(domain);
    });
    /***********************O**********************/

})();
