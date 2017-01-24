---
layout: post
last-modified: '2016-12-22'

title: "NavigationExperimental: Custom Transitions (2)"
#subtitle: "A series of posts about creating custom transitions using NavigationExperimental."
#cover_image: "navigation-custom-transition/transit.jpg"

excerpt: "Blog series: creating custom transitions using NavigationExperimental. This post covers inputRange and a couple of simple custom transitions."

author:
  name: Linton Ye
  twitter: lintonye
  bio: Freelance full-stack developer in BC Canada (GMT-8). Android, React Native, Node.js, MongoDB, PostgreSQL. <a href="mailto:linton@jimulabs.com">Hire me.</a>
  image: linton.jpg
---

*This is a series of posts about how to create custom transition "views" using the `Transitioner` in [React Navigation](https://reactnavigation.org/) (based on “NavigationExperiemental”):*

- *[An overview of Transitioner and CardStack](/2016/12/20/navigation-experimental-custom-transition-1.html)*
- *Simple transitions: cross fade and Android default (this post)*
- *[Shared element transition 1/2](/2017/01/23/react-navigation-shared-element-transition-1.html)*
- *Shared element transition 2/2 (coming soon)*

---

In the [previous post](/2016/12/20/navigation-experimental-custom-transition-1.html), we covered how the transition animations in `NavigationCardStack` work: the `NavigationTransitioner` creates two `AnimatedValue`s, `position` and `progress`, which are then passed to `CardStack` and "interpolated" into style properties such as `scaleX`, `translateX` and `opacity`.

In this post, we'll take a closer look at how the `inputRange` and `outputRange` are set up in `CardStack` when interpolating the `AnimatedValue`s. We'll also apply what we learn to create a couple of simple transitions:

<div style="display:flex; flex-direction:row;">
  <!-- crossFade -->
  <div class="fivecol" style="float:none; margin-bottom:20px; ">
  <iframe width="282" height="500" src="//www.youtube.com/embed/6_BGrOQQlko?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
  </div>

  <!-- androidDefault -->
  <div class="fivecol" style="float:none; margin-bottom:20px; margin-left:10px;">
  <iframe width="282" height="500" src="//www.youtube.com/embed/oVwq1QDcnOw?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
  </div>

</div>

# `scene.index` and `inputRange`
The default "card stack" transition looks like this:

<div class="fivecol" style="float:none; margin-bottom:20px;">
<iframe width="282" height="500" src="//www.youtube.com/embed/cx4MmOV0_M0?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
</div>

Before diving into the code of `CardStack`, let's imagine how we'd implement this ourselves. We'll use `opacity` as an example.

If we observe closely, we'll notice that when the photo detail screen moves in, the photo grid screen becomes dimmer and dimmer until totally invisible, whereas the photo detail screen remains opaque.

![cardStack seq](/images/navigation-custom-transition/cardStack-seq.png)

Remember the `AnimateValue` **`position`**? It represents the changing index of the scene during the transition. When it transits from the index of photo grid to the index of photo detail, we shall change the opacity of the grid from 1 to 0, and vice versa. Therefore:

{% highlight javascript %}
// photo grid
const opacityForGrid = position.interpolate({
  inputRange: [indexOfGrid, indexOfDetail],
  outputRange: [1, 0],
});

// photo detail
const opacityForDetail = position.interpolate({
  inputRange: [indexOfGrid, indexOfDetail],
  outputRange: [1, 1],
});
{% endhighlight %}

The question is how to figure out `indexOfGrid` and `indexOfDetail`. Let's keep going.

If we check out `NavigationCardStack`, we'll see that `_renderScene()` is called with every scene available:

{% highlight jsx %}
const scenes = props.scenes.map(
 scene => this._renderScene({
   ...props,
   scene,
 })
);
{% endhighlight %}

This means that in `_renderScene()` we know the index of the current scene being rendered:

{% highlight jsx %}
_renderScene(props: NavigationSceneTransitionProps) {
  const scene = props.scene;
  const index = scene.index;
  ....
}
{% endhighlight %}

But how do we know whether this `index` is `indexOfGrid` or `indexOfDetail`? There is a small trick here. We know that `indexOfDetail` is always `indexOfGrid + 1`, so:

- if `index === indexOfGrid`, then `indexOfDetail = index + 1`
- if `index === indexOfDetail`, then  `indexOfGrid = index - 1`

Using this, we can merge our previous `opacityForGrid` and `opacityForDetail` into a single `opacity` which can be used to render all the scenes, no matter if it's the photo grid or detail. Isn't it beautiful?

![opacity code](/images/navigation-custom-transition/opacities.png)

As a recap, here's the complete code:

{% highlight jsx %}
// NavigationCardStack.js

class NavigationCardStack extends React.Component<DefaultProps, Props, void> {
  ....
  _render(props: NavigationTransitionProps): React.Element<any> {
    ....
    const scenes = props.scenes.map(
     scene => this._renderScene({
       ...props,
       scene,
     })
    );

    return (
        <View .... >
          {scenes}
        </View>
    );
  }
  _renderScene(props: NavigationSceneTransitionProps) {
    ....
    const style = NavigationCardStackStyleInterpolator.forHorizontal(props);
    ....
  }
}

// NavigationCardStackStyleInterpolator.js

function forHorizontal(props: NavigationSceneRendererProps): Object {
  const {
    position,
    ....
  } = props;
  ....
  const index = scene.index;
  const inputRange = [index - 1, index, index + 0.99, index + 1];
  ....
  const opacity = position.interpolate({
    inputRange,
    outputRange: ([1, 1, 0.3, 0]: Array<number>),
  });
  ....
  return {
    opacity,
    ....
  };
}
{% endhighlight %}

I know. What is that "`index + 0.99`" doing there? Let me explain.

<a name="0.99-cliff">

# The "`0.99`-cliff" trick

![opacity code](/images/navigation-custom-transition/099-trick.png)

The point for the `0.99` is that it's **very close** to `1`. Using them as the input range, we are able to create a "cliff" in the output range. In the example above, when the position changes from `index` to `index + 0.99`, the output `opacity` gradually changes from `1` to `0.3`, and then at `index + 1`, it suddenly sinks to `0`.

![opacity code](/images/navigation-custom-transition/cliff-diagram.png)

The cliff, in the card stack transition in particular, is an important performance tuning. Because composing translucent scenes is expensive, we should always try to minimize the number of translucent layers. Here when the photo grid scene is completely covered, we want to set its opacity to `0` to avoid unnecessary composition.

In comparison, the code below suffers from composition overhead because it leaves the opacity of photo grid non-zero even when it's off screen:

{% highlight jsx %}
const opacity = position.interpolate({
  inputRange:  [index - 1, index, index + 1],
  outputRange: [1,         1,     0.3      ],
});
{% endhighlight %}

Let's recap what we've learned about the `NavigationCardStack` so far:

- `inputRange: [index - 1, index, index + 1]`: with this single input range, we are able to express concisely both photo grid and photo detail scenes. If it's rendering the photo grid scene, the range `[index, index + 1]` is effective; if it's rendering the photo detail scene, the range `[index - 1, index]` is effective.
- `0.99`-cliff: useful to create output range that "suddenly" changes at some point. **Question:** what if we want to create a cliff just to the left of `index`? Shall we use `index - 0.99`? Or something else?

# Our very own transitions!
Once we've learned about the above, it's almost trivial to create the transitions I listed at the beginning of this post. I'll just list the interpolation code below for your viewing pleasure. You can also check out the complete code on github ([this](https://github.com/lintonye/react-native-diary/blob/master/transitions/app/CrossFadeTransitioner.js) and [this](https://github.com/lintonye/react-native-diary/blob/master/transitions/app/AndroidDefaultTransitioner.js)).

<!-- crossFade -->
<div style="display: flex; flex-direction: row; align-items: center;">
  <div class="fivecol" style="float:none; margin-right:20px; ">
  <iframe width="225" height="400" src="//www.youtube.com/embed/6_BGrOQQlko?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
  </div>

  {% highlight jsx %}
  const inputRange = [index-1, index, index+1];
  const opacity = position.interpolate({
      inputRange,
      outputRange: [ 0, 1, 0],
  });
  {% endhighlight %}
</div>

<!-- androidDefault -->
<div style="display: flex; flex-direction: row; align-items: center;">
  <div class="fivecol" style="float:none; margin-bottom:20px; margin-right:20px;">
  <iframe width="225" height="400" src="//www.youtube.com/embed/oVwq1QDcnOw?controls=0&amp;rel=0&amp;showinfo=0;" frameborder="0" allowfullscreen></iframe>
  </div>

  {% highlight jsx %}
  const opacity = position.interpolate({
      inputRange: [index-1, index, index+0.999, index+1],
      outputRange: [ 0, 1, 1, 0],
  });

  const translateY = position.interpolate({
      inputRange: [index-1, index, index+1],
      outputRange: [150, 0, 0],
  })
  {% endhighlight %}
</div>

# Summary
Now that we've learned about how to concisely declare input and output ranges for all scenes and the "`0.99`" trick to create cliffs in the output range. We also created a couple of custom transitions without even breaking a sweat.

In the next post, we'll start working on something a bit more challenging, the [shared element transition](https://www.youtube.com/embed/efPFJkxa-BQ)! Feel free to ask me questions in the comments below, or suggest topics that you'd like me to write about in future posts. Have a great day!

_Special thanks to [Eric Vlad Vicenti](https://www.facebook.com/eric.v.vicenti) who reviewed this post and provided invaluable feedback!_
