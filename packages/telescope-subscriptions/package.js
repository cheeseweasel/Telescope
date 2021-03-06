Package.describe({
  name: "telescope:subscriptions",
  summary: "Manage subscriptions to telescope objects - posts, categories & authors",
  version: "0.25.6",
  git: "https://github.com/TelescopeJS/telescope-subscriptions.git"
});


Package.onUse(function (api) {

  api.versionsFrom("METEOR@1.0");

  // --------------------------- 1. Meteor packages dependencies ---------------------------

  // automatic (let the package specify where it's needed)

  api.use(['telescope:core@0.25.6', 'telescope:tags@0.25.6']);

  // ---------------------------------- 2. Files to include ----------------------------------

  // i18n config (must come first)

  api.addFiles([
    'package-tap.i18n'
  ], ['client', 'server']);

  // both

  api.addFiles([
    'lib/subscriptions.js',
    'lib/posts.js',
    'lib/categories.js',
    'lib/authors.js',
    'lib/routes.js',
  ], ['client', 'server']);

  // client

  api.addFiles([
    'lib/client/templates/post_subscribe.html',
    'lib/client/templates/post_subscribe.js',
    'lib/client/templates/category_subscribe.html',
    'lib/client/templates/category_subscribe.js',
    'lib/client/templates/manage_subscriptions.html',
    'lib/client/templates/manage_subscriptions.js',
    'lib/client/templates/user_subscribed_posts.html',
    'lib/client/templates/user_subscribed_posts.js',
    'lib/client/templates/user_subscribed_categories.html',
    'lib/client/templates/user_subscribed_categories.js'
  ], ['client']);

  // server

  api.addFiles([
    'lib/server/publications.js'
  ], ['server']);

  // i18n languages (must come last)

  var languages = ["ar", "bg", "cs", "da", "de", "el", "en", "es", "et", "fr", "hu", "id", "it", "ja", "kk", "ko", "nl", "pl", "pt-BR", "ro", "ru", "sl", "sv", "th", "tr", "vi", "zh-CN"];
  var languagesPaths = languages.map(function (language) {
    return "i18n/"+language+".i18n.json";
  });
  api.addFiles(languagesPaths, ["client", "server"]);

  api.export([
    'subscribeItem',
    'unsubscribeItem',
    'Subscriptions'
  ]);

});
