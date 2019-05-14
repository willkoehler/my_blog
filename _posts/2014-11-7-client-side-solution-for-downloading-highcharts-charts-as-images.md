---
layout: post
last-modified: '2016-01-29T12:00:00-04:00'

title: "Client-Side Solution For Downloading Highcharts Charts as Images"
subtitle: "It even works in IE"
cover_image: brynhild-road-in-clintonville.jpg
cover_image_caption: "Brynhild Road in Clintonville. Photo: Will Koehler"

excerpt: "I wanted a straightforward, client-side solution for downloading the SVG charts
          generated by Highcharts as images. It can be done, but relies on a set of web
          technologies that are still evolving."

author:
  name: Will Koehler
  twitter: wckoehler
  bio: Web developer specializing in full-stack Rails applications.
  image: wk.jpg

---
[Highcharts](http://www.highcharts.com) is an excellent web-based charting package. But, because it's a
client-side solution, downloading charts as images is tricky. The default solution is to use
Highcarts' [export module](http://www.highcharts.com/docs/export-module/export-module-overview),
which posts the chart's SVG code to Highcharts' export server. The export server converts the chart
to an image and then sends it back to the browser.

The export server is a well-executed solution and should work for most situations. However for my latest project,
the charts contain sensitive data. Sending them to a third-party server is not possible. I considered setting
up my own export server, or adding an endpoint to my web application. But both these solutions add complexity
to the server for a task that theoretically can be handled in the client.

In this blog post, I explore various client-side solutions to downloading Highcharts as images.

## Strategy

Highcharts are rendered as [SVG (scalable vector graphics)](http://www.sitepoint.com/svg-scalable-vector-graphics-overview/).
The basic steps to download a chart as an image are:

- Get the chart's SVG code
- Render the SVG onto a `<cavas>` element
- Use toDataURL() to extract the canvas contents as an image
- Save this image to the local filesystem

## The Example Code

Let's start with a basic chart and download button.

{% highlight html %}
<div id='container'></div>
<button id='save_btn'>Save Chart</button>
{% endhighlight %}

{% highlight css %}
#container {
  max-width: 800px;
  height: 400px;
  margin: 1em auto;
}
{% endhighlight %}

{% highlight javascript %}
function save_chart(chart) {
  // TODO
}

$(function() {
  $('#container').highcharts({

    exporting: {
      enabled: false
    },

    title: {
      text: 'Client-Side Download Example'
    },

    chart: {
      type: 'area'
    },

    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },

    series: [{
      data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
    }]

  });

  $('#save_btn').click(function() {
      save_chart($('#container').highcharts());
  });

});
{% endhighlight %}

## 1. Get the chart's SVG code

Highcharts has an exporting module that adds functions for downloading and printing charts. This module
must be included separately.

{% highlight html %}
<script src="http://code.highcharts.com/modules/exporting.js"></script>
{% endhighlight %}

The exporting module adds the function [getSVG](http://api.highcharts.com/highcharts#Chart.getSVG)
which extracts the chart's SVG code and sanitizes it for export.

NOTE: Because we don't specify a hard-coded chart width in our css, we need to specify sourceWidth and
sourceHeight in the call to `getSVG`. This seems like a bug to me. `getSVG` should be able to calculate
the chart dimensions itself. (If we can get the dimensions from chart.chartWidth / chart.chartHeight,
`getSVG` could too)

{% highlight javascript %}
var svg = chart.getSVG({
  exporting: {
    sourceWidth: chart.chartWidth,
    sourceHeight: chart.chartHeight
  }
});
{% endhighlight %}

NOTE: Alternatively, you could grab the chart's SVG code directly.

{% highlight javascript %}
var svg = $('#container .highcharts-container').html()
{% endhighlight %}

While this eliminates the need for the exporting module, it also skips the sanitizing code. The most
obvious problem I ran into is that the resulting image may contain tooltips, which you probably don't
want in your downloaded chart image.

## 2. Render the chart's SVG onto a `<canvas>` element

Rendering SVG onto a `<canvas>` element is easy. You can put SVG into the `src` attribute of an `<img>`
tag. The browser will render the SVG into the image. Once the image has been rendered, you render this
image onto the canvas element. You don't even need to insert the image into the DOM for this to work.

To show how this works, we'll create a preliminary version of `save_chart` that renders the chart's SVG
onto a `<canvas>` element.

{% highlight javascript %}
EXPORT_WIDTH = 1000;

function save_chart(chart) {
  render_width = EXPORT_WIDTH;
  render_height = render_width * chart.chartHeight / chart.chartWidth

  // Get the cart's SVG code
  var svg = chart.getSVG({
    exporting: {
      sourceWidth: chart.chartWidth,
      sourceHeight: chart.chartHeight
    }
  });

  // Create a canvas
  var canvas = document.createElement('canvas');
  canvas.height = render_height;
  canvas.width = render_width;
  document.body.appendChild(canvas);

  // Create an image and draw the SVG onto the canvas
  var image = new Image;
  image.onload = function() {
    canvas.getContext('2d').drawImage(this, 0, 0, render_width, render_height);
  };
  image.src = 'data:image/svg+xml;base64,' + window.btoa(svg);
}
{% endhighlight %}

NOTE: Since we typically want to download a chart in a higher resolution than it's displayed on the page,
we use EXPORT_WIDTH to control the size of the exported image.

See [JSFiddle demo](http://jsfiddle.net/willkoehler/1p81fbzs/)

## 3. Use `toDataURL` to extract the canvas contents as an image

The canvas element has a handy function `toDataURL` that extracts its content as an image.
`toDataURL` returns a [data URI](https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs) with
the image encoded in base64. This URI can then be downloaded as an image to the user's computer.

{% highlight javascript %}
var data = canvas.toDataURL("image/png")
download(data, filename + '.png')  // (still need to define this)
{% endhighlight %}

NOTE: We don't need to to add the canvas element to the DOM in order to render and extract the
image data. So we can remove `document.body.appendChild(canvas)`.

## 4. Save the image to the local filesystem

This is where things get a little hacky. There is no standard way to save data to the user's
local filesystem. The most widely used technique is to create an `<a>` tag and then send
it a click event.

The `download` attribute of the `<a>` tag tells the browser to present the target (our chart
image) as a downloadable file with a given filename. Pretty nice, but it's currently only
supported in Chrome and Firefox. Other browsers will just open the image in the current window
instead of presenting it as a download. Not ideal, but it's the best we can do for now.

{% highlight javascript %}
function download(data, filename) {
  var a = document.createElement('a');
  a.download = filename;
  a.href = data
  document.body.appendChild(a);
  a.click();
  a.remove();
}
{% endhighlight %}

And that's everything. See this [JSFiddle demo](http://jsfiddle.net/willkoehler/hc6aa7yg/)
for the complete code.

## Not quite so fast

So everything looks good... except it doesn't work in IE. The first problem is that IE throws a
"SecurityError" on the call to `toDataURL`. This is because IE considers the canvas to be
"tainted" once an SVG image has been rendered. SVG code can reference content from the user's
local file system. Once that's in the canvas element it would be security vulnerability
to allow the canvas contents to be extracted. Otherwise a malicious site could read data from
the user's file system and send it on to an external server.

[This forum message](https://connect.microsoft.com/IE/feedback/details/809823/draw-svg-image-on-canvas-context)
is the only reference I can find discussing the issue in IE. Either Chrome, Firefox, and Safari have
ways of sanitizing SVG content before rendering onto a canvas, or they don't allow SVG code to
reference local content, or they are not concerned about this vulnerability.

## IE work-around #1: use canvg

We can work-around the canvas tainting issue with the [canvg library](https://github.com/gabelerner/canvg).
canvg is a full SVG parser and renderer. It can render SVG onto a canvas element with all of the features
of the browser's built-in SVG render. It's an impressive piece of code, and works flawlessly. But it's
also 2800 lines of javascript that are entirely unnecessary in any modern browser, because the browser
itself can render SVG onto a canvas element. However, because canvg parses the SVG code by hand, manually
rendering each path, box, quadratic curve, gradient, pattern etc. it sidesteps the IE "SecurityError".

Replace the `var image = new Image...` code with this:


{% highlight javascript %}
canvg(canvas, svg, {
  scaleWidth: render_width,
  scaleHeight: render_height,
  ignoreDimensions: true
});

var data = canvas.toDataURL("image/png")
download(data, filename + '.png');
{% endhighlight %}

## Still not working... URL limit

With the "SecurityError" fix in place, we hit the next barrier. IE stops with the error
"The data area passed to a system call is too small" on the call to `a.click()`. I *think*
this is because IE has a [2083 character URL limit](http://support.microsoft.com/kb/208427).
The data URIs generated by `toDataURL` are much longer than 2083 characters.

## IE work-around #2: use `msSaveOrOpenBlob`

I'm calling this a work-around. But it's actually an improvement over the `<a>` tag hack.
IE has a function [msSaveOrOpenBlob](http://msdn.microsoft.com/en-us/library/ie/hh779016(v=vs.85).aspx)
that presents client-side data to the user as if it were downloaded from the internet. It's
exactly what we need. Let's add logic to use `msSaveOrOpenBlob` in IE and use the `<a>` tag hack everywhere else.

{% highlight javascript %}
function download(canvas, filename) {
  download_in_ie(canvas, filename) || download_with_link(canvas, filename);
}

// Works in IE10 and newer
function download_in_ie(canvas, filename) {
  return(navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob(canvas.msToBlob(), filename));
}

// Works in Chrome and FF. Safari just opens image in current window, since
// .download attribute is not supported
function download_with_link(canvas, filename) {
  var a = document.createElement('a')
  a.download = filename
  a.href = canvas.toDataURL("image/png")
  document.body.appendChild(a);
  a.click();
  a.remove();
}
{% endhighlight %}


Here's the [JSFiddle demo](http://jsfiddle.net/willkoehler/vushe780/) putting it all together.

## Wrapping up

It took a while to get here, but the final solution isn't bad. My main reservation is pulling in
canvg. But it's a stable library and seems like a necessary tradeoff for IE support.

A few other libraries that I tested along the way:

[FileSaver.js](https://github.com/eligrey/FileSaver.js/) - If you want a fully-supported,
cross-browser "just save it" solution, this is a good library. At its core, FileSaver.js uses
the same `<a>` tag hack I used above. But FileSaver.js has a lot of additional complexity
to handle edge cases that I didn't feel was needed for this situation. I ultimately decided
not to use it. But it's a solid library and Eli Grey has put a lot of work into making it work
flawlessly. Definitely work a look.

[canvas-toBlob.js](https://github.com/eligrey/canvas-toBlob.js) - If you use FileSaver.js, you will
need this library to pull the blob data out of the canvas element. It implements the standard
[canvas.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement.toBlob)
function for browsers that don't support it yet. It's another solid piece of code by Eli Grey.