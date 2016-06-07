---
layout: post
last-modified: '2016-06-06'

title: "Kicking it off: My React Native Diary"
cover_image: kickoff.jpg
cover_image_caption: "Overbrook ravine in Clintonville. Photo: Will Koehler"

excerpt: "Kicking off my diary about React Native"

author:
  name: Linton Ye
  twitter: lintonye
  bio: Founder of jimu Labs.
  image: linton.jpg
---
It's hard to ignore the success that React Native has achieved in [a short year](https://code.facebook.com/posts/597378980427792/). With the neck-breaking development in its ecosystem, React Native is looking increasingly promising. Is it mature enough for production use? How does its mantra "learn once, write everywhere" affect developer productivity? How does it compare with other solutions (such as Xamarin)? To answer questions like these, I decided to try it with my own hands and share whatever I'll learn in the journey.

I'll try to build a new app with React Native every one or two months (~ 1-2 hours per day), and write a post every week: silly mistakes, road blocks, gotchas and pitfalls, tips and tricks, cool tools, third-party components, useful resources and of course the full source code.

My background is primarily in Android (built a [tool](http://jimulabs.com/), wrote a Treehouse [course](https://teamtreehouse.com/library/animations-and-transitions)) but I've used JavaScript and React in a couple of recent projects (CSS is the part I hate the most in web development). Whether you have similar experience or not, I'm hoping you could learn one thing or two by watching me stumbling through the process.

## Todo Wonder
Let's get started with building a todo list app that I've always wanted. I know, there are a million todo list apps already, but trust me it's very valuable for learning with UI paradigms that almost every app uses, sending and retrieving data to/from a server, user accounts etc. So bear with me.

On the completion of this app, we should be able to cover the following:

- Navigator
- Lists
- Tabs
- Touch gestures (Drag & Drop, swipe to dismiss)
- Google / Facebook sign in
- Firebase integration
- Android first, iOS next

[Here](TODO) are some wireframes of how I imagine the app would look like.

[TODO one wireframe]

## Schedule & Deliverables
I'm going to treat this as a formal project, so I'm sharing my schedules and deliverables here. :) You are my client and I'll be responsible for the time you've invested in reading this far. I'll try my best to follow the schedule and write about useful things.

### May - June 6
- Project setup (and accumulate enough motivation to write this post). Here are some highlights from my notes so far: TODO.

### June 6 - Jun 12
- Hi-fi Prototype (with only mock data)
  - Navigator
  - Log in screen (only collect email address, does not actually sign in)
  - Priority & Duration tabs
  - Task lists

### June 13 - June 19
- Hi-fi Prototype (with only mock data)
  - Create / edit task
  - Drag & Drop
  - Done tab

### June 20 - June 26
- Firebase integration

### June 27 - June 30
- iOS
- Google / FB sign in

## Tips from what I've done so far
Here are some highlights from my notes since I started working on this project in May. If you are really curious, feel free to check out the [raw notes](https://www.evernote.com/l/AFutRbAf2hBI6bdfDtTwn3TkcDacSH8OHGE) (I'm updating it live every day).

- On Android's new emulator: use `cmd+M` to bring up the dev menu
- Debugging on a device: `adb reverse` does not produce any error message if the port on the host is already being occupied. If you see the red screen that complains about connectivity, make sure to free up the 8081 port on your computer.
- Hot reloading sounds cool, but it still seems unstable as of 0.25.1. Often times it yells at you with incomprehensible error messages (see the raw notes). I had to manually reload JS.
- There is no `<Button>` out of the box! You'd have to build your own with things like `<TouchableHighlight>`, but I'm still scratching my head why `<TouchableNativeFeedback>` does not give any feedback at all in my code! The fact that I haven't found anything yet on SO indicates that I must have made a really silly mistake. I'll shamelessly write about it when I figure it out.
- For connecting screens together, `<Navigator>` is the choice of weapon for now, but it seems it'll be replaced soon by something featuring single-directional data flow. I only read about it [here](https://medium.com/@dabit3/first-look-react-native-navigator-experimental-9a7cf39a615b#.3g05z3oh1) and haven't found any proof of it, so take it with some salt.
