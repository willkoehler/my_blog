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

# Basics
- Animated premier
- `NavigationCardStack` and how it works (brief)
- `NavigationTransitioner`

# Fade transition and rotate transition
- useNativeDriver is currently buggy
- In Transitioner, two things are animated: position (current => nextProps.index) and progress (0-1)
- in NavCardStack, all scenes in the stack are rendered. Proof using HierarchyViewer

# Shared element transition

# Enter / exit transitions (as in Android)
