var htmlToText = Npm.require('html-to-text');


scheduleCampaign = function (campaign, isTest) {
  var isTest = typeof isTest === 'undefined' ? false : isTest;

  var apiKey = Settings.get('mailChimpAPIKey');
  var listId = Settings.get('mailChimpListId');

  if(!!apiKey && !!listId){

		var wordCount = 15;
		var subject = campaign.subject;
		while (subject.length >= 150){
			subject = Telescope.utils.trimWords(subject, wordCount);
			wordCount--;
		}

    try {

      var api = new MailChimp(apiKey);
      var text = htmlToText.fromString(campaign.html, {wordwrap: 130});
      var defaultEmail = Settings.get('defaultEmail');
      var campaignOptions = {
        type: 'regular',
        options: {
          list_id: listId,
          subject: subject,
          from_email: defaultEmail,
          from_name: Settings.get('title')+ ' Top Posts',
        },
        content: {
          html: campaign.html,
          text: text
        }
      };

      console.log( '// Creating campaign…');

      // create campaign
      var mailchimpCampaign = api.call( 'campaigns', 'create', campaignOptions);

      console.log( '// Campaign created');
      // console.log(campaign)

      var scheduledTime = moment().utcOffset(0).add(1, 'hours').format("YYYY-MM-DD HH:mm:ss");

      var scheduleOptions = {
        cid: mailchimpCampaign.id,
        schedule_time: scheduledTime
      };

      // schedule campaign
      var schedule = api.call('campaigns', 'schedule', scheduleOptions);

      console.log('// Campaign scheduled for '+scheduledTime);
      // console.log(schedule)

      // if this is not a test, mark posts as sent
      if (!isTest)
        var updated = Posts.update({_id: {$in: campaign.postIds}}, {$set: {scheduledAt: new Date()}}, {multi: true})

      // send confirmation email
      var confirmationHtml = Telescope.email.getTemplate('emailDigestConfirmation')({
        time: scheduledTime,
        newsletterLink: mailchimpCampaign.archive_url,
        subject: subject
      });
      Telescope.email.send(defaultEmail, 'Newsletter scheduled', Telescope.email.buildTemplate(confirmationHtml));

    } catch (error) {
      console.log(error);
    }
    return subject;
  }
};

addToMailChimpList = function(userOrEmail, confirm, done){

  var user, email;

  var confirm = (typeof confirm === 'undefined') ? false : confirm; // default to no confirmation

  // not sure if it's really necessary that the function take both user and email?
  if (typeof userOrEmail === "string") {
    user = null;
    email = userOrEmail;
  } else if (typeof userOrEmail === "object") {
    user = userOrEmail;
    email = Users.getEmail(user);
    if (!email)
      throw 'User must have an email address';
  }

  var apiKey = Settings.get('mailChimpAPIKey');
  var listId = Settings.get('mailChimpListId');

  // add a user to a MailChimp list.
  // called when a new user is created, or when an existing user fills in their email
  if(!!apiKey && !!listId){

    try {

      console.log('// Adding "'+email+'" to MailChimp list…');

      var api = new MailChimp(apiKey);
      var subscribeOptions = {
        id: listId,
        email: {"email": email},
        double_optin: confirm
      };

      // subscribe user
      var subscribe = api.call('lists', 'subscribe', subscribeOptions);

      // mark user as subscribed
      if (!!user) {
        Users.setSetting(user, 'newsletter.subscribeToNewsletter', true);
      }

      console.log("// User subscribed");

      return subscribe;

    } catch (error) {
      throw new Meteor.Error("subscription-failed", error.message);
    }
  }
};

addToMailChimpSegment = function(subscription, segment, segmentType = 'name') {
  
  var listId = Settings.get('mailChimpListId');

  var segmentId = ( segmentType === 'name' ) ? findOrCreateMailChimpSegment(segment) : segment.id;
  var data = {
    id: listId,
    seg_id: segmentId,
    batch: [ {email: subscription.subscribedEmail} ]
  }
  return callMailChimpMethod('lists', 'static-segment-members-add', data, function(result){
    Subscriptions.update(subscription, { $set: { inNewsletterSegment: true } });
  });
};

removeFromMailChimpSegment = function(subscription, segment, segmentType = 'name') {
  
  var listId = Settings.get('mailChimpListId');

  var segmentId = ( segmentType === 'name' ) ? findOrCreateMailChimpSegment(segment) : segment.id;
  var data = {
    id: listId,
    seg_id: segmentId,
    batch: [ {email: subscription.subscribedEmail} ]
  }
  return callMailChimpMethod('lists', 'static-segment-members-del', data, function(result){
    Subscriptions.update(subscription, { $set: { inNewsletterSegment: false } });
  });
};

findOrCreateMailChimpSegment = function(segmentName) {

  var listId = Settings.get('mailChimpListId');

  var data = { id: listId };

  var segments = callMailChimpMethod('lists', 'static-segments', data);

  var segment = _.findWhere(segments, { name: segmentName } );
      
  if(segment === undefined){
    data.name = segmentName;
    segment = callMailChimpMethod('lists', 'static-segment-add', data);
  }
  return segment;
};

callMailChimpMethod = function(section, method, data, callback) {
  
  var apiKey = Settings.get('mailChimpAPIKey');
  var listId = Settings.get('mailChimpListId');

  if(!!apiKey && !!listId){

    try {
      var api = new MailChimp(apiKey);
      var result = api.call(section, method, data);
      if(typeof callback === 'function') {
        callback.call(api, result);
      }
      return result;
    } catch (error) {
      throw new Meteor.Error("subscription-failed", error.message);
    }
  }
};


Meteor.methods({
  subscribeToList: function(email) {
    if(email === undefined && this.userId === undefined){
      throw new Meteor.Error(500, "Newsletter subscription requires either a logged in user or an email address");
    }
    var emailAddress = email ? email : Users.getEmailById(this.userId);
    var subscription;
    if( Settings.get('enableSubscriptionToCategory', false ) ) { 
      // Create subscription for email
      // TODO: need to manage the segment for general newsletter
      // segments get added here, but mainly handled in the send emails bit
      subscription = Subscriptions.subscribe(email, this.userId);
    }
    // If this is an email for someone who has an account but no user id on the subscription,
    // then set the user id (this could happen if a user is not signed in, but subscribes to
    // the newsletter).
    var user = Users.findOne({ 'emails.address': email });
    if( !subscription.userId && user ){
      Subscriptions.update(subscription, { $set: { userId: user._id } });
    }

    try {
      var mc = addToMailChimpList(email, true);
      console.log(mc);
    } catch (error) {
      throw new Meteor.Error(500, error.message);
    }
    return subscription;
  },
  addCurrentUserToMailChimpList: function(){
    var currentUser = Meteor.users.findOne(this.userId);
    try {
      return addToMailChimpList(currentUser, false);
    } catch (error) {
      throw new Meteor.Error(500, error.message);
    }
  },
  addEmailToMailChimpList: function (email) {
    try {
      return addToMailChimpList(email, true);
    } catch (error) {
      throw new Meteor.Error(500, error.message);
    }
  }
});
