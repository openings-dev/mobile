require "minitest/autorun"
require "minitest/mock"
require_relative "../../fastlane/ios_release"

class IosReleaseTest < Minitest::Test
  def setup
    @root = Dir.mktmpdir("openings-release-test-")
    File.write(File.join(@root, "package.json"), JSON.generate(version: "0.1.1"))
    File.write(File.join(@root, "app.json"), JSON.generate(expo: { version: "0.1.1" }))
    @options = { version_name: "0.1.1", build_number: "7", ipa_path: "Openings.ipa" }
    @commands = []
    @profile_changes = {}
    @entitlement_changes = {}
    @runner = lambda do |*args, **_kwargs|
      @commands << args
      bundle = args.last.include?(".appex") ? OpeningsIosRelease::EXTENSION_IDENTIFIER : OpeningsIosRelease::IDENTIFIER
      entitlements = {
        "application-identifier" => "#{OpeningsIosRelease::TEAM_ID}.#{bundle}",
        "com.apple.developer.team-identifier" => OpeningsIosRelease::TEAM_ID,
        "com.apple.security.application-groups" => [OpeningsIosRelease::APP_GROUP],
        "aps-environment" => "production",
        "get-task-allow" => false
      }.merge(@entitlement_changes)
      if args.first == "/usr/bin/security"
        { "Entitlements" => entitlements, "TeamIdentifier" => [OpeningsIosRelease::TEAM_ID], "ExpirationDate" => Time.now + 86_400,
          "DeveloperCertificates" => [StringIO.new("synthetic signing certificate")] }.merge(@profile_changes).to_plist
      elsif args.include?("--entitlements")
        entitlements.to_plist
      elsif args.include?("--extract-certificates")
        File.binwrite("#{args[3]}0", "synthetic signing certificate")
        ""
      else
        ""
      end
    end
  end

  def teardown
    FileUtils.remove_entry(@root)
  end

  def ipa(app_identifier: OpeningsIosRelease::IDENTIFIER, extension_version: "0.1.1", extension: true, unsafe: false, platform: "iPhoneOS", firebase: true, firebase_project: "openingshq")
    path = File.join(@root, "Openings.ipa")
    FileUtils.rm_f(path)
    Zip::File.open(path, create: true) do |zip|
      bundles = [[OpeningsIosRelease::APP_PATH, app_identifier, "0.1.1"]]
      bundles << [OpeningsIosRelease::EXTENSION_PATH, OpeningsIosRelease::EXTENSION_IDENTIFIER, extension_version] if extension
      bundles.each do |bundle, identifier, version|
        zip.get_output_stream("#{bundle}/Info.plist") do |stream|
          stream.write({ "CFBundleIdentifier" => identifier, "CFBundleShortVersionString" => version, "CFBundleVersion" => "7", "CFBundleSupportedPlatforms" => [platform] }.to_plist)
        end
        zip.get_output_stream("#{bundle}/embedded.mobileprovision") { |stream| stream.write("synthetic profile decoded by test runner") }
      end
      if firebase
        zip.get_output_stream("#{OpeningsIosRelease::APP_PATH}/GoogleService-Info.plist") do |stream|
          stream.write({ "PROJECT_ID" => firebase_project, "BUNDLE_ID" => OpeningsIosRelease::IDENTIFIER,
            "GOOGLE_APP_ID" => "1:123456789:ios:0123456789abcdef", "API_KEY" => "synthetic-public-firebase-key" }.to_plist)
        end
      end
      zip.get_output_stream("../escape") { |stream| stream.write("invalid archive") } if unsafe
    end
    @options[:tested_sha256] = Digest::SHA256.file(path).hexdigest
    @manifest = { "schema_version" => 1, "app_identifier" => OpeningsIosRelease::IDENTIFIER,
      "version" => "0.1.1", "build" => "7", "sha256" => @options[:tested_sha256], "source_commit" => "a" * 40,
      "checks" => { "source_checks" => true, "archive" => true, "sdk_configuration" => true, "sentry_uploads_required" => true } }
    write_manifest
  end

  def write_manifest
    File.write(File.join(@root, "Openings.json"), JSON.generate(@manifest))
  end

  def inspect_ipa
    OpeningsIosRelease.inspect_ipa(@root, @options, runner: @runner)
  end

  def test_accepts_exact_app_and_extension_metadata_and_verifies_both_signatures
    ipa
    result = inspect_ipa
    assert_equal "7", result[:build]
    assert_equal @options[:tested_sha256], result[:sha256]
    assert_equal 2, @commands.count { |args| args.include?("--verify") && args.include?("--strict") }
    assert_equal 2, @commands.count { |args| args.first == "/usr/bin/security" }
  end

  def test_rejects_different_hash_before_signing_or_upload
    ipa
    @options[:tested_sha256] = "0" * 64
    assert_raises(ArgumentError) { inspect_ipa }
    assert_empty @commands
  end

  def test_rejects_another_app
    ipa(app_identifier: "example.other")
    assert_raises(ArgumentError) { inspect_ipa }
  end

  def test_requires_matching_extension_version_and_presence
    ipa(extension_version: "0.1.0")
    assert_raises(ArgumentError) { inspect_ipa }
    ipa(extension: false)
    assert_raises(ArgumentError) { inspect_ipa }
  end

  def test_rejects_development_ad_hoc_and_expired_profiles
    ipa
    @entitlement_changes = { "get-task-allow" => true }
    assert_raises(ArgumentError) { inspect_ipa }
    @entitlement_changes = {}
    @profile_changes = { "ProvisionedDevices" => ["synthetic-device"] }
    assert_raises(ArgumentError) { inspect_ipa }
    @profile_changes = { "ExpirationDate" => Time.now - 86_400 }
    assert_raises(ArgumentError) { inspect_ipa }
  end

  def test_rejects_wrong_team_and_code_signature_failure
    ipa
    @entitlement_changes = { "com.apple.developer.team-identifier" => "WRONGTEAM" }
    assert_raises(ArgumentError) { inspect_ipa }
    @entitlement_changes = {}
    assert_raises(ArgumentError) do
      OpeningsIosRelease.inspect_ipa(@root, @options, runner: ->(*_) { raise ArgumentError, "codesign failed" })
    end
  end

  def test_rejects_zip_path_escape
    ipa(unsafe: true)
    assert_raises(ArgumentError) { inspect_ipa }
  end

  def test_requires_physical_ios_production_push_and_shared_group
    ipa(platform: "iPhoneSimulator")
    assert_raises(ArgumentError) { inspect_ipa }
    ipa
    [{ "aps-environment" => "development" }, { "com.apple.security.application-groups" => [] }].each do |change|
      @entitlement_changes = change
      assert_raises(ArgumentError) { inspect_ipa }
    end
  end

  def test_rejects_signing_certificate_not_in_profile
    ipa
    @profile_changes = { "DeveloperCertificates" => [StringIO.new("unrelated signing certificate")] }
    assert_raises(ArgumentError) { inspect_ipa }
  end

  def test_requires_explicit_increasing_integer_build_and_matching_package_version
    %w[0 -1 1.2 7x].each do |invalid|
      assert_raises(ArgumentError) { OpeningsIosRelease.parameters(@root, @options.merge(build_number: invalid)) }
    end
    assert_raises(ArgumentError) { OpeningsIosRelease.parameters(@root, @options.merge(version_name: "1.0.0")) }
    assert_raises(ArgumentError) { OpeningsIosRelease.parameters(@root, @options.merge(ipa_path: "")) }
  end

  def test_rejects_manual_ipa_without_archive_manifest
    ipa
    File.unlink(File.join(@root, "Openings.json"))
    assert_raises(ArgumentError) { inspect_ipa }
    assert_empty @commands
  end

  def test_rejects_stale_or_incomplete_archive_manifest
    ipa
    [{ "sha256" => "0" * 64 }, { "version" => "0.1.0" }, { "build" => "6" }, { "source_commit" => "" },
      { "checks" => {} }, { "schema_version" => 0 }].each do |change|
      original = @manifest
      @manifest = original.merge(change); write_manifest
      assert_raises(ArgumentError) { inspect_ipa }
      @manifest = original
    end
    assert_empty @commands
  end

  def test_requires_firebase_configuration_inside_the_accepted_ipa
    ipa(firebase: false)
    assert_raises(ArgumentError) { inspect_ipa }
    ipa(firebase_project: "unrelated-project")
    assert_raises(ArgumentError) { inspect_ipa }
  end
end

class IosIntegrationPreflightTest < Minitest::Test
  def setup
    @environment = { "EXPO_PUBLIC_SENTRY_DSN" => "https://fixture@example.invalid/1", "EXPO_PUBLIC_MIXPANEL_TOKEN" => "fixture-token",
      "EXPO_PUBLIC_ONESIGNAL_APP_ID" => "00000000-0000-0000-0000-000000000001", "SENTRY_ORG" => "fixture-org",
      "SENTRY_PROJECT" => "fixture-project", "SENTRY_AUTH_TOKEN" => "fixture-build-token" }
  end

  def test_accepts_configured_integrations_without_serializing_secrets
    result = OpeningsIosRelease.integration_preflight!(@environment)
    assert_equal({ sdk_configuration: true, sentry_uploads_required: true }, result)
  end

  def test_rejects_missing_sdk_configuration_or_bypassed_symbol_uploads
    @environment.keys.each do |key|
      assert_raises(ArgumentError) { OpeningsIosRelease.integration_preflight!(@environment.merge(key => "")) }
    end
    %w[SENTRY_DISABLE_AUTO_UPLOAD SENTRY_DISABLE_XCODE_DEBUG_UPLOAD SENTRY_ALLOW_FAILURE EXPO_NO_CLIENT_ENV_VARS SKIP_BUNDLING].each do |flag|
      assert_raises(ArgumentError) { OpeningsIosRelease.integration_preflight!(@environment.merge(flag => "true")) }
    end
  end
end

module UI
  def self.user_error!(message)
    raise ArgumentError, message
  end
end

class IosLaneHarness
  attr_reader :lanes, :uploads, :submissions
  attr_accessor :latest
  def initialize
    @lanes = {}; @uploads = []; @submissions = []; @latest = 6
    instance_eval(File.read(File.expand_path("../../fastlane/Fastfile", __dir__)), File.expand_path("../../fastlane/Fastfile", __dir__))
  end
  def default_platform(*) = nil
  def desc(*) = nil
  def platform(name)
    @platform = name
    yield
  end
  def lane(name, &block) = @lanes[[@platform, name]] = block
  def ios_store_api = { test: true }
  def latest_testflight_build_number(**) = @latest
  def upload_to_testflight(**options) = @uploads << options
  def deliver(**options) = @submissions << options
end

class IosLaneTest < Minitest::Test
  def setup
    @harness = IosLaneHarness.new
    # Override the real credential helper, never reading production keys in tests.
    @harness.define_singleton_method(:ios_store_api) { { test: true } }
    @identity = { version: "0.1.1", build: "7", path: "/tmp/accepted.ipa", sha256: "a" * 64 }
  end

  def test_beta_uploads_only_the_verified_artifact_and_rejects_duplicate_build
    OpeningsIosRelease.stub(:inspect_ipa, @identity) do
      @harness.lanes[[:ios, :beta]].call({})
      assert_equal "/tmp/accepted.ipa", @harness.uploads.first[:ipa]
      assert_equal false, @harness.uploads.first[:distribute_external]
      @harness.latest = 7
      assert_raises(ArgumentError) { @harness.lanes[[:ios, :beta]].call({}) }
      assert_equal 1, @harness.uploads.size
    end
  end

  def test_submission_uses_exact_version_without_rebuilding_or_automatic_release
    OpeningsIosRelease.stub(:inspect_ipa, @identity) do
      @harness.lanes[[:ios, :release]].call({})
      assert_equal "0.1.1", @harness.submissions.first[:app_version]
      assert_equal "7", @harness.submissions.first[:build_number]
      assert_equal true, @harness.submissions.first[:skip_binary_upload]
      assert_equal false, @harness.submissions.first[:automatic_release]
    end
  end

  def test_invalid_archive_provenance_blocks_both_store_actions
    OpeningsIosRelease.stub(:inspect_ipa, ->(*) { raise ArgumentError, "Missing archive manifest" }) do
      %i[beta release].each { |lane| assert_raises(ArgumentError) { @harness.lanes[[:ios, lane]].call({}) } }
      assert_empty @harness.uploads
      assert_empty @harness.submissions
    end
  end
end
