# Plugin to add environment variables to the `site` object in Liquid templates
# See https://gist.github.com/nicolashery/5756478

module Jekyll

  class EnvironmentVariablesGenerator < Generator

    def generate(site)
      site.config['env'] = ENV['JEKYLL_ENV'] || 'development'
      # Add other environment variables to `site.config` here...

      # Set config values based on environment
      case site.config['env']
      when 'development'
        site.config['assets']['debug'] = true
      end
    end
  end
end