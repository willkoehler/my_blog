---
layout: post
last-modified: '2017-01-18'

title: "React Navigation: Shared Element Transition"
#subtitle: "A series of posts about creating custom transitions using NavigationExperimental."
#cover_image: "navigation-custom-transition/transit.jpg"

excerpt: "Blog series: creating custom transitions using NavigationExperimental. This post covers inputRange and a couple of simple custom transitions."

author:
  name: Linton Ye
  twitter: lintonye
  bio: Freelance full-stack developer in BC Canada (GMT-8). Android, React Native, Node.js, MongoDB, PostgreSQL. <a href="mailto:linton@jimulabs.com">Hire me.</a>
  image: linton.jpg
---

*Series TOC*:

- *[An overview of Transitioner and CardStack](TODO)*
- *[Simple transitions: cross fade and Android default](TODO)*
- *Shared element transition (this post)*

---

In the last couple of posts, we've learned about how Transitioner/CardStack works and how to create simple transitions by interpolating `AnimatedValue`s that the Transitioner creates. In this post, let's try something fancier - shared element transition:

(TODO: video / gif / mpg4)

This neat transition was inspired by the [example in the Material design guideline](https://material.io/guidelines/patterns/navigational-transitions.html#navigational-transitions-parent-to-child). We'll look at an initial implementation which, of course, leaves plenty of room for improvements. And there might be much better approaches. But I think the main points learned via this excise should be useful elsewhere. If you prefer, feel free to dive into [the source code](TODO), play with it and come back as needed.

## Goals
Taking on it as a personal challenge, I set the following goals before coding:

- **Pure JavaScript**: Because there are a lot of  [benefits](https://blog.getexponent.com/good-practices-why-you-should-use-javascript-whenever-possible-with-react-native-26478ec22334#.1f5rqwn1c) of doing pure JS.
- **Minimal API**: We're gonna need a way to tell which views are shared and how they are linked. I wanted to minimize user's effort for doing so.

- **Reasonably smooth on older devices**: Of course 60 FPS is the ultimate goal we should all aim at. But realistically it's hard to achieve on older devices with pure JavaScript. The default CardStack animation sports about 40 FPS on my Nexus 5, which looks reasonably smooth and usable. Let's use this as a yardstick and see how much further we can improve the performance.

## Dissecting the animation

OK, it's now time to look closely at the animation that we want to create. There are a number of things happening during the 300ms transition window:

1. The entire photo grid scene first darkens gradually.
2. The photo thumbnail in the grid is lifted up slightly (by casing a shadow).
3. The thumbnail then moves, zooms and eventually becomes the bigger photo in the detail scene.
4. Along with the photo, its container moves and grows until it fills up the screen.

![Animation dissect](/images/navigation-custom-transition/shared-element-animation-dissect.png)

The most interesting part is the No.3 above which creates an effect that the photo jumps out of the grid and expands itself into the detail scene. We'll devote most of this post to how it works.

## Smoke and mirrors

Do you really believe that there is a single image being shared between the grid and detail screens?

Let's reveal the magic trick! The truth: nothing is shared and there is still a separate image on each scene. In fact it's very difficult, [if not impossible](TODO), to share a view across two view hierarchies in React. Most of the animation happens on an extra overlay visible only during the transition. It goes like this:

- **When the transition is about to start:** We show the overlay and clone the shared views onto the overlay. The detail scene is rendered but invisible, allowing us to calculate the bounding boxes of the shared views.
- **During the transition:** Using the aforementioned bounding boxes, we animate the cloned views on the overlay.
- **After the transition:** We hide the overlay and show the actual detail scene.

Sounds straightforward to implement, right? I thought so in the beginning, however, I had to go through a few iterations to do it properly in the React way, and the asynchronous nature of React Native presents some unique challenges.

## Key challenges
To understand the key challenges in this implementation, let's just start coding and see how far we could go.

### The easy parts
Still remember how to use Transitioner? Our `SharedElementsTransitioner` just renders to a `Transitioner` and defines its `_render` function like so:

{% highlight jsx %}
class SharedElementsTransitioner extends Component {
  ....
  render() {
    return (
      <Transitioner
        render={this._render.bind(this)}
        ....
      />
    );
  }
  _render(....) {
    const scenes = props.scenes.map(scene => this._renderScene({ ...props, scene }));
    const overlay = this._renderOverlay(props, prevProps);
    return (
        <View style={styles.scenes}>
            {scenes}
            {overlay}
        </View>
    );
  }
}_
{% endhighlight %}

The `_render` function is almost the same as that of `CardStack` except for the additional overlay where most of the animations take place.

The `_renderOverlay` function should be straightforward too. We just render all the shared views there and define their animated style properties -- that's how we are supposed to use the Animated library.

{% highlight jsx %}
 // class SharedElementsTransitioner
 _renderOverlay(....) {
   const sharedViews = this.cloneAndAnimateSharedViews(....);
   return (
     <View>
       {sharedViews}
     </View>     
   );
 }_
{% endhighlight %}

### The harder part: first attempt

Now here comes the question: What is this `cloneAndAnimateSharedViews` function supposed to look like?

Conceptually, we can just find all the shared views in the current and upcoming scenes, pair them up, retrieve their bounding boxes, clone them and create animated styles.

Let's give it a try (pseudo code below):

{% highlight jsx %}
// class SharedElementsTransitioner
cloneAndAnimateSharedViews(...) {
  const shareViewPairs = this.collectActiveSharedViewsOnBothGridAndDetail(....);
  return sharedViewPairs.map(pair => {
    // Does this getBoundingBox() really exist?
    const bboxFrom = pair.fromItem.getBoundingBox();
    const bboxTo = pair.toItem.getBoundingBox();
    const animatedStyle = this.createAnimatedStyle(bboxFrom, bboxTo);
    const cloned = React.cloneElement(pair.fromItem);
    return (
      <Animated.View style={animatedStyle}>
        {cloned}
      </Animated.View>
    );
  });
}

collectActiveSharedViewsOnBothGridAndDetail(....) {
  // Those shared views are scattered in other components,
  // How can we visit them from here? By traversing the tree?
}
{% endhighlight %}

Would the above work? We need to answer these questions:

1. The shared views are scattered on different components (in our example, `PhotoGrid` and `PhotoDetail`). How can we visit and collect them from within our `SharedElementsTransitioner`? By traversing the tree?
2. Even if we manage to collect the shared views, does that `getBoundingBox()` really work?

### Challenge 1: How to efficiently collect shared views?
In other UI frameworks, such as native Android, we can easily traverse a view hierarchy as a tree. In React, this is in theory possible via the `children` prop.

However, this sounds expensive especially when the render method

### Challenge 2: No direct access to native widgets
In other UI frameworks, we could easily obtain layout information, such as bounding boxes, by calling a few methods on the view object. But this does not work in React Native because we don't have direct access to native widgets.

To understand this, let's go a bit deeper on how React works. It's useful to view what's happening in React as a two-step process:

1. First, React creates a "virtual tree" that represents the native view hierarchy (which is more famously known as "virtual DOM" in ReactJS). The nodes on this tree, called React elements, are just descriptors -- they are plain objects with no references of the native widgets whatsoever. This step is where we, as React developers, can construct and update the user interface: we create React elements to describe what we want, typically in `render` methods of components.
2. Then, React takes these descriptors and runs a "reconciliation" step that actually creates and/or updates the native widgets. React handles this process internally and transparently. We have no direct access of this process (and this is where React shines).

When our `collectAndAnimateSharedViews` is called, we are at the first step above and therefore only have access to React elements. React elements are plain objects and do not have a `getBoundingBox` method or anything remotely related!

### Challenge 3: The late-coming information of bounding boxes

Why couldn't we have this much needed `getBoundingBox` method on React elements?

This is by design. Layout information, such as bounding boxes, is only available when a native widget gets laid out on the screen. However, when we are at the step 1 of the React rendering process, the corresponding native widgets may have not been laid out or even created yet!

This is why our first attempt of `collectAndAnimateSharedViews` won't work!

## My solution
So what else are on the table? Here's my approach in a nutshell:

- When a shared view is mounted, register it as part of the state of `SharedElementsTransitioner`. This should be much more efficient than traversing the entire virtual tree searching for shared views.
- When the layout process of `SharedElementsTransitioner` is done, measure the bounding boxes of shared views and save them into the state.
- Update the transitioner only when we have enough information to create the animation, such as the bounding boxes of shared views on both grid and detail scenes.

### API

{% highlight jsx %}
// on photo grid screen
<SharedView name='photo1' containerRouteName='ROUTE_PHOTO_GRID'>
  <Image source={image} />
</SharedView>

// on photo detail screen
<SharedView name='photo1' containerRouteName='ROUTE_PHOTO_DETAIL'>
  <Image source={image} />
</SharedView>
{% endhighlight %}

### "Registering" shared views

### `UIManager`
If we do some googling, we'll find that `UIManager.measureInWindow()` is the actual function that we can rely on to get the much needed bounding boxes. It works like this:

{% highlight js %}
UIManager.measureInWindow(
    viewNativeHandle,
    (x, y, width, height) => {
      // do something about x, y, width and height
    }
)
{% endhighlight %}

The bounding box information is only available in a callback. This means that

### `shouldComponentUpdate`

### Challenge 2: `UIManager` works asynchronously


### Recap: the challenges

To sum up the key challenges we've encountered so far:

1. In React, we don't have (and should not have) direct access to native widgets which provides the essential information (bounding boxes) we need to create the animation.
2. The mechanic to obtain layout metrics, i.e. `UIManager`, works asynchronously.



In order to obtain the bounding boxes of the native widgets, we'd have to be patient. We'd have to wait for the reconciliation step to finish. Fortunately `React.View` provides a `onLayout` prop to hook up some code at that point.

Further, we can use `UIManager.measureInWindow()` to

### Challenge 1: ReactElement is just a descriptor, not the actual UI widget
### Challenge 2: ReactElement hierarchy evaluation is lazy
### Challenge 3: Bounding box measuring is asynchronous

1. **No `getX()` or `getWidth()` etc.** The `ReactElement` object returned from `render` functions is just a descritor of how the view is supposed to be rendered, not the actual native view. Therefore there is no direct way to obtain information about the rendered native views in `render` functions. We'd have to use a helper class `UIManager`.
2. **`UIManager` works asynchronously.**

### Challenge 1: accessing views in other components
The shared views are defined in their respective scene components, which are rendered as children of our `SharedElementsTransitioner`. How can we get hold of them?

Easy! Just traverse the tree, right? This was my first attempt which turned out to be fruitless, due to the way how React works. More on this later.

### Challenge 2: identifying active shared views
In the photo grid, only one photo, the one that's just tapped, can be used to create animations. You certainly don't want all photos to zoom and move at the same time!

The challenge here is that in `SharedElementsTransitioner`, you can't directly traverse the tree to visit all the shared views in one place.

### Challenge 3: measuring view bounding boxes
can't do `this.getLeft()` or `this.getWidth()`

- render has to be pure function of state and props



## API
After some trials and errors, I arrived at the API below:


Shared views are identified by their `name` and `containerRouteName`. If two `SharedView`s  on different scenes have the same `name`, they are considered shared and the transitioner will create animations for them. The prop `containerRouteName` gives the transitioner additional instructions on how to create the animations.

No other code is needed.



Let's check out the code.

Question:

how do we obtain the position and size of the shared view?


## Details
## Key takeaways
## Revisiting the goals


(BACKGROUND STORY)
Initially I set this as a challenge to myself and wasn't sure if it's actually possible at all to create something in pure JavaScript that's half-decent. The end result isn't too bad. The animation runs reasonably smooth - around 40fps on my old Nexus 5. This might not be the only way to implement this. and there is plenty of room for improvement (see the end of this post). But I think the general points are useful to implement other transitions and other things. React way of implementing things that depend on the state of UI.


- render should be a pure function of state and props
- Use a unique name to pair up shared views
- Use UIManager to measure shared view in window
- UIManager must be called in onLayout
- Deal with the delay due to the fact that UIManager runs in native thread
- setState atomically
- Tips to develop animation: on real device, turn off JS Dev mode
- Android: elevation = shadow + z-index
- cloneElement: ReactElement is just a lightweight description of the view, it's OK to call render() to get it
- Magic box
  - Fake things in the overlay
  - real scenes are mostly hidden, and only visible when the animation is about to finish.
- TODOs
  - can we really share a view to create the Youtube like transition? (link to someone's issue indicating that it is currently not possible to do so)
  - perhaps link to React Fibre?
  - Back to grid: the attempt that causes flickering
  - performance issue when there are a lot of shared views
  - loss of frames (especially in the beginning)
  - more complex interpolation between shared view properties, such as font size, color.
  - iOS
  - discussion: when loading image in detail scene is slow
  - what if we add a toolbar on the photo detail?
