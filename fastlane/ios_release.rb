require "digest"
require "fileutils"
require "json"
require "open3"
require "plist"
require "tmpdir"
require "zip"

module OpeningsIosRelease
  IDENTIFIER = "dev.openings.mobile"
  EXTENSION_IDENTIFIER = "#{IDENTIFIER}.OneSignalNotificationServiceExtension"
  TEAM_ID = "VD2G3CWSCR"
  APP_GROUP = "group.#{IDENTIFIER}.onesignal"
  APP_PATH = "Payload/Openings.app"
  EXTENSION_PATH = "#{APP_PATH}/PlugIns/OneSignalNotificationServiceExtension.appex"
  ARCHIVE_CHECKS = %w[source_checks archive sdk_configuration sentry_uploads_required].freeze

  def self.integration_preflight!(environment)
    %w[EXPO_PUBLIC_SENTRY_DSN EXPO_PUBLIC_MIXPANEL_TOKEN EXPO_PUBLIC_ONESIGNAL_APP_ID SENTRY_ORG SENTRY_PROJECT SENTRY_AUTH_TOKEN].each do |name|
      raise ArgumentError, "Missing #{name}" if environment[name].to_s.strip.empty?
    end
    %w[SENTRY_DISABLE_AUTO_UPLOAD SENTRY_DISABLE_XCODE_DEBUG_UPLOAD SENTRY_ALLOW_FAILURE EXPO_NO_CLIENT_ENV_VARS].each do |name|
      raise ArgumentError, "#{name} must not bypass release integrations" if %w[1 true yes].include?(environment[name].to_s.downcase)
    end
    raise ArgumentError, "SKIP_BUNDLING must be unset for the release archive" unless environment["SKIP_BUNDLING"].to_s.empty?
    { sdk_configuration: true, sentry_uploads_required: true }
  end

  def self.validate_archive_manifest!(parameters, sha)
    path = parameters[:path].sub(/\.ipa\z/, ".json")
    raise ArgumentError, "Missing archive manifest; produce the IPA with ios archive" unless File.file?(path) && !File.symlink?(path)
    manifest = JSON.parse(File.read(path))
    expected = { "schema_version" => 1, "app_identifier" => IDENTIFIER, "version" => parameters[:version], "build" => parameters[:build], "sha256" => sha }
    raise ArgumentError, "Invalid archive manifest" unless manifest.is_a?(Hash)
    expected.each { |key, value| raise ArgumentError, "Archive manifest #{key} mismatch" unless manifest[key] == value }
    raise ArgumentError, "Archive source commit is missing" unless manifest["source_commit"].to_s.match?(/\A[0-9a-f]{40}\z/)
    checks = manifest["checks"]
    raise ArgumentError, "Archive integration preflight is incomplete" unless checks.is_a?(Hash) && ARCHIVE_CHECKS.all? { |name| checks[name] == true }
  rescue JSON::ParserError
    raise ArgumentError, "Invalid archive manifest JSON"
  end

  def self.validate_firebase!(config)
    raise ArgumentError, "Wrong Firebase project or Apple app" unless config["PROJECT_ID"] == "openingshq" && config["BUNDLE_ID"] == IDENTIFIER
    raise ArgumentError, "Missing Firebase Apple app identifier" unless config["GOOGLE_APP_ID"].to_s.match?(/\A1:\d+:ios:[0-9a-f]+\z/i)
    raise ArgumentError, "Missing Firebase API key" if config["API_KEY"].to_s.strip.empty?
  end

  def self.parameters(root, options)
    version = options[:version_name].to_s
    build = options[:build_number].to_s
    raise ArgumentError, "version_name must be an explicit three-part version" unless version.match?(/\A\d+\.\d+\.\d+\z/)
    raise ArgumentError, "build_number must be an explicit positive integer" unless build.match?(/\A[1-9]\d{0,8}\z/)
    package_version = JSON.parse(File.read(File.join(root, "package.json"))).fetch("version")
    expo_version = JSON.parse(File.read(File.join(root, "app.json"))).fetch("expo").fetch("version")
    raise ArgumentError, "version_name must match package.json and app.json" unless [package_version, expo_version].all? { |value| value == version }
    path = options[:ipa_path].to_s
    raise ArgumentError, "ipa_path must explicitly name an .ipa file" if path.empty? || File.extname(path) != ".ipa"
    { version: version, build: build, path: File.expand_path(path, root) }
  end

  def self.command(*args, stdin_data: "")
    stdout, _stderr, status = Open3.capture3(*args, stdin_data: stdin_data)
    raise ArgumentError, "iOS artifact verification failed: #{File.basename(args.first)}" unless status.success?
    stdout
  end

  def self.parse_plist(data, runner)
    xml = data.start_with?("bplist") ? runner.call("/usr/bin/plutil", "-convert", "xml1", "-o", "-", "-", stdin_data: data) : data
    value = Plist.parse_xml(xml)
    raise ArgumentError, "Invalid artifact plist" unless value.is_a?(Hash)
    value
  end

  def self.validate_identity!(metadata, identifier, parameters)
    expected = { "CFBundleIdentifier" => identifier, "CFBundleShortVersionString" => parameters[:version], "CFBundleVersion" => parameters[:build] }
    expected.each { |key, value| raise ArgumentError, "Artifact #{identifier} has unexpected #{key}" unless metadata[key].to_s == value }
    raise ArgumentError, "Physical iOS application required" unless metadata["CFBundleSupportedPlatforms"] == ["iPhoneOS"]
  end

  def self.validate_distribution!(profile, entitlements, identifier)
    application_id = "#{TEAM_ID}.#{identifier}"
    raise ArgumentError, "Artifact signing team mismatch" unless entitlements["com.apple.developer.team-identifier"] == TEAM_ID
    raise ArgumentError, "Artifact signing identifier mismatch" unless entitlements["application-identifier"] == application_id
    raise ArgumentError, "Development-signed artifact is not eligible" unless entitlements["get-task-allow"] == false
    [entitlements, profile.fetch("Entitlements", {})].each do |grants|
      raise ArgumentError, "Missing OneSignal application group" unless Array(grants["com.apple.security.application-groups"]).include?(APP_GROUP)
      raise ArgumentError, "Production APNs entitlement required" if identifier == IDENTIFIER && grants["aps-environment"] != "production"
    end
    raise ArgumentError, "Provisioning profile team mismatch" unless profile["TeamIdentifier"] == [TEAM_ID]
    raise ArgumentError, "Provisioning profile identifier mismatch" unless profile.dig("Entitlements", "application-identifier") == application_id
    raise ArgumentError, "Provisioning profile must be App Store distribution" unless profile.dig("Entitlements", "get-task-allow") == false && !profile.key?("ProvisionedDevices") && profile["ProvisionsAllDevices"] != true
    raise ArgumentError, "Expired provisioning profile" unless profile["ExpirationDate"].respond_to?(:to_time) && profile["ExpirationDate"].to_time > Time.now
  end

  def self.inspect_ipa(root, options, require_tested_hash: true, require_archive_manifest: true, runner: method(:command))
    parameters = parameters(root, options)
    path = parameters[:path]
    raise ArgumentError, "Explicit IPA does not exist" unless File.file?(path) && !File.symlink?(path)
    sha = Digest::SHA256.file(path).hexdigest
    if require_tested_hash
      tested = options[:tested_sha256].to_s.downcase
      raise ArgumentError, "tested_sha256 must identify the exact accepted IPA" unless tested.match?(/\A[0-9a-f]{64}\z/) && tested == sha
    end
    validate_archive_manifest!(parameters, sha) if require_archive_manifest
    Dir.mktmpdir("openings-ipa-") do |directory|
      Zip::File.open(path) do |archive|
        roots = archive.entries.map(&:name).grep(%r{\APayload/[^/]+\.app/Info\.plist\z})
        extensions = archive.entries.map(&:name).grep(%r{\APayload/[^/]+\.app/PlugIns/[^/]+\.appex/Info\.plist\z})
        raise ArgumentError, "IPA must contain exactly Openings and its notification extension" unless roots == ["#{APP_PATH}/Info.plist"] && extensions == ["#{EXTENSION_PATH}/Info.plist"]
        [[APP_PATH, IDENTIFIER], [EXTENSION_PATH, EXTENSION_IDENTIFIER]].each do |bundle, identifier|
          validate_identity!(parse_plist(archive.read("#{bundle}/Info.plist"), runner), identifier, parameters)
        end
        firebase_path = "#{APP_PATH}/GoogleService-Info.plist"
        raise ArgumentError, "Firebase configuration missing from IPA" unless archive.find_entry(firebase_path)
        validate_firebase!(parse_plist(archive.read(firebase_path), runner))
        archive.each do |entry|
          parts = entry.name.split("/")
          raise ArgumentError, "Unsafe IPA entry" if entry.name.start_with?("/") || parts.include?("..") || entry.name.include?("\\") || entry.ftype == :symlink
          destination = File.join(directory, entry.name)
          if entry.directory?
            FileUtils.mkdir_p(destination)
          else
            FileUtils.mkdir_p(File.dirname(destination))
            entry.get_input_stream do |input|
              File.open(destination, "wb") { |output| IO.copy_stream(input, output) }
            end
            File.chmod((entry.unix_perms || 0o644) & 0o777, destination)
          end
        end
      end
      [[APP_PATH, IDENTIFIER], [EXTENSION_PATH, EXTENSION_IDENTIFIER]].each do |bundle, identifier|
        app = File.join(directory, bundle)
        runner.call("/usr/bin/codesign", "--verify", "--deep", "--strict", app)
        entitlements = parse_plist(runner.call("/usr/bin/codesign", "-d", "--entitlements", ":-", app), runner)
        profile = parse_plist(runner.call("/usr/bin/security", "cms", "-D", "-i", File.join(app, "embedded.mobileprovision")), runner)
        validate_distribution!(profile, entitlements, identifier)
        prefix = File.join(directory, "certificate-#{identifier}-")
        runner.call("/usr/bin/codesign", "-d", "--extract-certificates=#{prefix}", app)
        raise ArgumentError, "Missing signing certificate" unless File.file?("#{prefix}0")
        fingerprint = Digest::SHA256.file("#{prefix}0").hexdigest
        certificates = Array(profile["DeveloperCertificates"])
        matched = certificates.any? do |certificate|
          data = certificate.respond_to?(:string) ? certificate.string : certificate
          data.is_a?(String) && Digest::SHA256.hexdigest(data) == fingerprint
        end
        raise ArgumentError, "Signing certificate is not in the provisioning profile" unless matched
      end
    end
    parameters.merge(sha256: sha)
  end
end
