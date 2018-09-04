require "rubygems"
require "tmpdir"
require "bundler/setup"
require "jekyll"

namespace :site do
  desc "Generate blog files"
  task :generate do
    Jekyll::Site.new(Jekyll.configuration({
      "source"      => ".",
      "destination" => "_site"
    })).process
  end

  desc "Generate and publish blog to gh-pages"
  task :publish => [:generate] do
    Dir.mktmpdir do |tmp|
      # Move site that we just built into temp folder
      system "mv _site/* #{tmp}"
      # Swith to gh-pages branch.
      if system "git show-ref --verify --quiet refs/heads/gh-pages"
        system "git checkout gh-pages"            # checkout existing branch
      else
        system "git checkout --orphan gh-pages"   # create new branch with no history
      end
      next if $?.exitstatus != 0      # abort if checkout failed
      # Delete everything (entire contents of the project folder include source code)
      # This gives us a clean folder for the gh-pages branch
      system "rm -rf *"
      # Move the site we just build into root of project folder
      system "mv #{tmp}/* ."
      # Get .gitignore from original repo so we ignore things like .jekyll-cache/
      system "git checkout master -- .gitignore"
      # Commit site changes to gh-pages branch and push to Github
      message = "Site updated at #{Time.now.utc}"
      system "git add --all ."
      system "git commit -am #{message.shellescape}"
      system "git push origin gh-pages --force"
      # Switch back to master branch
      system "git checkout master"
      puts "Site published successfully."
    end
  end
end
