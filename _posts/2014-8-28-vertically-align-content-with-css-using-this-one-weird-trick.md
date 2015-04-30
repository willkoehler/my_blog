---
layout: post
last-modified: '2014-09-01T12:00:00-04:00'
container_class: 'vaswc'

title: "Vertically Align Content With CSS Using This One Weird Trick"
subtitle: "Front-end devs will hate me for revealing the secret."
cover_image: horse-farm-on-chapman-rd-delaware-county.jpg
cover_image_caption: "Horse farm on Chapman Rd, Delaware County. Photo: Will Koehler"

excerpt: "There are three hard things in computer science: cache invalidation, naming things,
          and vertically aligning content with CSS."

author:
  name: Will Koehler
  twitter: wckoehler
  bio: Web developer specializing in full-stack Rails applications.
  image: wk.jpg
---
Phil Karlton famously said "there are only two hard things in computer science: cache invalidation
and naming things". I would add a third: vertically aligning content with CSS.

## The scenario

We want to vertically align variable height content within a wrapper div.

{% highlight css %}
.wrapper {
  height: 150px;
  border: 1px solid #CCC;
}

.content {
  display: inline-block;
  border: 1px solid #493ACC;
}
{% endhighlight %}

{% highlight html %}
<div class='wrapper'>
  <div class='content'>
    This should be<br>
    vertically centered
  </div>
  <div class='content'>
    Also this
  </div>
</div>
{% endhighlight %}

<div class='wrapper'>
  <div class='content'>
    This should be<br>
    vertically centered
  </div>
  <div class='content'>
    Also this
  </div>
</div>

## Just use vertical-align:middle?

Most people (myself included) expect that adding `vertical-align:middle` to the wrapper will
do this trick. But `vertical-align` doesn't set the alignment of content within a wrapper, it sets the
alignment of inline elements relative to each other.

Let's try some variations of `vertical-align` and see how it works.

{% highlight html %}
<span class='text big'>BIG text</span>
<span class='text small'>SMALL text</span>
{% endhighlight %}

{% highlight css %}
.text.big { font-size: 40px; }
.text.small { font-size: 18px; }

.text { vertical-align: baseline; }   /* this is the default */
{% endhighlight %}

<div class='boundary'>
  <span class='text big'>BIG text</span>
  <span class='text small'>SMALL text</span>
</div>

{% highlight css %}
.text { vertical-align: top; }
{% endhighlight %}

<div class='boundary'>
  <span class='text big' style='vertical-align:top'>BIG text</span>
  <span class='text small' style='vertical-align:top'>SMALL text</span>
</div>

{% highlight css %}
.text { vertical-align: bottom; }
{% endhighlight %}

<div class='boundary'>
  <span class='text big' style='vertical-align:bottom'>BIG text</span>
  <span class='text small' style='vertical-align:bottom'>SMALL text</span>
</div>

{% highlight css %}
.text { vertical-align: middle; }
{% endhighlight %}

<div class='boundary'>
  <span class='text big' style='vertical-align:middle'>BIG text</span>
  <span class='text small' style='vertical-align:middle'>SMALL text</span>
</div>

## Making vertical-align:middle work for you

Going back to the original scenario, instead of applying `vertical-align:middle` to the wrapper,
let's apply `vertical-align:middle` to the content. Seems counter-intuitive, but bear with me.

{% highlight css %}
.content {
  display: inline-block;
  border: 1px solid #493ACC;
  vertical-align: middle;
}
{% endhighlight %}

<div class='wrapper'>
  <div class='content' style='vertical-align:middle'>
    This should be<br>
    vertically centered
  </div>
  <div class='content' style='vertical-align:middle'>
    Also this
  </div>
</div>

We're getting closer. Let's add a third element with 100% height

{% highlight html %}
<div class='wrapper'>
  <div class='content' style='height:100%'>&nbsp;</div>
  <div class='content'>
    I would like this<br>
    to be vertically centered
  </div>
  <div class='content'>
    Also this
  </div>
</div>
{% endhighlight %}

<div class='wrapper'>
  <div class='content' style='vertical-align:middle;height:100%'>&nbsp;</div>
  <div class='content' style='vertical-align:middle'>
    This should be<br>
    vertically centered
  </div>
  <div class='content' style='vertical-align:middle'>
    Also this
  </div>
</div>

This is starting to look promising!

## Make CSS do the work for us

Manually adding a third element to vertically align things is a burden. So let's
have css do that for us with a `:before` pseudo element.

{% highlight css %}
.wrapper:before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  border: 1px solid red; /* so we can see what's going on */
}            
{% endhighlight %}


{% highlight html %}
<div class='wrapper'>
  <div class='content'>
    I would like this<br>
    to be vertically centered
  </div>
  <div class='content'>
    Also this
  </div>
</div>
{% endhighlight %}

<div class='wrapper with_centering visible_centering broken_wrapping'>
  <div class='content' style='vertical-align:middle'>
    This should be<br>
    vertically centered
  </div>
  <div class='content' style='vertical-align:middle'>
    Also this
  </div>
</div>

It's working! Now remove the red border from the pseudo element and... Voila

<div class='wrapper with_centering'>
  <div class='content' style='vertical-align:middle'>
    This should be<br>
    vertically centered
  </div>
  <div class='content' style='vertical-align:middle'>
    Also this
  </div>
</div>

## Edge cases

Well this is awesome. But you knew there would be edge cases right? Consider this scenario:

{% highlight html %}
<div class='wrapper'>
  <div class='content'>
    This text should wrap as needed
  </div>
</div>
{% endhighlight %}

<div class='wrapper with_centering'>
  <div class='content' style='vertical-align:middle'>
    This text should wrap as needed
  </div>
</div>

Your customer views the page on a small device, or resizes their browser and...

<div style='height: 250px'>
  <div class='wrapper with_centering broken_wrapping' style='width:200px'>
    <div class='content' style='vertical-align:middle'>
      This text should wrap as needed
    </div>
  </div>
</div>

What happened?? The text wraped, but the content dropped below the wrapper. Let's make
our before pseudo element visible again.

<div style='height: 250px'>
  <div class='wrapper with_centering broken_wrapping visible_centering' style='width:200px'>
    <div class='content' style='vertical-align:middle'>
      This text should wrap as needed
    </div>
  </div>
</div>

Now we can see what happened. The `:before` pseudo element is an inline-block element. So
it's getting wrapped as well. We can fix that with another trick. Add a negative right
margin to the `:before` pseudo element so the pseudo element doesn't take up any horizontal
space.

{% highlight css %}
.wrapper:before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  margin-right: -.35em;
}            
{% endhighlight %}

Now the text is wrapping like it should.

<div class='wrapper with_centering' style='width:200px'>
  <div class='content' style='vertical-align:middle'>
    This text should wrap as needed
  </div>
</div>

## All together now

{% highlight css %}
.wrapper {
  height: 150px;
  border: 1px solid #CCC;
}

.wrapper:before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  margin-right: -.35em;
}            

.content {
  display: inline-block;
  border: 1px solid #493ACC;
}
{% endhighlight %}

{% highlight html %}
<div class='wrapper'>
  <div class='content'>
    This should be<br>
    vertically centered
  </div>
  <div class='content'>
    Also this
  </div>
</div>
{% endhighlight %}

## Conclusion

I've used many tricks over the years to vertically align content. They all have tradeoffs. Some
add a lot of noise to the CSS. Others (like using `display:table-cell`) have side effects. I've just
recently discovered this trick, but I think it's going to be my new go-to solution. In terms of
compatibility, it works on all modern browsers + IE8.

Thanks to Chris Coyler for the [idea](http://css-tricks.com/centering-in-the-unknown/) and
Gary Turner for the [original work](http://gtwebdev.com/workshop/vcenter/vcenter-inline-css.php).


<!-- styles for this post -->
<style>
  .vaswc .wrapper {
    height: 150px;
    border: 1px solid #CCC;
    text-align: center;
    margin-bottom: 2em;
  }

  .vaswc .wrapper.with_centering:before {
    content: '';
    display: inline-block;
    height: 100%;
    vertical-align: middle;
    margin-right: -.35em;
  }            

  .vaswc .wrapper.with_centering.visible_centering:before {
    border: 1px solid red;
  }            

  .vaswc .wrapper.with_centering.broken_wrapping:before {
    margin-right: 0em;
  }            

  .vaswc .content {
    display: inline-block;
    border: 1px solid #493ACC;
    text-align: center;
    padding: 10px;
  }

  .vaswc .boundary {
    border: 1px solid #CCC;
    padding: 0 15px;
    margin-bottom: 2em;
  }
  
  .vaswc .text {
    color: #666;
    vertical-align: baseline;
  }
  
  .vaswc .text.big {
    font-size: 2.3em;
    margin-right: 10px;
  }

  .vaswc .text.small {
    font-size: 1em;
  }
</style>
