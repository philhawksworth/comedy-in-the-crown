(function(){

  function $$(query, context) {
    return Array.prototype.slice.call((context||document).querySelectorAll(query));
  }


  // get the slides now, and keep them handy.
  var slides = $$('body > .slide');
  var activeSlide = 0;
  var looper = null;

  // show a specific slide (by number)
  var show = function(index) {

    if(looper && looper != undefined) { clearTimeout(looper); };

    // hide all slides
    slides.filter(function(ele, i){
      ele.classList.remove('active');
    })

    // bound us to the range of slides
    if(index < 0) { index = 0};
    if(index >= slides.length) { index = slides.length-1 };

    // Display the target slide
    slides[index].classList.add('active');

    // if the slide is a set, show the first sub slide
    if(slides[index].classList.contains('set')) {
      var set = $$('.slide', slides[index]);
      loop(set, 0);
    }

    // update our track of the  active slide
    updateIndex(slides);
  }


  // show the next slide
  var next = function() {
    show(activeSlide + 1);
  };


  // show the previous slide
  var previous = function() {
    show(activeSlide - 1);
  };


  var updateIndex = function(set) {
    set.filter(function(ele, i){
      if(ele.classList.contains('active')){
        activeSlide = i;
        return;
      }
    })
  }


  // iterate over a set of slides
  var loop = function(set, index) {

    // hide all sub slides
    set.filter(function(ele, i){
      ele.classList.remove('active');
    });

    // loop back to the start if needed
    if(index >= set.length) { index = 0 };

    // show this slide in the set
    set[index].classList.add('active');

    // override the display duration for this slide if provided
    var duration = set[index].dataset.duration || set[index].parentElement.dataset.duration;

    // show the next slide
    index++;
    looper = setTimeout(function(){
      loop(set, index);
    }, duration);

  };


  // Adjust display brightness
  var getBrightness = function() {
    var value = document.querySelector('body').style.filter;
    return value ? value.split("(")[1].split(")")[0] : 1;
  }
  var setBrightness = function(change) {
    if(change == 'up') {
      value = parseFloat(getBrightness()) + 0.1;
    } else if (change == 'down') {
      value = parseFloat(getBrightness()) - 0.1;
    } else {
      value = 1;
    }
    document.querySelector('body').style.filter = "brightness("+ value +")"
  }


  // Key mappings
  var action = {
    32 : next,                                // space
    34 : next,                                // remote, advance
    39 : next,                                // right arrow
    33 : previous,                            // remote previous
    37 : previous,                            // left arrow
    38 : function() {setBrightness('up')},    // up arrow
    40 : function() {setBrightness('down')},  // down arrow
    48 : function() {setBrightness('reset')}, // number 0
    49 : function() {show(0); },              // number 1
    50 : function() {show(1); },              // number 2
    51 : function() {show(2); },              // number 3
    52 : function() {show(3); },              // number 4
    53 : function() {show(4); },              // number 5
    54 : function() {show(5); },              // number 6
    55 : function() {show(6); },              // number 7
    56 : function() {show(7); },              // number 8
    57 : function() {show(8); }               // number 9
  };

  // Setup the key handlers
  var body = document.querySelector('body');
  body.onkeydown = function (e) {
    if ( !e.metaKey ) {
      e.preventDefault();
    }
    if(action[e.keyCode] == undefined) {
      return;
    }
    action[e.keyCode].call();
  };


  // show the first slide at start time
  show(0);

})();
