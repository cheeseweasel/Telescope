Subscriptions = new Mongo.Collection("subscriptions");

Subscriptions.schema = new SimpleSchema({

  _id: {
    type: String,
    optional: true
  },
  createdAt: {
    type: Date,
    optional: true
  },
  categories: {
    type: String,
    optional: true,
    editableBy: ["admin", "member"],
    autoform: {
      noselect: true,
      type: "bootstrap-category",
      order: 50,
      options: function () {
        var categories = Categories.find().map(function (category) {
          return {
            value: category._id,
            label: category.name
          };
        });
        return categories;
      }
    }
  },
  subscribedEmail: {
    type: String,
    optional: false
  },
  userId: {
    type: String,
    optional: true
  }
});

Subscriptions.subscribe = function(email, userId) {
  // Is there already a subscription for this email?
  // TODO: Is the userid blank, but a user with that email exists?
  // Create a subscription if not one already
  // Return the subscription id
  var subscription = Subscriptions.findOne({subscribedEmail: email});

  if( !subscription ) {
    var newData = {
      subscribedEmail: email,
      createdAt: new Date()
    };
    if( userId ) { newData['userId'] = userId; }
    subscription = Subscriptions.insert(newData);
  }
  return subscription;
}

Meteor.startup(function(){
  Subscriptions.internationalize();
});

Subscriptions.attachSchema(Subscriptions.schema);

Users.addField({
  fieldName: 'telescope.subscribedItems',
  fieldSchema: {
    type: Object,
    optional: true,
    blackbox: true,
    autoform: {
      omit: true
    }
  }
});

Telescope.modules.add("profileEdit", {
  template: 'user_subscribed_posts',
  order: 6
});

Telescope.modules.add("profileEdit", {
  template: 'user_subscribed_categories',
  order: 6
});

Telescope.modules.add("profileEdit", {
  template: 'user_subscribed_authors',
  order: 6
});

Posts.views.add("userSubscribedPosts", function (terms) {
  var user = Meteor.users.findOne(terms.userId),
      postsIds = [];

  if (user && user.telescope.subscribedItems && user.telescope.subscribedItems.Posts) {
    postsIds = _.pluck(user.telescope.subscribedItems.Posts, "itemId");
  }

  return {
    find: {_id: {$in: postsIds}},
    options: {limit: 5, sort: {postedAt: -1}}
  };
});

var hasSubscribedItem = function (item, user) {
  return item.subscribers && item.subscribers.indexOf(user._id) != -1;
};

var addSubscribedItem = function (userId, item, collectionName) {
  var field = 'telescope.subscribedItems.' + collectionName;
  var add = {};
  add[field] = item;
  Meteor.users.update({_id: userId}, {
    $addToSet: add
  });
};

var removeSubscribedItem = function (userId, itemId, collectionName) {
  var field = 'telescope.subscribedItems.' + collectionName;
  var remove = {};
  remove[field] = {itemId: itemId};
  Meteor.users.update({_id: userId}, {
    $pull: remove
  });
};

subscribeItem = function (collection, itemId, user) {
  var item = collection.findOne(itemId),
      collectionName = collection._name.slice(0,1).toUpperCase() + collection._name.slice(1);

  if (!user || !item || hasSubscribedItem(item, user))
    return false;

  // author can't subscribe item
  if (item.userId && item.userId === user._id)
    return false

  // Subscribe
  var result = collection.update({_id: itemId, subscribers: { $ne: user._id }}, {
    $addToSet: {subscribers: user._id},
    $inc: {subscriberCount: 1}
  });

  if (result > 0) {
    // Add item to list of subscribed items
    var obj = {
      itemId: item._id,
      subscribedAt: new Date()
    };
    addSubscribedItem(user._id, obj, collectionName);
  }

  return true;
};

unsubscribeItem = function (collection, itemId, user) {
  var user = Meteor.user(),
      item = collection.findOne(itemId),
      collectionName = collection._name.slice(0,1).toUpperCase()+collection._name.slice(1);

  if (!user || !item  || !hasSubscribedItem(item, user))
    return false;

  // Unsubscribe
  var result = collection.update({_id: itemId, subscribers: user._id }, {
    $pull: {subscribers: user._id},
    $inc: {subscriberCount: -1}
  });

  if (result > 0) {
    // Remove item from list of subscribed items
    removeSubscribedItem(user._id, itemId, collectionName);
  }
  return true;
};

