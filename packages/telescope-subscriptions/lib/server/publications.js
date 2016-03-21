Meteor.publish('userSubscribedPosts', function(terms) {

  terms.userId = this.userId; // add userId to terms

  var parameters = Posts.parameters.get(terms);
  var posts = Posts.find(parameters.find, parameters.options);
  return posts;
});

Meteor.publish('subscription', function(subscriptionId) {
  return Subscriptions.find({_id: subscriptionId});
});
