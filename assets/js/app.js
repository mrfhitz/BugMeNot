(function () {
    var baseURL = "http://bugmenot.com/";
    var domain = "";
    var upvoted = [];
    var downvoted = [];

    var requestUsers = function(domain) {

        $.get( baseURL + "view/" + domain, function( htmlPage ) {
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
                            success_class: "",
                            success_rate: "",
                            votes: "",
                            old: ""
                        },
                        vote: {
                            account: "",
                            site: "",
                            active: ""
                        }
                    };

                    obj.user.username = user[0].innerText;
                    obj.user.password = user[1].innerText;
                    if(user.length > 2) {
                        obj.user.other = user[2].innerText;
                    }

                    var stats = $(accounts[i]).find(".stats li");
                    var success_class = $(stats[0]).attr("class").split(" ");
                    if(success_class.length == 2) {
                        success_class = success_class[1];
                    }else success_class = "";

                    if(stats) {
                        obj.stats = {
                            success_class: success_class,
                            success_rate: stats[0].innerText,
                            votes: stats[1].innerText,
                            old: stats[2].innerText
                        }
                    }

                    var account = $(accounts[i]).find("form input[name='account']").val();
                    var site = $(accounts[i]).find("form input[name='site']").val();

                    if(account && site) {
                        var activeVote = "";
                        if(upvoted.indexOf(site + ":" + account) !== -1) {
                            activeVote = 'Y';
                        }

                        if(downvoted.indexOf(site + ":" + account) !== -1) {
                            activeVote = 'N';
                        }

                        obj.vote = {
                            account: account,
                            site: site,
                            active: activeVote
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

            drawUsers(data);
        }).fail(function(){
            drawError("O servidor não consegue resolver este dominio.");
            loading(false);
        });

    };

    var drawUsers = function (data) {
        var $showWebDomain = $('<div class="domain-name ellipsis">');
        $showWebDomain.html(domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0]);
        $(".wrapper").append($showWebDomain);

        for(var i = 0; i < data.length; i++) {
            var item = data[i];

            if(item.vote.active == 'Y' || item.vote.active == '') {
                var $article = buidDomElement(item);

                $(".wrapper").append($article);
            }
        }

        if(data.length < 1) {
            drawError("There is no account for this website. Be the first!")
        }

        loading(false, function () {
            $(".wrapper").fadeIn(400);
        });

        loadEvents();

    };

    var drawError = function (message) {
        $(".wrapper").append("<div class=\"error\">"+message+"</div>");
        $(".wrapper").fadeIn(0);
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
        var $loading = $(".loading");
        if(active) {
            $loading.fadeIn( 0 );
            $loading.css("top", "200px");
            if(typeof callback === "function") {
                callback();
            }
        } else {
            $(".loading img").fadeOut( 200, function(){
                if(typeof callback === "function") {
                    $loading.slideUp( 100, callback);
                }else {
                    $loading.slideUp( 100 );
                }
                $loading.css("top", "0px");
            });
        }
    };

    /*********** BOOTSTRAP THE EXTENSION ***********/
    loading(true);
    chrome.storage.local.get({upvoted: []}, function(result) {
        upvoted = result.upvoted;
        chrome.storage.local.get({downvoted: []}, function(result) {
            downvoted = result.downvoted;
            chrome.tabs.getSelected(null, function(tab) {
                domain = extractUrlDomain(tab.url);
                requestUsers(domain);
            });
        });
    });


    chrome.storage.local.get({userKeyIds: []}, function (result) {

    });
    /***********************O**********************/


    var buidDomElement = function (elem) {
          var dom = '<article>' +
              '<div class="row account-data">' +
              '<div class="col-1-3 label">Username:</div>' +
              '<div class="col-2-3 data" contenteditable="true">' + elem.user.username + '</div>' +
              '</div>' +
              '<div class="row account-data">' +
              '<div class="col-1-3 label">Password:</div>' +
              '<div class="col-2-3 data" contenteditable="true">' + elem.user.password + '</div>' +
              '</div>';
          if(elem.user.other.trim() != "") {
              dom += '<div class="row account-data">' +
                  '<div class="col-1-3 label">Other:</div>' +
                  '<div class="col-2-3 data" contenteditable="true">' + elem.user.other + '</div>' +
                  '</div>';
          }
            dom += '<div class="row stats">' +
              '<div class="col-1-3"><span class="success_rate ' + elem.stats.success_class + '">' + elem.stats.success_rate + '</span></div>' +
              '<div class="col-1-3 votes">' + elem.stats.votes + '</div>' +
              '<div class="col-1-3 date">' + elem.stats.old + '</div>' +
              '</div>' +
              '<div class="row vote">' +
              '<div class="col-half downvoted" data-account="' + elem.vote.account + '" data-site="' + elem.vote.site + '" data-vote="N">' +
              '<span class="symbol">⇩</span> Not Working' +
              '</div>' +
              '<div class="col-half upvoted' + ((elem.vote.active == 'Y') ? ' active': '') + '" data-account="' + elem.vote.account + '" data-site="' + elem.vote.site + '" data-vote="Y">' +
              '<span class="symbol">⇩</span> Awesome' +
              '</div>' +
              '</div>' +
              '</article>';

          return $(dom);
    };
    
    var sendVote = function(account,site,vote) {
        $.ajax({
            method: "POST",
            url: baseURL + "vote.php",
            data: {
                account: account,
                site: site,
                vote: vote
            }
        }).done(function () {
            loading(true, function () {
                $(".wrapper").fadeOut(200, function () {
                    $(".wrapper").html("");
                    requestUsers(domain);
                });
            });
        });
    };

    var loadEvents = function () {
        $( ".upvoted, .downvoted" ).click(function() {
            var $this = $( this );
            var account = $this.data("account");
            var site = $this.data("site");
            var vote = $this.data("vote");

            if(!$this.hasClass("active")) {
                if(vote == 'Y') {
                    chrome.storage.local.get({upvoted: []}, function (result) {
                        upvoted = result.upvoted;
                        upvoted.push(site + ":" + account);

                        chrome.storage.local.set({upvoted: upvoted}, function () {
                            sendVote(account, site, vote);
                        });
                    });
                }else if(vote == 'N') {
                    chrome.storage.local.get({downvoted: []}, function (result) {
                        downvoted = result.downvoted;
                        downvoted.push(site + ":" + account);

                        chrome.storage.local.set({downvoted: upvoted}, function () {
                            sendVote(account, site, vote);
                        });
                    });
                }
            }else {
                if(vote == 'Y') {
                    chrome.storage.local.get({upvoted: []}, function (result) {
                        upvoted = result.upvoted;
                        var index = upvoted.indexOf(site + ":" + account);
                        if (index > -1) {
                            upvoted.splice(index, 1);
                        }

                        chrome.storage.local.set({upvoted: upvoted}, function () {
                            sendVote(account, site, vote);
                        });
                    });
                }else if(vote == 'N') {
                    chrome.storage.local.get({downvoted: []}, function (result) {
                        downvoted = result.downvoted;
                        var index = downvoted.indexOf(site + ":" + account);
                        if (index > -1) {
                            downvoted.splice(index, 1);
                        }

                        chrome.storage.local.set({downvoted: upvoted}, function () {
                            sendVote(account, site, vote);
                        });
                    });
                }
            }
        });

        $( "header .add" ).click(function () {
            chrome.tabs.create({ url: baseURL + 'submit.php?seed=' + domain });
        });

        $( "article .account-data" ).click(function () {
            //$(this).find(".data").selectText();
            selectElement($(this).find(".data"));
        });
    };
})();
