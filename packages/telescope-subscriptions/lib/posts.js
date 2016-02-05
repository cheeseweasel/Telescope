
Posts.addField({
  fieldName: 'subscribers',
  fieldSchema: {
    type: [String],
    optional: true,
    autoform: {
      omit: true
    }
  }
});

Posts.addField({
  fieldName: 'subscriberCount',
  fieldSchema: {
    type: Number,
    optional: true,
    autoform: {
      omit: true
    }
  }
});

Telescope.modules.add("commentThreadBottom", {
  template: 'post_subscribe',
  order: 10
});


Meteor.methods({
  subscribePost: function(postId) {
    check(postId, String);
    return subscribeItem.call(this, Posts, postId, Meteor.user());
  },
  unsubscribePost: function(postId) {
    check(postId, String);
    return unsubscribeItem.call(this, Posts, postId, Meteor.user());
  }
});
