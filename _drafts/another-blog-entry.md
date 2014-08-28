---
layout: post

title: Another Blog Entry
subtitle: "Something creative and inspiring"
cover_image: overbrook-ravine-in-clintonville.jpg

excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam augue libero, tincidunt non massa vel,
varius ornare est."

author:
  name: Will Koehler
  twitter: wckoehler
  bio: Web developer specializing in full-stack Rails applications.
  image: wk.jpg
---
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam augue libero, tincidunt non massa vel,
varius ornare est. Vivamus elementum orci in commodo pharetra. Proin lorem lorem, convallis sit amet
elementum at, rhoncus ac nibh. Nunc elementum ante velit, non pretium elit aliquam sit amet. Sed dapibus,
augue eu commodo varius, libero dolor varius nunc, vitae vehicula neque nisl sed quam. Aliquam leo nisl,
vestibulum ut sollicitudin vitae, sodales a mauris. Duis quis massa elementum, tristique urna a, tincidunt
quam. Suspendisse potenti.

> “Effective companies tend to communicate more, their people are curious and they have opinions”

Nunc volutpat arcu massa, vitae dignissim libero viverra vel. Aenean magna ipsum, auctor fringilla risus
luctus, sagittis sodales mi. Aenean lobortis pharetra diam, et sodales ante porta sit amet. Aliquam adipiscing
posuere semper. Vivamus et nisi quam. Ut placerat luctus ante. Morbi feugiat nisl sed sem tempor feugiat vitae
eu nulla. Nam sed aliquet enim. Donec lorem nisl, tincidunt quis metus ultricies, vulputate porta magna. Nullam
erat dolor, elementum et consectetur a, fermentum a est. Nam ornare mi sit amet turpis tempus gravida. Donec
venenatis id est ut egestas. Nulla auctor fringilla tortor, a consectetur mauris consectetur molestie. Sed
molestie elit vitae pulvinar imperdiet. Quisque mauris sem, bibendum eget ornare at, blandit sit amet quam.
Nulla faucibus sed nisl vitae fermentum.

##Some awesome code

{% highlight ruby linenos %}
def show
  puts "Outputting a very lo-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-ong lo-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-ong line"
  @widget = Widget(params[:id])
  respond_to do |format|
    format.html # show.html.erb
    format.json { render json: @widget }
  end
end
{% endhighlight %}

Nam ornare mi sit amet turpis tempus gravida. Donec
venenatis id est ut egestas. Nulla auctor fringilla tortor, a consectetur mauris consectetur molestie. Sed
molestie elit vitae pulvinar imperdiet. Quisque mauris sem, bibendum eget ornare at, blandit sit amet quam.
Nulla faucibus sed nisl vitae fermentum.
 
{% highlight ruby linenos %}
class User < ActiveRecord::Base
  has_many :user_assignments, :dependent => :destroy
  has_many :hospitals, :through => :user_assignments
  # 160 users
 
  # Ugly, but 5x faster than op2 and op3
  # Takes 2ms
  scope :grid_fields, -> { joins('LEFT JOIN user_assignments ON user_id = users.id LEFT JOIN hospitals ON hospitals.id = hospital_id').
                           group('users.id').select([:id, :name, :email, :role, 'min(hospitals.name) as first_hospital_name']) }
 
  # Brings in all 10 user columns and 36 hospital columns. Takes a long time to process all that data.
  # select() doesn't help - it's ignored
  # Takes 75ms
  scope :grid_fields_op2, -> { eager_load(:hospitals) }
 
  # 3 separate queries, User, UserAssignment, and Hospital.
  # User load - takes 1ms
  # UserAssignment - load takes 2ms
  # Hospital load - takes 7ms (selects all 36 columns - not easy to change this)
  scope :grid_fields_op3, -> { preload(:hospitals).select([:id, :name, :email, :role]) }
 
  # (needed for op2 and op3)
  # Note that when we use this function, the grid render is ~3x slower than just grabbing the raw
  # 'first_hospital_name' field from the first query. 100ms vs 30ms grabbing the raw field
  # def first_hospital_name
  #   hospitals.first.try(:name)
  # end
end
{% endhighlight %}

##Zoomable images

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque lectus elit, elementum aliquam erat non,
aliquam sodales libero. In aliquet nec tortor sit amet mollis. Maecenas sodales at nulla vitae congue. Lorem
ipsum dolor sit amet, consectetur adipiscing elit. Nam adipiscing, elit vel rhoncus dictum, nisi dui tristique
lacus, et rhoncus lacus tellus ac risus. Aliquam sit amet condimentum orci. Suspendisse nec orci mauris.
Phasellus orci arcu, vehicula suscipit iaculis ut, pharetra ac urna.

<div class="full zoomable"><img src="/images/incorporated.jpg"></div>

That's all for now. Thanks for reading.
