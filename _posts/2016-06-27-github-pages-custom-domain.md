---
layout: post
last-modified: '2016-06-27'

title: "Custom Domains with GitHub Pages"
cover_image: "github-custom-domain/github-cover.JPG"

excerpt: "A sane step-by-step guide on using custom domains with GitHub Pages"

author:
  name: Linton Ye
  twitter: lintonye
  bio: Founder of jimu Labs. Full-stack developer, toolsmith, UI designer, entrepreneur and lifelong learner.
  image: linton.jpg
---

This post is about setting up custom domain names when your site is hosted on GitHub Pages. It's apparently off-topic on a blog about React Native but I was just surprised by the lack of proper step-by-step guides even on GitHub itself.

## The Goal
1. Host a website (e.g. this blog) on GitHub Pages (well, it's free and working great, who can resist that!).
2. Instead of the `github.io` domain, I'd like to use my own domain name: `reactnativediary.com`
3. By default, I'd like to use the `www` subdomain and redirect the "naked" domain to the `www` subdomain, that is: `http://reactnativediary.com ==> http://www.reactnativediary.com`. This is because GitHub strongly recommends the use of `www` subdomain:

> - It gives your GitHub Pages site the benefit of our Content Delivery Network.
> - It is more stable because it is not affected by changes to the IP addresses of GitHub's servers.
> - Pages will load significantly faster because Denial of Service attack protection can be implemented more efficiently.

## Steps
Below I'm going to use this blog `reactnativediary.com` as an example, but of course you can replace it with the info and domain of your own site:

1. First of all, create a public repo on GitHub named `react-native-diary-blog`. On its `gh-pages` branch, make sure all the site content is there.
2. On `gh-pages` branch, create a file named `CNAME` with only one line `www.reactnativediary.com`. Note, this file can only include one domain, don't put multiple domain names here. If you'd like to support multiple domains, you probably want to set up 301 redirects on other domains.
3. On your DNS provider's site, create a `CNAME` record:
{% highlight text %}
www ==> lintonye.github.io
{% endhighlight %}
Of course, the value of your record should be `YOUR-GITHUB-USERNAME.github.io`. See more details [here](https://help.github.com/articles/setting-up-a-www-subdomain/#configuring-a-cname-record-with-your-dns-provider).

4\. On your DNS provider's site, create two `A` records for both `www` and `reactnativediary.com`:

{% highlight text %}
www                        192.30.252.153
www                        192.30.252.154
reactnativediary.com       192.30.252.153
reactnativediary.com       192.30.252.154
{% endhighlight %}

NOTE: If your DNS provider supports `ALIAS` or `ANAME` records instead of `A` records, see [GitHub's doc] for details. I don't personally have any experience in this yet.

It'll take a while (in my case a couple of hours) for the DNS setting to take effect. When everything is set up properly, you should be able to see this in the repo's settings:

![github-settings](/images/github-custom-domain/github-settings.png)

## Conclusion
This is it. After this setup, GitHub should be able to automatically redirect the "naked" domain (`reactnativediary.com`) to the `www` subdomain. Hopefully you'll find it more useful than GitHub's [this](https://help.github.com/articles/setting-up-an-apex-domain/), [this](https://help.github.com/articles/setting-up-a-www-subdomain/), or [this](https://help.github.com/articles/using-a-custom-domain-with-github-pages/) pages.
