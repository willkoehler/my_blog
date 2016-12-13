---
layout: post
last-modified: '2016-12-10'

title: "NavigationExperimental: Custom Transitions (1)"
cover_image: "github-custom-domain/github-cover.JPG"

excerpt: "A series of posts about creating custom transitions using NavigationExperimental"

author:
  name: Linton Ye
  twitter: lintonye
  bio: Freelance full-stack developer in BC Canada (GMT-8). Android, React Native, Node.js, MongoDB, PostgreSQL. <a href="mailto:linton@jimulabs.com">Hire me.</a>
  image: linton.jpg
---

[NavigationExperimental](https://facebook.github.io/react-native/docs/navigation.html#navigationexperimental) provides great support for custom transition animations. Do you want to know how to create transitions like the following? This series of posts is for you!

[TODO: video for fading transition]
[TODO: video for rotation transition]
[TODO: video for shared element transition]


Before getting our hands dirty though, let's first study the built-in container `NavigationCardStack` and see how its transition is implemented. If you are not familiar with `NavigationCardStack`, see [my previous post](TODO) for a simple tutorial on how to use it.

# `NavigationCardStack` in a nutshell

With `NavigationCardStack`, screens are arranged in a virtual stack of cards. When a new card is brought into the scene, it slides in from either the right or bottom edge of the screen. When it leaves the scene, it slides back to its origin.

[TODO: NavigationCardStack video]

 How does it work? I dug into its source code and here's what I've found in a nutshell:

- The `Animated` library is the backbone of transition animations.
- `NavigationCardStack` is backed by `NavigationTransitioner`.
- `NavigationTransitioner` creates and passes along two generic values that describe the transition state: `position` and `progress`.
- `NavigationCardStack` converts these values to the actual visual style properties of the incoming and outgoing screens.

Let's unfold the whole process one step at a time.

# A premier on `Animated`
`Animated` is a powerful animation library. As mentioned in the [official document](TODO), it "focuses on declarative relationship between inputs and outputs", like so:

{% highlight javascript %}
const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
});
{% endhighlight %}

Here, `progress` is an "`Animated.Value`" that represents a generic, high-level state that changes over time. We can then map (interpolate) this value to an actual visual style property (such as `rotate`).

Whenever the original value changes, the visual style is updated accordingly. You just need to "wire" the animated values together (defining the mapping), and the rest is taken care of automatically. All this happens without going through the standard, setState-diff-render cycle in React. This removes a lot of overhead and ensures the performance of our animations.

`Animated` can be typically used this way:

- Create an `Animated.Value` and start the animation when appropriate. This code typically lives in upstream where we only know a generic state and want to delegate the actual rendering to downstream. `NavigationTransitioner` is a good example of this and we'll come back to it later.

   {% highlight javascript %}
   const progress = new Animated.Value(0);
   Animated.timing({ progress, { toValue: 1 }}).start();
   {% endhighlight %}

- Map the value created above to desired visual style properties, by calling `interpolate()`:

   {% highlight javascript %}
   const rotate = progress.interpolate({
       inputRange: [0, 1],
       outputRange: ['0deg', '360deg']
   });
   {% endhighlight %}
- Use the visual style properties created above in a `Animated.View` (or its siblings) to render the component:

   {% highlight jsx %}
   const style = { transform: [{ rotate }]};
   return <Animated.View style={ style }> ... </Animated.View>;
   {% endhighlight %}

The above code will create a view that spins for 500 milliseconds (the default duration).

Of course, I've only scratched the surface of `Animated` here. For more details, I'd recommend you to watch [this talk](TODO) to see what's possible, read through the official document, and check out [this tutorial](https://medium.com/react-native-training/react-native-animations-using-the-animated-api-ebe8e0669fae#.p1ngzm78r).

# `CardStack` and `Transitioner`
If you check out the source code of `NavigationCardStack`, you'll see this:

{% highlight jsx %}
render(): React.Element<any> {
  return (
    <NavigationTransitioner
      configureTransition={this._configureTransition}
      navigationState={this.props.navigationState}
      render={this._render}
      style={this.props.style}
    />
  );
}
{% endhighlight %}


- Animated talk
-
  - TODO: can we skip the interpolate step in the first example?
  - the 4th example: parallel is really not necessary. we can just use a single animated value
- http://browniefed.com/react-native-animation-book/
