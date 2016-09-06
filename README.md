# TankWars WebSite

This is the main tankwars web site. Check out [TankWars.Serverless.Camp](https://tankwars.serverless.camp) to see it in action.

## Running a local copy

1. install [jekyll](https://jekyllrb.com)
2. run `npm install` to fetch the dependencies
3. run `jekyll serve` and the site will show up @ localhost:4000

## asset pipeline

A Jekyll Plugin rebuilds the javascript and CSS, so as soon as you change a file on the disk, it will be rebuilt for you.

1. To add a new CSS file, make sure to link it from [style/main.css](style/main.css).
2. To add a new JS library to the match page, link it from [scripts/init-match-page.js](scripts/init-match-page.js)
3. To add a new JS library to the test page, link it from [scripts/init-test-page.js](scripts/init-test-page.js)
