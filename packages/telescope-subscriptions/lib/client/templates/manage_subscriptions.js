Template.manage_subscriptions.helpers({
  emailAddress: function() {
    return subscription().subscribedEmail;
  },
  subscription: function() {
    return subscription();
  },
  subscriptionFields: function () {
    return Subscriptions.simpleSchema().getEditableFields(Meteor.user());
  }
});

var subscription = function() {
  console.log(FlowRouter.getParam("subscriptionId"));
  console.log(Subscriptions.findOne(FlowRouter.getParam("subscriptionId")));
  return Subscriptions.findOne({_id: FlowRouter.getParam("subscriptionId")});
}
