var requestUsers = function(domain) {
    var baseURL = "http://bugmenot.com/";

    $.get( baseURL + "view/" + domain, function( htmlPage ) {
        var accounts = $(htmlPage).find(".account");
        if(accounts.length > 0) {
            chrome.browserAction.setBadgeText({text: accounts.length.toString()});
        }else {
            chrome.browserAction.setBadgeText({text: ""});
        }

    }).fail(function(){
        chrome.browserAction.setBadgeText({text: ""});
    });
};

var extractUrlDomain = function(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname;
};

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (tab.active) {
        var domain = extractUrlDomain(tab.url);
        requestUsers(domain);
        // do your things

    }
});

chrome.tabs.onActivated.addListener( function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        var domain = extractUrlDomain(tab.url);
        requestUsers(domain);
    });
});