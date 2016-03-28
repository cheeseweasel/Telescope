Template.manage_subscriptions.onCreated(function () {

  var sub = Telescope.subsManager.subscribe('subscription', FlowRouter.getParam("subscriptionId"));
  
  if( sub.userId ) {
    console.log(Meteor.user());
  }

  var template = this;

  // initialize the reactive variables
  template.ready = new ReactiveVar(false);

  // Autorun 3: when subscription is ready, update the data helper's terms
  template.autorun(function () {

    var subscriptionsReady = sub.ready(); // ⚡ reactive ⚡

    // if subscriptions are ready, set terms to subscriptionsTerms
    if (subscriptionsReady) {
      template.ready.set(true);
    }
  });
});

Template.manage_subscriptions.helpers({
  ready: function () {
    return Template.instance().ready.get();
  },
  subscription: function() {
    return Subscriptions.findOne({_id: FlowRouter.getParam("subscriptionId")});
  },
  subscriptionFields: function () {
    return Subscriptions.simpleSchema().getEditableFields(Meteor.user());
  },
  inProgress: function() {
    return Meteor.loggingIn() || !Template.instance().ready.get();
  },
  canUpdate: function() {
    var sub = Subscriptions.findOne({_id: FlowRouter.getParam("subscriptionId")});
    if(sub.userId) {
      return sub.userId === Meteor.userId();
    }
    return true;
  }
});

