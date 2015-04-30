---
layout: post
last-modified: '2014-10-17T12:00:00-04:00'

title: "Save 50 Hours Setting up Your Jekyll Blog"
subtitle: "Spoiler: Just fork mine."
cover_image: overbrook-ravine-in-clintonville.jpg
cover_image_caption: "Overbrook ravine in Clintonville. Photo: Will Koehler"

excerpt: "Being a perfectionist I knew that I wouldn't be able to resist tinkering with every detail of my
          new Jekyll blog. I spent 50 hours perfecting my blog, so you don't have to."

author:
  name: Will Koehler
  twitter: wckoehler
  bio: Web developer specializing in full-stack Rails applications.
  image: wk.jpg
---
When I decided to start blogging, I explored all the major blogging platforms. I quickly came to the conclusion
that, in order to get exactly what I wanted, I would need to have full control of the design and code.

As a Ruby developer, [Jekyll](http://jekyllrb.com) was a natural choice. Jekyll is a static site generator that's
"blogging aware". "Blogging aware" means that Jekyll has conventions for managing your blog posts. You put all your
posts in the `_posts/` folder. Jekyll generates pages for them and gives you template variables to index through
the pages.

In addition to supporting blogs out of the box, Jekyll had everything else I wanted:

- Good [themes](http://jekyllthemes.org)
- Support for source-code highlighting
- Posts can be written in [Markdown](http://daringfireball.net/projects/markdown/syntax)
- Easy [integration](https://help.github.com/articles/using-jekyll-with-pages) with Github pages (free hosting!)
- Support for layouts, partials, and other features that make it a pleasure to use.
- Easy to get your head around the entire site. No magic. Nothing is hidden.

## Jekyll Incorporated Theme

The next thing I needed was a theme. I quickly settled on [Jekyll Incorporated](http://incorporated.sendtoinc.com).
It's clean, simple, and very "Medium-like". Thanks [Kippt, Inc.](https://sendtoinc.com/) for sharing this awesome theme
with the community.

Jekyll Incorporated was built to be easily customized via `config.yml` and `main.css`. So I thought I would
just fork the theme and customize it for my needs. It would be easy, right?

In theory that was probably right. But I noticed a few minor problems with the responsive design of the
theme. The blog cover images weren't resizing nicely as they were in the demo site. I realized that this was
because Kippt had made improvements to their blog after open-sourcing the theme.

## Improving on Jekyll Incorporated Theme

I figured I would fix the cover images and then start writing posts. But that one fix revealed other
issues in the code. One change led to another. I ended up making 40 commits in all. To make this harder
on myself, I didn't just tear into the code. I made all the changes in a way that could be merged back
upstream, preserving the design and original intent of the theme.

None of this is to take away from the original work Kippt, Inc put into the theme. They created an awesome
foundation for me to build on. There's no way I could have done this on my own.

### Remove Bootstrap.css

I noticed that the theme included `bootstrap.scss`, containing all of Twitter Bootstrap. But none of the
Bootstrap features like the grid, forms, or typography were being used. `bootstrap.scss` was only
providing a CSS reset (a cross-browser foundation to build the rest of the css on top of) and a few scattered,
random styles.

To fix this, I pulled in my favorite css reset: [normalize.css](http://necolas.github.io/normalize.css/). I
then methodically went through bootstrap.scss, commenting out chunks, and looking for rules that were
still being used by comparing the before and after pages in two browser tabs.

When I was done, I removed `bootstrap.scss` and moved the rules that were still being using into into `base.scss`.
Below are the rules I needed to save


{% highlight css %}
// Use border-box sizing for everything.
*,
*:before,
*:after {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

body {
  ... (other stuff that was already in base.scss)
  line-height: 1.428571429;
}

img {
  vertical-align: middle;
}

p {
  margin: 0 0 10px;
}

 h1, h2, h3, h4, h5 {
  ... (other stuff that was already in base.scss)
  line-height: 1.1;
}
{% endhighlight %}

The net change was 1647 lines of css removed. Here's [the commit](https://github.com/willkoehler/my_blog/commit/460ca42a011c075d0fc2d63f86cc6940dac3d4ca#diff-1003e390ef395b0f33d4f1a90fb9e6c6R42)

### Improve source-code highlighting

Out of the box, Jekyll supports source-code highlighting using [pygments](http://pygments.org).
You don't need to know anything about pygments. Wrap your source code in `highlight` tags and
it "just works".

{% highlight liquid %}
{% raw %} 
{% highlight ruby linenos %}
class User < ActiveRecord::Base
  # Wow this Ruby source code highlighting looks great!
  has_many :user_assignments, :dependent => :destroy
  has_many :hospitals, :through => :user_assignments
end
{% endhighlight %}
{% endraw %} 
{% endhighlight %}

Is rendered as

{% highlight ruby linenos %}
class User < ActiveRecord::Base
  # Wow this Ruby source code highlighting looks great!
  has_many :user_assignments, :dependent => :destroy
  has_many :hospitals, :through => :user_assignments
end
{% endhighlight %}

The theme already included Github's syntax highlighting stylesheet:
[syntax.css](http://jekyllrb.com/docs/templates/#stylesheets-for-syntax-highlighting).
I added a few rules to clean up the look and prevent long lines from wrapping.

Before improvements

<div class='before_syntax_fixes'>
{% highlight ruby linenos %}
class User < ActiveRecord::Base
  has_many :user_assignments, :dependent => :destroy
  has_many :hospitals, :through => :user_assignments
 
  # Ugly, but 5x faster than op2 and op3
  # Takes 2ms
  scope :grid_fields, -> { joins('LEFT JOIN user_assignments ON user_id = users.id LEFT JOIN hospitals ON hospitals.id = hospital_id').
                           group('users.id').select([:id, :name, :email, :role, 'min(hospitals.name) as first_hospital_name']) }
end
{% endhighlight %}
</div>

After improvements

{% highlight ruby linenos %}
class User < ActiveRecord::Base
  has_many :user_assignments, :dependent => :destroy
  has_many :hospitals, :through => :user_assignments
 
  # Ugly, but 5x faster than op2 and op3
  # Takes 2ms
  scope :grid_fields, -> { joins('LEFT JOIN user_assignments ON user_id = users.id LEFT JOIN hospitals ON hospitals.id = hospital_id').
                           group('users.id').select([:id, :name, :email, :role, 'min(hospitals.name) as first_hospital_name']) }
end
{% endhighlight %}

Thanks [Dmitri Moore](http://demisx.github.io/jekyll/2014/01/13/improve-code-highlighting-in-jekyll.html)
for the ideas. Here's [the commit](https://github.com/willkoehler/my_blog/commit/198b31ea605fdc959ba23114f9292bddc939b9a7)

### Clean up config.yml

My philosophy on code and config is: the less the better. I went through config.yml line by line, referencing
the Jekyll documentation and Googling information as needed. Almost everything could go. Most of the config
items were simply re-stating Jekyll's defaults. I also removed references to alternative markdown parsers,
such as rdiscount, maruku, and redcarpet. Jekyll defaults to Kramdown for parsing markdown. Unless you're
doing something really specialized, there's no need to deviate from this default.

The net change was 56 lines of config removed (the remaining config was almost all theme-specific)

Here's [the commit](https://github.com/willkoehler/my_blog/commit/f7ea94058a797b969724dd35bb0a75ce829fcc7e)

### Fix feed.xml

I don't know much about RSS. I don't even know if anyone will use it. But since RSS was already in
the theme, I decided to keep it and fix it. Most of the fixes were obvious. I used the
[W3C Feed Validation Service](http://validator.w3.org/feed/) to check the feed and Googled the errors
I couldn't figure out on my own.

Here's [the commit](https://github.com/willkoehler/my_blog/commit/1aa854cea9e856d7c07c58c3e0be5dbfe51b939a).
Update: I've made [more changes](https://github.com/willkoehler/my_blog/commit/2d8cfb7629cde63dc31a8bbbb11d9e5e62b90d18).

### Add Github icon

I wanted to have a link to my Github profile in the social icons. The hard work was already done for me
by [@vdragsic](https://github.com/kippt/jekyll-incorporated/pull/17). I tweaked the icon size to make
it easier to see. This led to some weird rendering behavior and strange css that had to be cleaned up.

Before tweaks. Notice Github icon is small and not immediately recognizable. All social icons are too low.

<img src="{{site.url}}/images/social-icons-before-tweaks.png" alt="Social icons before tweaks" style="width:239px;"/>

After tweaks.

<img src="{{site.url}}/images/social-icons-after-tweaks.png" alt="Social icons after tweaks" style="width:239px;"/>

I broke this change into two commits: [Add Github icon](https://github.com/willkoehler/my_blog/commit/f461bd5dec11bfe12c6fbb6cd79eaf12af690219)
and [Tweak styling](https://github.com/willkoehler/my_blog/commit/9604230187353995e81db3fda21e289c63661023).

### Remove unused css rules

I went through and cleaned up all the unused css rules. Unused rules add to page weight and, more importantly,
add to the cognitive load reading the css.

Tracking down the unused rules wasn't hard. Since I wanted a better understanding of the css,
I did it by hand. I searched for each rule in the css, deleted the ones that weren't used in the HTML,
making sure I didn't break anything along the way.

These changes are in two commits:
[Commit 1](https://github.com/willkoehler/my_blog/commit/00ff93d79cffd6b8291de335b8a850cf65bbcd3e) and
[Commit 2](https://github.com/willkoehler/my_blog/commit/86e17a527661910e6a52924df9c620bd1b2a3b7b)

### Much more...

There are a lot more fixes and refinements. You can see all the detail in the [open_source branch](https://github.com/willkoehler/my_blog/commits/open_source).
Feel free to use this as a starting point for your blog. Maybe the changes will be merged back into
Jekyll Incorporated. I submitted a [pull request](https://github.com/kippt/jekyll-incorporated/pull/24). But it's a lot of
changes to merge back upstream.

## Development continues

In the meantime, I've moved ahead with my blog and have started making non-compatible changes to customize
the theme for my needs. These include more css fixes and design refinements. If it's something that looks useful,
feel free to fork the [master branch](https://github.com/willkoehler/my_blog) to get the latest.

## Additional resources

Mike Greiling has some great articles on Jekyll on his blog (PixelCog).

[Jekyll From Scratch - Getting Started](http://pixelcog.com/blog/2013/jekyll-from-scratch-introduction/)<br>
[Jekyll From Scratch - Core Architecture](http://pixelcog.com/blog/2013/jekyll-from-scratch-core-architecture/)<br>
[Jekyll From Scratch - Extending Jekyll](http://pixelcog.com/blog/2013/jekyll-from-scratch-extending-jekyll/)

<!-- styles to demo source-code highlighting before fixes -->
<style>
  .before_syntax_fixes .highlight .lineno {
    color: #000;
    display: inline;
    padding: none;
    border: none
  }
  .before_syntax_fixes .highlight pre code {
    font-family: monospace, monospace;
    white-space: pre-wrap;
  }
</style>
