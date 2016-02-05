
Categories.addField({
  fieldName: 'subscribers',
  fieldSchema: {
    type: [String],
    optional: true,
    autoform: {
      omit: true
    }
  }
});

Categories.addField({
  fieldName: 'subscriberCount',
  fieldSchema: {
    type: Number,
    optional: true,
    autoform: {
      omit: true
    }
  }
});

Telescope.modules.add("categoryTitleBottom", {
  template: 'category_subscribe',
  order: 10
});

Meteor.methods({
  subscribeCategory: function(categoryId) {
    check(categoryId, String);
    return subscribeItem.call(this, Categories, categoryId, Meteor.user());
  },
  unsubscribeCategory: function(categoryId) {
    check(categoryId, String);
    return unsubscribeItem.call(this, Categories, categoryId, Meteor.user());
  },
});
