
// We batch emails so as not to send too many in one go
// these are default values for the batch size and send interval, interval is measured in milliseconds
var defaultBatchSize = 1;
var defaultBatchInterval = 10000;

scheduleIndividualNewsletters = function() {
  if( !Settings.get('enableSubscriptionToCategory', false ) ) { return false; }

  var users = loadUsersForNewsletter();

  scheduleBatch(users);

  return users;
};

var loadUsersForNewsletter = function() {
  users = Users.find( { 'telescope.subscribedItems.Categories': { $exists: true, $ne: [] } } );
  return users.fetch();
};

var scheduleBatch = function(users) {

  var current = _.first(users, defaultBatchSize);

  sendBatch(current);

  if(current.length < users.length) {

    var remainder = _.last(users, users.length - current.length);

    Meteor.setTimeout( function() {
      scheduleBatch( remainder );
    }, defaultBatchInterval );
  }
};

var sendBatch = function(users) {

  users.forEach(function(user) {
    var newsletter = buildIndividualNewsletter(user);
    console.log('sending newsletter: ' + user);
    // And actually send the email now!
  });
};

buildIndividualNewsletter = function(user) {
  var categoryIds = _.pluck(user.telescope.subscribedItems.Categories, 'itemId');
  var query = { categories: { $in: categoryIds } };
  var posts = getCampaignPosts(Settings.get('postsPerNewsletter', 5), query);
  var campaign = buildCampaign(posts);
  return campaign;
};
