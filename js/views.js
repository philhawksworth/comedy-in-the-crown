
var site = {

  // configurations.
  // Would be nice to generate this from the template defintions to keep things dry.
  "views" : {
    "/dates" : {
      "url": ["/api/nights.json"],
      "template": "dates",
    },
    "/on/*" : {
      "url": ["/api/nights.json"],
      "template": "night",
    },
    "/featuring" : {
      "url": ["/api/acts.json"],
      "template": "performers",
    },
    "/" :  {
      "url": ["/api/nights.json"],
      "template": "index",
    }
  },


  // create event handlers
  addEventHandlers : function () {
    // hijack links which are root relative
    var dynamicPageLinks = document.querySelectorAll("[href^='/']");
    $(dynamicPageLinks).on("click", function(e){
      e.preventDefault();
      site.loadPage(e.target.pathname);
      site.setAddress(e.target.pathname);
      $(e.target).blur();  
      //todo: fire analytics
    });
    // perform client-side content render for browser history navigation
    window.onpopstate = function(e) {
      if(e.state.path){
        site.loadPage(e.state.path);
      }
    };  
  },


  // get data for the page from the API
  // set the address in the browser history
  // render the page
  loadPage : function(path) {
    var view = site.views[path];
    var urls = view.url;
    $.when.apply($, urls.map(function(url) {
      return $.ajax(url);
    }))
    .done(function() {
      // build a single data object keyed to pass the data to the templates
      var results = {"api" : {}};
      var response;
      if(urls.length == 1){
        response = arguments[0];
        var objName = site.resolveObjectName(urls[0]);  
        results.api[objName] = response;
      } else {
        for (var result = 0; result < arguments.length; result++) {
          var objName = site.resolveObjectName(urls[result]);      
          results.api[objName] = arguments[result][0];
        }
      }
      // render the data into a template
      site.render(results, view.template);
    });
  },


  // apply the template and insert it into the page
  render : function (data, template) {
    var output = nunjucks.render(template + ".html", data);
    $('.content').html(output);
    smoothScroll.animateScroll( '#top' );
  },


  // manage the browser history
  setAddress : function(path) {
    var stateObject = {
      path: path
    };
    history.pushState(stateObject, null, path);
  },


  resolveObjectName : function (api) {
    var spl = api.lastIndexOf('/');
    var name = api.substr(spl+1, api.length).split(".json")[0];
    return name;
  }


};

// Bind event losteners when the DOM is ready

$( document ).ready(function() {
  site.addEventHandlers();
  smoothScroll.init();
});

