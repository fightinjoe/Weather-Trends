Hosted on GitHub: http://github.com/fightinjoe/Weather-Trends

Misc. notes from the GitHub README:

This is my entry to the 10K Apart contest to build a web app in under 10k.

Description:

Weather forecasts are overly numerical, making comparisons and trends hard to identify.  Weather Trends graphs the week's forecast so you can easily see temperature differentials between the highs and lows across the week.  Implemented with SVG and local storage, and data from Wunderground.com

Submission:

My submission is in the /svg/weather_trends folder.  It is live at http://krunchr.com/svg/svg.html.

Notes:

I wanted to draw a graph at an angle with triangles.  I tried first with Canvas, but the required JS was quickly growing too large.

I also tried using raw HTML, tweaking the borders to create triangles, but alignment issues caused me to back away from this.

SVG made things easy.  Also, because the objects exist in the DOM, SVG is fully scriptable.  I'd played with interactivity, but removed it for the final project.

SVG does have some frustrating points, though, and non-standard support for extra features, like Gaussean Blur.