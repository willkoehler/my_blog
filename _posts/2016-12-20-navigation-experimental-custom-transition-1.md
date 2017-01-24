---
layout: post
last-modified: '2016-12-20'

title: "NavigationExperimental: Custom Transitions (1)"
#cover_image: "navigation-custom-transition/ski-lift.jpg"

excerpt: "Blog series: creating custom transitions using NavigationExperimental. This post covers an overview of NavigationCardStack."

author:
  name: Linton Ye
  twitter: lintonye
  bio: Freelance full-stack developer in BC Canada (GMT-8). Android, React Native, Node.js, MongoDB, PostgreSQL. <a href="mailto:linton@jimulabs.com">Hire me.</a>
  image: linton.jpg
---
*This is a series of posts about how to create custom transition "views" using the `Transitioner` in [React Navigation](https://reactnavigation.org/) (based on “NavigationExperiemental”):*

- *An overview of Transitioner and CardStack (this post)*
- *[Simple transitions: cross fade and Android default](/2016/12/22/navigation-experimental-custom-transition-2.html)*
- *[Shared element transition 1/2](/2017/01/23/react-navigation-shared-element-transition-1.html)*
- *Shared element transition 2/2 (coming soon)*

---

[NavigationExperimental](https://facebook.github.io/react-native/docs/navigation.html#navigationexperimental) provides great support for custom transition animations. Do you want to create transitions like the following? This series of posts is for you!

<div style="display:flex; flex-direction:row;">
  <!-- crossFade -->
  <div class="fivecol" style="float:none; margin-bottom:20px; ">
  <iframe width="282" height="500" src="//www.youtube.com/embed/6_BGrOQQlko?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
  </div>

  <!-- androidDefault -->
  <div class="fivecol" style="float:none; margin-bottom:20px; margin-left:10px;">
  <iframe width="282" height="500" src="//www.youtube.com/embed/oVwq1QDcnOw?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
  </div>

  <!-- materialSharedElement -->
  <div class="fivecol" style="float:none; margin-bottom:20px; margin-left:10px;">
  <iframe width="282" height="500" src="//www.youtube.com/embed/efPFJkxa-BQ?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
  </div>
</div>


Before jumping into it though, let's first study the built-in container `NavigationCardStack` and see how its transition is implemented. If you are not familiar with `NavigationCardStack`, see [my previous post](/2016/06/23/navigation-examples-1.html) for a simple tutorial on how to use it.

# `NavigationCardStack` in a nutshell

With `NavigationCardStack`, screens are arranged in a virtual stack of cards. When a new card is brought into the scene, it slides in from either the right or bottom edge of the screen. When it leaves the scene, it slides back to its origin.

<div class="fivecol" style="float:none; margin-bottom:20px;">
<iframe width="282" height="500" src="//www.youtube.com/embed/0e8Irs4gi3M?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
</div>

 How does it work? I dug into its source code and here's what I've found in a nutshell:

- The `Animated` library is the backbone of transition animations.
- `NavigationCardStack` is backed by `NavigationTransitioner`.
- `NavigationTransitioner` creates and passes along two generic values that describe the transition state: `position` and `progress`.
- `NavigationCardStack` converts these values to the actual visual style properties of the incoming and outgoing screens.

Let's unfold the whole process one step at a time.

# A premier on `Animated`
`Animated` is a powerful animation library. As mentioned in the [official document](https://facebook.github.io/react-native/docs/animated.html), it "focuses on declarative relationship between inputs and outputs", like so:

{% highlight javascript %}
const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
});
{% endhighlight %}

Here, `progress` is an "`Animated.Value`" that represents a generic, high-level state that changes over time. We can then map (interpolate) this value to an actual visual style property (such as `rotate`).

Whenever the original value changes, the visual style is updated accordingly. You just need to "wire" the animated values together (defining the mapping), and the rest is taken care of automatically. All this happens without going through the standard, setState-diff-render cycle in React. This removes a lot of overhead to ensure the smoothness of our animations.

`Animated` can be typically used this way:

- Create an `Animated.Value` and start the animation when appropriate. This code typically lives in upstream where we just care about a generic state and want to delegate the actual rendering to downstream. `NavigationTransitioner` is a good example of this (we'll come back to it later).

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
- Use the visual style properties created above in a `Animated.View` (or `Animated.Text`, `Animated.Image` etc.) to render the component:

   {% highlight jsx %}
const style = { transform: [{ rotate }]};
return <Animated.View style={ style }> ... </Animated.View>;
   {% endhighlight %}

The code above will create a view that spins for 500 milliseconds (the default duration).

Of course, I've only scratched the surface of `Animated` here. For more details, I'd recommend you to watch [this talk](https://www.youtube.com/watch?v=xDlfrcM6YBk&t=1333s) to see what's possible, read through the [official document](https://facebook.github.io/react-native/docs/animated.html), and check out [this tutorial](https://medium.com/react-native-training/react-native-animations-using-the-animated-api-ebe8e0669fae#.p1ngzm78r).

# `CardStack` and `Transitioner`
Now that we know `Animated`, it's time to dig into the source code of `NavigationCardStack`!

There will be more code than talking from now on. My goal is to provide a guided tour for the source code to make it easier to understand. Only relevant code is shown and the rest are "`....`". It'd perhaps be useful to open the full source on another screen when reading this post.

{% highlight jsx %}
class NavigationCardStack extends React.Component<DefaultProps, Props, void> {
  ....
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
}
{% endhighlight %}

So a `NavigationCardStack` is bascially a `NavigationTransitioner`. Let's follow along:

{% highlight jsx %}
class NavigationTransitioner extends React.Component<any, Props, State> {
  ....
  constructor(props: Props, context: any) {
    ....
    this.state = {
      ....
      position: new Animated.Value(this.props.navigationState.index),
      progress: new Animated.Value(1),
    };
    ....
  }

  componentWillReceiveProps(nextProps: Props): void {
    ....
    progress.setValue(0);

    const animations = [
      timing(
        progress,
        {
          ...transitionSpec,
          toValue: 1,
        },
      ),
    ];

    if (nextProps.navigationState.index !== this.props.navigationState.index) {
      animations.push(
        timing(
          position,
          {
            ...transitionSpec,
            toValue: nextProps.navigationState.index,
          },
        ),
      );
    }

    // update scenes and play the transition
    this.setState(nextState, () => {
      ....
      Animated.parallel(animations).start(this._onTransitionEnd);
    });
  }
  ....
}
{% endhighlight %}

We see that two `Animated.Value`'s are created: `position` and `progress`. `progress` simply goes from `0` to `1` whereas `position` goes from the previous index to the next index of the navigation state. These two values are being animated in parallel. If the index does not change, then only `progress` will be animated.

When it's time to render, `NavigationTransitioner` simply delegates to the `render()` function in props:

{% highlight jsx %}
render(): React.Element<any> {
  return (
    <View ...>
      {this.props.render(this._transitionProps, this._prevTransitionProps)}
    </View>
  );
}
{% endhighlight %}

The two `Animated.Value`'s, `position` and `progress`, are passed to `render()`, as a part of the two parameters `_transitionProps` and  `_prevTransitionProps`. Here's how the `transitionProps` are constructed:

{% highlight jsx %}
...
  this._transitionProps = buildTransitionProps(this.props, nextState);
...
function buildTransitionProps(
  props: Props,
  state: State,
): NavigationTransitionProps {
  ...
  const {
    position,
    progress,
    ...
  } = state;

  return {
    position,
    progress,
    ...
  };
}
{% endhighlight %}

Why do we pass `position` and `progress` to the `props.render` method? Let the implementor of `props.render` create the actual animations!

# Interpolating `position`

Do you still remember how `Animated` works? We'll need an `Animated.View` whose `style` prop is an `Animated.Value`.

It's safe to guess that there must be something like `position.interpolate()` in `NavigationCardStack` when it renders the view. Let's track it down:

{% highlight jsx %}
class NavigationCardStack extends React.Component<DefaultProps, Props, void> {
  ...
  _renderScene(props: NavigationSceneRendererProps): React.Element<any> {
    const isVertical = this.props.direction === 'vertical';

    const style = isVertical ?
      NavigationCardStackStyleInterpolator.forVertical(props) :
      NavigationCardStackStyleInterpolator.forHorizontal(props);

    ...
    return (
      <NavigationCard ...
        style={[style, this.props.cardStyle]}
      />
    );
  }
}

class NavigationCard extends React.Component<any, Props, any> {
  ....
  render(): React.Element<any> {
    ....
    return (
      <Animated.View
        style={[styles.main, viewStyle]}>
        {renderScene(props)}
      </Animated.View>
    );
  }
}
{% endhighlight %}

Each scene is rendered as a `NavigationCard`, which is eventually rendered as an `Animated.View`.  Bingo!

Who creates the style for the `NavigationCard`? It's `NavigationCardStackStyleInterpolator.forVertical()` (or `forHorizontal`)!

We can then find the secrete sauce that maps (interpolates) `position` to the location, scale and opacity of the cards. Let's take a quick glance:

{% highlight javascript %}
// NavigationCardStackStyleInterpolator.js

function forHorizontal(props: NavigationSceneRendererProps): Object {
  const {
    position,
    ....
  } = props;

  ....
  const index = scene.index;
  const inputRange = [index - 1, index, index + 0.99, index + 1];
  const width = layout.initWidth;
  const outputRange = I18nManager.isRTL ?
    ([-width, 0, 10, 10]: Array<number>) :
    ([width, 0, -10, -10]: Array<number>);


  const opacity = position.interpolate({
    inputRange,
    outputRange: ([1, 1, 0.3, 0]: Array<number>),
  });

  const scale = position.interpolate({
    inputRange,
    outputRange: ([1, 1, 0.95, 0.95]: Array<number>),
  });

  const translateY = 0;
  const translateX = position.interpolate({
    inputRange,
    outputRange,
  });

  return {
    opacity,
    transform: [
      { scale },
      { translateX },
      { translateY },
    ],
  };
}
{% endhighlight %}

We can see that `opacity`, `scale` and `translateX` are all interpolations of `position` -- they'll change as `position` changes. This effectively creates the sliding card animation that we've seen earlier.

You probably have questions about how the input/output ranges are set up in this function, but let's leave them to the [next post](/2016/12/22/navigation-experimental-custom-transition-2.html), where we'll also start creating our own transitions soon!

# Summary
Just to repeat a few key points on how the transition animation works in the built-in `NavigationCardStack`:

- The `Animated` library is the backbone of transition animations.
- `NavigationCardStack` is backed by `NavigationTransitioner`.
- `NavigationTransitioner` creates and passes along two `Animated.Value`'s that describe the transition state: `position` and `progress`.
- `NavigationCardStack` converts these values to `translateX`, `opacity` and `scale` properties of the incoming and outgoing screens.

Feel free to ask me questions in the comments below, or suggest topics that you'd like me to write about in future posts. Have a great day!
