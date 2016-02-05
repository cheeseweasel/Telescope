Template.user_subscribed_categories.helpers({

  subscribedCategories: function () {
    return this.telescope.subscribedItems.Categories;
  },

  categoryLink: function() {
    var category = Categories.findOne(this.itemId);
    return Categories.getUrl(category);
  },
  categoryName: function() {
    var category = Categories.findOne(this.itemId);
    return category.name;
  },

  subscribedAt: function() {
    return moment(this.subscribedAt).format("MM/DD/YYYY, HH:mm");
  }
});
