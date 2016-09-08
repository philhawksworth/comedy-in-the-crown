var env = new nunjucks.Environment();

env.addFilter('date', dateFilter.display);

env.addFilter('upcoming', dateFilter.upcoming);

env.addFilter('urlify', dateFilter.urlify);

var site = {

  //views object now generated from gulp task and added later (to keep things DRY)


  // create event handlers
  addEventHandlers : function () {
    // hijack links which are root relative
    $(document.body).on('click', "[href^='/']" ,function(e){
      e.preventDefault();
      site.loadPage(e.target.pathname);
      site.setAddress(e.target.pathname);
      $(e.target).blur();
      $('header .home').addClass('swell');
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

    //fire analytics
    if(typeof ga !== 'undefined') {
      ga('send', 'pageview', path);
    }

    // match all of the different gig event urls
    if (/\/on\/(.*)/.test(path)) {
      var view = site.views["/on/"];
      path = path.replace("/on/","");
    } else {
      var view = site.views[path];
    }

    var urls = view.url;
    $.when.apply($, urls.map(function(url) {
      return $.ajax("/" + url);
    }))
    .done(function() {
      // build a single data object keyed to pass the data to the templates
      var results = {
        "api" : {},
        "path" : path
      };
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
    var output = env.render(template + ".html", data);
    $('.content').html(output);
    smoothScroll.animateScroll(0);
    setTimeout(function(){
      $('header .home').removeClass('swell');
    }, 300);
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



$( document ).ready(function() {
  // Bind event listeners when the DOM is ready
  site.addEventHandlers();
  // Add scroll effects
  smoothScroll.init();
});

