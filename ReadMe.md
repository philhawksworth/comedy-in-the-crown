# Comedy in the Crown

A website to promote a free open mic comedy night. And also a proof of concept for a conten management workflow.

## About this site

The site is built using static site generation. A custom generator built with a number of node modules coordinated using:

- npm
- gulp

## Content management

Content for this site is managed on [Contentful](https://contentful.com). Content changes trigger site build automatically in the static hosting provider ([Netlify](https://netlify.com)) as do changes to the code pushed to this repository.


## Hosting

The site is hosted on [Netlify](https://netlify.com) as a static build. 


## Development

After cloning this repository, all dependencies can be installed be running `npm install`. Once this is done, Gulp provides a numebr of buold options:

`gulp` - defaults to `gulp build:local`
`gulp build:prod` - Retreives the latest content data from Contentful, stashes it in a local API and thenn executes `gulp build:local`
`gulp build:local` - Executes the compilation of the entire build from a local stash of the content data api.
`gulp watch` - Regenerates templates, css and scripts when changes to those resources are detected.
