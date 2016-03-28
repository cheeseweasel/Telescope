
// We batch emails so as not to send too many in one go
// these are default values for the batch size and send interval, interval is measured in milliseconds
var defaultBatchSize = 1;
var defaultBatchInterval = 10000;

scheduleIndividualNewsletters = function() {
  if( !Settings.get('enableSubscriptionToCategory', false ) ) { return false; }

  var subs = loadSubscriptionsForNewsletter();

  var newsletter = scheduleBatch(subs);

  return newsletter;
};

var loadSubscriptionsForNewsletter = function() {
  subs = Subscriptions.find( { categories: { $exists: true, $ne: [] } } );
  return subs.fetch();
};

var scheduleBatch = function(subs) {

  var current = _.first(subs, defaultBatchSize);

  var newsletter = sendBatch(current);

  if(current.length < subs.length) {

    var remainder = _.last(subs, subs.length - current.length);

    Meteor.setTimeout( function() {
      scheduleBatch( remainder );
    }, defaultBatchInterval );
  }
  return newsletter;
};

var sendBatch = function(subs) {

  var newsletter;
  subs.forEach(function(sub) {
    newsletter = buildIndividualNewsletter(sub);
    console.log('sending newsletter: ' + sub.subscribedEmail);
    // And actually send the email now!
  });
  return newsletter;
};

buildIndividualNewsletter = function(sub) {
  var categoryIds = sub.categories;
  var query = { categories: { $in: categoryIds } };
  var posts = getCampaignPosts(Settings.get('postsPerNewsletter', 5), query);
  console.log(posts);
  var campaign = buildCampaign(posts);
  return campaign;
};
