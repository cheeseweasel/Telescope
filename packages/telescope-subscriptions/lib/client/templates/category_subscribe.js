Template.category_subscribe.helpers({
  canSubscribe: function() {
    // this is controlled via the settings
    return true; //Settings.get('enableSubscriptionToCategory', false);
  },
  subscribed: function() {
    var user = Meteor.user();
    if (!user) return false;

    return _.include(this.subscribers, user._id);
  }
});

Template.category_subscribe.events({
  'click .subscribe-link': function(e, instance) {
    e.preventDefault();
    if (this.userId === Meteor.userId())
      return;

    var category = this;

    if (!Meteor.user()) {
      FlowRouter.go('atSignIn');
      Messages.flash(i18n.t("please_log_in_first"), "info");
    }

    Meteor.call('subscribeCategory', category._id, function(error, result) {
      if (result)
        Events.track("category subscribed", {'_id': category._id});
    });
  },

  'click .unsubscribe-link': function(e, instance) {
    e.preventDefault();
    var category = this;

    if (!Meteor.user()) {
      FlowRouter.go('atSignIn');
      Messages.flash(i18n.t("please_log_in_first"), "info");
    }

    Meteor.call('unsubscribeCategory', category._id, function(error, result) {
      if (result)
        Events.track("category unsubscribed", {'_id': category._id});
    });
  }
});
