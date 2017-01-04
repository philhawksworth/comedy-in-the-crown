const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const data = require('gulp-data');
const nunjucks = require('gulp-nunjucks');
const fm = require('front-matter');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const webserver = require('gulp-webserver');
const prettyUrl = require("gulp-pretty-url");
const runSequence = require('run-sequence');
const contentful = require('contentful');
const mkdirp = require('mkdirp');
const inject = require('gulp-inject');


// An configuration object to be popualted and passed to the client
// for render view configurations.
// The /on path is hardcoded here until it can be autognerated
var confs = {
  "views" : {
    "/on/" : {"url": ["api/nights.json"],
      "template": "night"
    }
  }
};

// Add a custom nunjucks environment for custom filters
const nunj = require('nunjucks');
const dates = require("./js/dates.js");
nunj.configure('views');
var env = new nunj.Environment(new nunj.FileSystemLoader('views'));
env.addFilter('date', dates.display);
env.addFilter('upcoming', dates.upcoming);
env.addFilter('urlify', dates.urlify);


// set up the contentful query client
// readonly access from these creds
var client = contentful.createClient({
    space: 'ot0mnooc6nee',
    accessToken: 'c685bb6a2978131d6e287e6e1a6c1b1b71ce6cf3c7a3be2caa43cc6b4ec580eb'
});


// Clean up output directory
gulp.task('clean', function () {
  return gulp.src('dist/*', {read: false})
    .pipe(clean());
});


// Compile the views with the data found in the api sepcified in
// the template's front-matter.
// Additional data can be passed in the front-matter
gulp.task('generate', () =>
  gulp.src(['views/*.html', '!views/night.html'])
    .pipe(data(function(file) {
      var content = fm(String(file.contents));
      var apiData = {};
      var apiUrls = []; // for our configs file in view.js
      for (var i = 0; i < content.attributes.api.length; i++) {
        var source = content.attributes.api[i].split(".json")[0].split("/")[1]; // better with a regex.
        apiUrls.push(content.attributes.api[i]);
        apiData[source] = require("./" + content.attributes.api[i]);
      }
      content.attributes.api = apiData ;
      content.attributes.baseTemplate = "./layouts/base.html";
      content.attributes.printTemplate = "./layouts/print.html";
      // build a configs object for use as a reference in the client
      var name = "/" + file.path.replace(file.base, "").replace(".html","");
      if(name == "/index") {
        name = "/";
      }
      confs.views[name] = {
        "url" : apiUrls,
        "template" : content.attributes.body
      }
      fs.writeFileSync('js/configs.js', "site.views = " + JSON.stringify(confs.views)+ ";");
      return content.attributes;
    }))
    .pipe(nunjucks.compile(null, {"env" : env}))
    .pipe(prettyUrl())
    .pipe(inject(gulp.src(['./dist/style/base.css']), {
      starttag: '<!-- inject:css -->',
      removeTags: true,
      transform: function (filePath, file) {
        return file.contents.toString('utf8')
      }
    }))
    .pipe(gulp.dest('dist'))
);


// Generate a page for each gig
gulp.task('generate:nights', function() {
  var apiData = require("./api/nights.json");
  var data = {
    "baseTemplate" : "./layouts/base.html",
    "body" : "night"
  };

  // create each event page
  for (var item = 0; item < apiData.length; item++) {
    data.api = {"nights" : apiData};
    data.path = dates.urlify(apiData[item].date);
    var url = './dist/on/' + dates.urlify(apiData[item].date);
    var out = env.render("night.html", data);
    mkdirp.sync(url);
    fs.writeFileSync(url + "/index.html", out)
  }

  // perform the css injection to each of the new pages.
  gulp.src('./dist/on/*/index.html')
    .pipe(inject(gulp.src(['./dist/style/base.css']), {
      starttag: '<!-- inject:css -->',
      removeTags: true,
      transform: function (filePath, file) {
        return file.contents.toString('utf8')
      }
    }))
    .pipe(gulp.dest('dist/on/'))
});



// copy the api files to the output directory
gulp.task('api', () =>
  gulp.src('api/**/*.json')
    .pipe(gulp.dest('dist/api'))
);


// Get data from the cloud CMS and stash it locally
gulp.task('get', ['get:acts', 'get:nights']);



// Get the Acts data from the cloud CMS and stash it locally
gulp.task('get:acts', function() {
  getBatch('act', 0, function(acts){
    fs.writeFileSync('api/acts.json', JSON.stringify(acts));
  });
});



// Get the Nights data from the cloud CMS and stash it locally
gulp.task('get:nights', () =>
  client.getEntries({'content_type':'event'})
    .then(
      function(resp) {
        var dataObject = [];

        for (var item = 0; item < resp.items.length; item++) {
          var thisNight = resp.items[item].fields;
          var thisNightsActs = [];
          if (resp.items[item].fields.performers) {
            for (var night = 0; night < resp.items[item].fields.performers.length; night++) {
              thisNightsActs.push(resp.items[item].fields.performers[night].fields);
            }
          }
          delete thisNight.performers;
          thisNight.acts = thisNightsActs;

          // format the mc data
          if(thisNight.mc) {
            var mc = thisNight.mc.fields;
            delete thisNight.mc;
            thisNight.mc = mc;
          }

          var thisNightsPhotos = [];
          if (thisNight.photos) {
            var photos = thisNight.photos;
            for(var photo = 0; photo < photos.length; photo++) {
              thisNightsPhotos.push({
                "url": photos[photo].fields.file.url,
                "title" : photos[photo].fields.title
              });
            }
          }
          delete thisNight.photos;
          thisNight.pictures = thisNightsPhotos;
          dataObject.push(thisNight);
        }
        fs.writeFileSync('api/nights.json', JSON.stringify(dataObject));
      }
    )
);




// Get the image assets
gulp.task('get:images', () =>
  client.getEntries({'content_type':'assets'})
    .then(
      function(resp) {
        console.log(resp);
      }
    )
);



// Get data from Contentful in batches of 100
function getBatch(type, skip, callback, batch) {
  var config = {
    'content_type':type,
    'skip': skip
  };
  if(typeof batch == "undefined") {
    var batch = [];
  }
  client.getEntries(config)
  .then(
    function(resp) {
      for (var item = 0; item < resp.items.length; item++) {
        batch.push(resp.items[item].fields)
      }
      if(resp.total > resp.limit) {
        getBatch(type, resp.skip + resp.limit, callback, batch)
      } else {
        callback(batch);
      }
    }
  )
}


// Compile the client-side templates
gulp.task('precompile', () =>
  gulp.src(['views/pages/**/*.html'])
    .pipe(nunjucks.precompile())
    .pipe(concat('templates.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
);


// Combine and compress javascript
gulp.task('scripts', () =>
  gulp.src(['js/libs/*.js', "js/dates.js", "js/views.js", "js/configs.js", "js/analytics.js"])
    .pipe(concat('concat.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
);


// Optimise images and add to the dist
gulp.task('images', () =>
  gulp.src(['images/**/*'])
    .pipe(gulp.dest('dist/images'))
);


// Ensure any config files make to the dist folder
gulp.task('configs', () =>
  gulp.src(['_redirects','_headers','browserconfig.xml','manifest.json'])
    .pipe(gulp.dest('dist'))
);


// Compile CSS from Sass
gulp.task('sass', () =>
  gulp.src(['sass/base.scss'])
    .pipe(sass({outputStyle: 'compressed', includePaths: ['./sass/include']}).on('error', sass.logError))
    .pipe(gulp.dest('dist/style'))
);

gulp.task('sass:print', function() {
  gulp.src(['sass/print.scss'])
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('dist/style'));
});


// Watchers
gulp.task('sass:watch', () =>
  gulp.watch('sass/**/*.scss', ['sass'])
);
gulp.task('templates:watch', () =>
  gulp.watch('views/**/*.html', ['generate','precompile'])
);


// serve the static dist folder
gulp.task('serve', function() {
  gulp.src('dist')
    .pipe(webserver({
      livereload: false,
      open: false
    }));
});


// Our task runners
gulp.task('default', ['build:local']);
gulp.task('watch', ['sass:watch', 'templates:watch']);


gulp.task('build:local', function(callback) {
  runSequence(
    'clean',
    ['sass', 'sass:print'],
    'generate',
    ['images', 'scripts', 'precompile', 'api', 'configs'],
    'generate:nights',
    callback
  );
});


gulp.task('build:prod', function(callback) {
  runSequence(
    'get',
    'build:local',
    callback
  );
});
