

var dateFilter = module.exports =  {

    // format the display of a UTC date
    display : function(str){

      var month = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December"
        ];
        var ordinal = {
          1 : "st",
          2 : "nd",
          3 : "rd",
          21 : "st",
          22 : "nd",
          23 : "rd",
          31 : "st"
        };

      var d = new Date(str);
      return month[d.getMonth()] + " " + d.getDate() + (ordinal[d.getDate()] || "th") + " " +d.getUTCFullYear();
    },

    // test if a date is in the future or the past.
    // Returns true if date tested is in the future.
    upcoming : function(str) {
      var test = new Date(str);
      var now = new Date();
      return (test - now > 0);
    }

};

