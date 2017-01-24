---
layout: post
last-modified: '2016-06-23'

title: "NavigationExperimental Premier: A Simple Recipe"
cover_image: "navigation-simple/navigation-cover.jpg"

excerpt: "A simple tutorial on NavigationExperimental, the new navigation system that replaces Navigator"

author:
  name: Linton Ye
  twitter: lintonye
  bio: Founder of jimu Labs. Full-stack developer, toolsmith, UI designer, entrepreneur and lifelong learner.
  image: linton.jpg
---
Thanks to [Nader Dabit's post](https://medium.com/@dabit3/first-look-react-native-navigator-experimental-9a7cf39a615b#.4zl60befe), I wasted no time when learning about navigation in React Native. The [`Navigator`](http://facebook.github.io/react-native/docs/navigator.html) will be soon [deprecated](https://github.com/ericvicenti/navigation-rfc/blob/master/Docs/NavigationOverview.md) and it will be replaced by a different approach, currently called `NavigationExperimental`. However, I haven't found much documentation that is easy to follow for a newbie (me) who doesn't have much experience in Flux, Redux etc.

I decided to write a simpler tutorial to help myself (and hopefully you too) understand how things work.

In a nutshell, `NavigationExperimental` handles navigation with three things:

1. `NavigationState`: exactly as its name says
2. `NavigationStateUtils`: helper functions for manipulating navigation states
3. `NavigationCardStack`: the container that renders scenes based on its navigation state

Let me expand each of these while building some simple navigation like this:

<div class="fivecol" style="float:none; margin-bottom:20px;">
<iframe width="282" height="500" src="//www.youtube.com/embed/enkPGpBBkFE?controls=0&amp;rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>
</div>

## `NavigationState`
According to the [proposal (RFC)](https://github.com/ericvicenti/navigation-rfc/blob/master/Docs/NavigationOverview.md#navigator) of the new navigation system, the old `Navigator` "owns navigation state and has an imperative API, which goes against the React philosophy of single-directional data flow". The fix is to define the navigation states declaratively, basically the same way as other things in React: declaring it as a state on the top level component and pass it down in the hierarchy as props.

A typical navigation state looks something like this:

{% highlight javascript %}
{
  index: 1,  // => index of the active scene
  routes: [  // => navigation stack
    {key: 'screen1'},
    {key: 'screen2'},
  ]
}
{% endhighlight %}

The `NavigationCardStack` is aware of this `NavigationState` (actually passed in as a prop) and renders scenes accordingly.

In our simple example app, we can assign the initial navigation state like so:

{% highlight javascript %}
class NavExample extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      navigation: {
        index: 0,
        routes: [
          {key: 'screen1'},
        ]
      }
      ...
    }
  ...
{% endhighlight %}

This means that the entry of our app is `screen1`, and there is initially only one screen in the stack.

_BTW: One thing I'm not too sure here - why is the stack called `routes` instead of `scenes`? There seems indeed a difference between `scenes` and `routes` if you look at the [`sceneProps`](#sceneProps) passed into the `renderScene` function._

## Manipulating States with `NavigationStateUtils`

Now if we click "Go screen2" and then click "Go screen3", two scenes will be pushed into the stack. The state will look like this:

{% highlight javascript %}
{
  navigation: {
    index: 2,
    routes: [{key: 'screen1'}, {key: 'screen2'}, {key: 'screen3'}]
  }
}
{% endhighlight %}

At this point if we hit the "Go Back" button, `screen3` will be popped off from the stack, making `screen2` active (on the top of the stack).

{% highlight javascript %}
{
  navigation: {
    index: 1,
    routes: [{key: 'screen1'}, {key: 'screen2'}]
  }
}
{% endhighlight %}

These stack pushing/popping operations can be done with the helper functions in the `NavigationStateUtils` module (`push()`, `pop()` and `jumpTo()`).

Below are the (flow) type definitions of these functions in the [source code](https://github.com/facebook/react-native/blob/master/Libraries/NavigationExperimental/NavigationStateUtils.js):

{% highlight javascript %}
function push(state: NavigationState, route: NavigationRoute): NavigationState {
  ...
}

function pop(state: NavigationState): NavigationState {
  ...
}

function jumpTo(state: NavigationState, key: string): NavigationState {
  ...
}
{% endhighlight %}

These functions return a new `NavigationState` which we can use to make the navigation happen by calling `this.setState()`:

{% highlight javascript %}
_navigate(action) {
  // NavigationStateUtils is used in reduceNavState()
  const newNavState = reduceNavState(this.state.navigation, action)
  if (newNavState !== this.state.navigation) {
    this.setState({
      navigation: newNavState,
    })
  }
}
{% endhighlight %}

Here this `reduceNavState` simply uses `NavigationStateUtils` to push or pop routes from the stack, but more complex navigation mechanisms can be implemented as needed (e.g. independent navigation stacks within tabs as in one of the [official examples](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/NavigationExperimental/NavigationCardStack-NavigationHeader-Tabs-example.js)).

{% highlight javascript %}
const reduceNavState = (navState, action) => {
  const {type, key} = action;
  switch (type) {
    case 'push':
      const route = {key}
      return NavStateUtils.push(navState, route)
    case 'pop':
      return NavStateUtils.pop(navState)
    default:
      return navState
  }
}  
{% endhighlight %}

With the `_navigate()` function in hand, it's now fairly easy to move around in our app, for example, creating a button that links to `screen2`:

{% highlight javascript %}
<Button onPress={this._navigate.bind(this, {type: 'push', key: 'screen2'})}
  .../>
{% endhighlight %}

If you are not familiar with `bind()`, it'll create a new function that executes as if we are calling `_navigate({type: 'push', key: 'screen2'})`. See [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) for more information about `bind`.

## `NavigationCardStack`
The last piece of the puzzle is `NavigationCardStack`, a component acting as a container that renders scenes depending on the navigation state.

{% highlight javascript %}
<NavigationCardStack
  renderScene={this._renderScene}  // a function that performs the rendering
  navigationState={this.state.navigation} // exactly as its name says
  renderOverlay={this._renderHeader} // renders something that's always on the screen
  onNavigate={this._goBack} // this has been renamed to onNavigateBack on master
/>
{% endhighlight %}

When the `renderScene` function is called, it'll be provided with a `sceneProps` parameter which looks something like this:

<a name="sceneProps">
{% highlight javascript %}
{
  "layout": {
    "height": 568,
    "initHeight": 568,
    "initWidth": 360,
    "isMeasured": true,
    "width": 360
  },
  "navigationState": {
    "index": 1,
    "routes": [
      {
        "key": "screen1"
      },
      {
        "key": "screen2"
      }
    ]
  },
  "position": 0,
  "progress": 1,
  "scene": {
    "index": 1,
    "isStale": false,
    "key": "scene_screen2",
    "route": {
      "key": "screen2"
    }
  },
  "scenes": [
    {
      "index": 0,
      "isStale": false,
      "key": "scene_screen1",
      "route": {
        "key": "screen1"
      }
    },
    {
      "index": 1,
      "isStale": false,
      "key": "scene_screen2",
      "route": {
        "key": "screen2"
      }
    }
  ]
}
{% endhighlight %}

There's a lot of stuff here, but it looks like `scene.route.key` here refers to the key of the active scene (I'll update this after they finalize the API). We can then decide what screen to render depending on its value, typically in a `switch`:

{% highlight javascript %}
_renderScene(sceneProps) {
  const scene = sceneProps.scene.route.key
  switch (scene) {
    case 'screen1':
      return (
        <Screen1 goScreen2={this._goScreen2}
          goScreen3={this._goScreen3}
          {...sceneProps} />
      )
    case 'screen2':
      return (
        <Screen2 goBack={this._goBack}
          goScreen3={this._goScreen3}
          {...sceneProps} />
      )
    case 'screen3':
      return ...
    ...
}
{% endhighlight %}
Of course you have the freedom of rendering anything you like, for example, you can do a pattern matching on the route key and render the same screen for a class of scenes.

## Support for Back button on Android
On Android, there is a Back button that needs some special treatment when implementing navigation. The standard behavior is to go back to the previous screen until the app exits. We can use the [`BackAndroid`](http://facebook.github.io/react-native/docs/backandroid.html) module to pop up scenes from the stack like so:

{% highlight javascript %}
class NavExample extends React.Component {
  constructor(props, context) {
    ...
    if (Platform.OS === 'android') {
      BackAndroid.addEventListener('hardwareBackPress', () => {
        if (this.state.navigation.index > 0) {
          this._goBack()
          return true
        } else {
          return false
        }
      })
    }
  }
{% endhighlight %}

## Source Code
You can find the source code of the example app [here](https://github.com/lintonye/react-native-diary/tree/master/NavExamples). Make sure you use React Native 0.28.0+: `react-native -v`. You can upgrade it using `npm install --save react-native@0.28.0` (or the latest version).

## Conclusion
So here you go, three parts of `NavigationExperimental` work together to complete the story: `NavigationState`, `NavigationStateUtils` and `NavigationCardStack`. Navigation states are now good React citizens as they are just normal states or props defined declaratively. This makes the navigation code easier to follow/debug and also open some interesting opportunities, for example, the navigation state can be persisted to the disk during app refreshes.

Did you find this post useful? Do you have other things about navigation to share with us? Chime in below in the comments! Thanks for reading.
